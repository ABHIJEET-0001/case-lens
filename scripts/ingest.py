"""
scripts/ingest.py
─────────────────
CaseLens data ingestion pipeline.

Loads Indian court judgments from a Hugging Face dataset (default: ILDC)
or a local CSV/JSON file, cleans the text, extracts metadata, stores records
in PostgreSQL, chunks and embeds the text, and builds a FAISS index + TF-IDF
matrix for the search API.

Usage (run inside the api Docker container):
  # From HuggingFace (downloads ILDC dataset, ~50 MB)
  python scripts/ingest.py --source huggingface --limit 500

  # From local CSV  (columns: text, title, court, citation, date, case_type, outcome)
  python scripts/ingest.py --source csv --file data/sample/judgments.csv

  # Use InLegalBERT instead of default MiniLM
  python scripts/ingest.py --source huggingface --model inlegalbert --limit 200

Outputs (saved to data/index/):
  judgments.faiss   FAISS IndexFlatIP (cosine similarity via L2-norm)
  id_map.json       maps FAISS row index -> judgment UUID string
  tfidf.pkl         fitted TF-IDF vectorizer + document matrix (baseline)
"""
import argparse
import json
import os
import sys
import uuid
import pickle
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np
from tqdm import tqdm

# ── Make the backend `app` package importable ─────────────────────────────────
# When running inside the container, /app is the working dir and PYTHONPATH.
# When running locally, adjust sys.path to find the backend/app package.
_REPO_ROOT = Path(__file__).resolve().parent.parent
_BACKEND = _REPO_ROOT / "backend"
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from app.config import settings
from app.db.session import SessionLocal
from app.db.models import Judgment

from scripts.clean_text import (
    clean_judgment_text,
    extract_citation,
    extract_court,
    extract_judgment_date,
    extract_case_type,
    extract_outcome,
    chunk_text,
)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("ingest")

# ── Constants ─────────────────────────────────────────────────────────────────
INDEX_DIR = Path("/app/data/index")       # Docker volume path
CHUNK_WORDS = 300
OVERLAP_WORDS = 50
EMBED_BATCH = 32                          # judgments embedded per batch
TFIDF_MAX_FEATURES = 50_000

MODEL_ALIASES = {
    "minilm": "sentence-transformers/all-MiniLM-L6-v2",
    "inlegalbert": "law-ai/InLegalBERT",
    "bge-small": "BAAI/bge-small-en-v1.5",
}


# ── Data loaders ──────────────────────────────────────────────────────────────

def load_from_huggingface(limit: Optional[int]) -> list[dict]:
    """
    Load judgments from the ILDC dataset on Hugging Face.
    Dataset: Exploration-Lab/ILDC  (IIT Delhi — publicly available)
    Falls back to a simple structure if the schema differs.
    """
    from datasets import load_dataset

    log.info("Downloading ILDC dataset from Hugging Face (Exploration-Lab/ILDC)...")
    try:
        ds = load_dataset("Exploration-Lab/ILDC", "ILDC_single", trust_remote_code=True)
        split = ds.get("train") or ds[list(ds.keys())[0]]
    except Exception as exc:
        log.error("Failed to load Exploration-Lab/ILDC: %s", exc)
        log.info("Trying fallback dataset: pile-of-law/pile-of-law ...")
        ds = load_dataset(
            "pile-of-law/pile-of-law",
            "indian_courts",
            split="train",
            streaming=True,
            trust_remote_code=True,
        )
        rows = []
        for i, row in enumerate(ds):
            if limit and i >= limit:
                break
            rows.append({"text": row.get("text", ""), "title": row.get("title", "")})
        return rows

    if limit:
        split = split.select(range(min(limit, len(split))))

    rows = []
    for item in split:
        rows.append({
            "text": item.get("text") or item.get("document") or "",
            "title": item.get("name") or item.get("title") or "",
            "label": item.get("label"),        # 0/1 — kept for future use
        })
    return rows


def load_from_csv(filepath: str, limit: Optional[int]) -> list[dict]:
    """
    Load judgments from a local CSV file.
    Required column: `text`
    Optional columns: title, court, citation, date, case_type, outcome
    """
    import csv

    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {filepath}")

    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if limit and i >= limit:
                break
            if not row.get("text", "").strip():
                continue
            rows.append(row)

    log.info("Loaded %d rows from %s", len(rows), filepath)
    return rows


def load_from_json(filepath: str, limit: Optional[int]) -> list[dict]:
    """Load judgments from a JSON array file."""
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"JSON file not found: {filepath}")

    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict):
        data = data.get("judgments") or data.get("data") or list(data.values())

    if limit:
        data = data[:limit]

    log.info("Loaded %d records from %s", len(data), filepath)
    return data


# ── Database upsert ───────────────────────────────────────────────────────────

def row_to_judgment(raw: dict) -> Optional[Judgment]:
    """
    Convert a raw data row (from any source) into a Judgment ORM object.
    Returns None if the text is too short to be useful.
    """
    text = raw.get("text") or raw.get("full_text") or raw.get("document") or ""
    text = clean_judgment_text(text)

    if len(text.split()) < 50:
        return None   # skip stubs / empty records

    # Prefer explicit columns; fall back to extraction from text
    citation = raw.get("citation") or extract_citation(text)
    court = raw.get("court") or extract_court(text)
    j_date = None
    if raw.get("date"):
        try:
            j_date = datetime.strptime(raw["date"], "%Y-%m-%d").date()
        except ValueError:
            j_date = extract_judgment_date(text)
    else:
        j_date = extract_judgment_date(text)

    return Judgment(
        id=uuid.uuid4(),
        title=raw.get("title") or (text[:100].replace("\n", " ") + "..."),
        citation=citation,
        court=court,
        case_type=raw.get("case_type") or extract_case_type(text),
        judgment_date=j_date,
        outcome=raw.get("outcome") or extract_outcome(text),
        source_url=raw.get("source_url") or raw.get("url"),
        full_text=text,
        word_count=len(text.split()),
        is_indexed=False,
    )


def upsert_judgments(rows: list[dict]) -> list[Judgment]:
    """
    Insert new judgments into the DB. Skips duplicates by citation.
    Returns the list of Judgment objects (new + existing) for embedding.
    """
    db = SessionLocal()
    inserted, skipped = 0, 0
    judgment_objects = []

    try:
        for raw in tqdm(rows, desc="Storing judgments", unit="doc"):
            j = row_to_judgment(raw)
            if j is None:
                skipped += 1
                continue

            # Dedup by citation if available
            if j.citation:
                existing = db.query(Judgment).filter_by(citation=j.citation).first()
                if existing:
                    judgment_objects.append(existing)
                    skipped += 1
                    continue

            db.add(j)
            judgment_objects.append(j)
            inserted += 1

            # Flush in batches to avoid holding a huge transaction
            if inserted % 100 == 0:
                db.commit()

        db.commit()
        log.info("DB: %d inserted, %d skipped (duplicates/too short)", inserted, skipped)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    return judgment_objects


# ── Embedding & indexing ──────────────────────────────────────────────────────

def load_embedding_model(model_key: str):
    """Load a SentenceTransformer model by alias or full HuggingFace name."""
    from sentence_transformers import SentenceTransformer

    model_name = MODEL_ALIASES.get(model_key, model_key)
    log.info("Loading embedding model: %s", model_name)
    try:
        model = SentenceTransformer(model_name)
        log.info("Model loaded. Embedding dim: %d", model.get_sentence_embedding_dimension())
        return model
    except Exception as exc:
        log.warning("Failed to load %s (%s). Falling back to MiniLM.", model_name, exc)
        return SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def embed_judgments(
    judgments: list[Judgment],
    model,
    index_dir: Path,
) -> None:
    """
    For each judgment:
      1. Chunk the full_text into overlapping word windows.
      2. Embed all chunks in batches.
      3. Mean-pool chunk embeddings → one judgment-level vector.
      4. L2-normalise the vector (enables cosine similarity via inner product).
    Saves:
      - FAISS IndexFlatIP  →  index_dir/judgments.faiss
      - id_map.json        →  index_dir/id_map.json  (row_index -> UUID str)
    Also marks each judgment as is_indexed=True in the DB.
    """
    import faiss

    index_dir.mkdir(parents=True, exist_ok=True)
    dim = model.get_sentence_embedding_dimension()
    index = faiss.IndexFlatIP(dim)   # inner product = cosine after L2-norm
    id_map: list[str] = []           # position i → judgment UUID

    db = SessionLocal()
    try:
        log.info("Embedding %d judgments (dim=%d)...", len(judgments), dim)

        for j in tqdm(judgments, desc="Embedding", unit="doc"):
            chunks = chunk_text(j.full_text, CHUNK_WORDS, OVERLAP_WORDS)

            # Embed chunks in one shot (SentenceTransformer handles batching internally)
            chunk_vecs = model.encode(
                chunks,
                batch_size=EMBED_BATCH,
                show_progress_bar=False,
                normalize_embeddings=True,  # L2-norm per chunk
                convert_to_numpy=True,
            )   # shape: (n_chunks, dim)

            # Mean-pool across chunks → single judgment vector
            jvec = chunk_vecs.mean(axis=0)

            # Re-normalise the mean vector (mean of unit vectors isn't unit)
            norm = np.linalg.norm(jvec)
            if norm > 0:
                jvec = jvec / norm

            index.add(jvec.reshape(1, -1).astype("float32"))
            id_map.append(str(j.id))

            # Mark as indexed in DB
            db_j = db.get(Judgment, j.id)
            if db_j:
                db_j.is_indexed = True

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    # Save FAISS index
    faiss_path = index_dir / "judgments.faiss"
    faiss.write_index(index, str(faiss_path))
    log.info("FAISS index saved: %s  (%d vectors)", faiss_path, index.ntotal)

    # Save ID map
    id_map_path = index_dir / "id_map.json"
    id_map_path.write_text(json.dumps(id_map, indent=2))
    log.info("ID map saved: %s", id_map_path)


def build_tfidf(judgments: list[Judgment], index_dir: Path) -> None:
    """
    Fit a TF-IDF vectorizer on all judgment texts and save:
      - tfidf.pkl  →  {"vectorizer": TfidfVectorizer, "matrix": sparse_matrix, "ids": [uuid...]}

    This is the keyword-search baseline used for semantic vs keyword comparison
    in the Model Report screen.
    """
    from sklearn.feature_extraction.text import TfidfVectorizer

    log.info("Building TF-IDF index on %d judgments...", len(judgments))
    texts = [j.full_text for j in judgments]
    ids = [str(j.id) for j in judgments]

    vectorizer = TfidfVectorizer(
        max_features=TFIDF_MAX_FEATURES,
        sublinear_tf=True,
        min_df=2,
        ngram_range=(1, 2),
        strip_accents="unicode",
    )
    matrix = vectorizer.fit_transform(texts)

    tfidf_path = index_dir / "tfidf.pkl"
    with open(tfidf_path, "wb") as f:
        pickle.dump({"vectorizer": vectorizer, "matrix": matrix, "ids": ids}, f)

    log.info(
        "TF-IDF index saved: %s  (%d docs, %d features)",
        tfidf_path, matrix.shape[0], matrix.shape[1],
    )


# ── Main ──────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="CaseLens judgment ingestion pipeline")
    p.add_argument(
        "--source",
        choices=["huggingface", "csv", "json"],
        default="huggingface",
        help="Data source (default: huggingface — downloads ILDC dataset)",
    )
    p.add_argument(
        "--file",
        default=None,
        help="Path to local CSV or JSON file (required when --source is csv/json)",
    )
    p.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum number of judgments to process (useful for testing)",
    )
    p.add_argument(
        "--model",
        default="minilm",
        help=(
            "Embedding model alias or HuggingFace name. "
            "Aliases: minilm (default), inlegalbert, bge-small"
        ),
    )
    p.add_argument(
        "--skip-embed",
        action="store_true",
        help="Store in DB only, skip FAISS/TF-IDF building (for quick DB tests)",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()

    log.info("=" * 60)
    log.info("CaseLens Ingestion Pipeline")
    log.info("Source: %s | Limit: %s | Model: %s", args.source, args.limit, args.model)
    log.info("=" * 60)

    # 1. Load raw data
    if args.source == "huggingface":
        rows = load_from_huggingface(args.limit)
    elif args.source == "csv":
        if not args.file:
            raise ValueError("--file is required when --source is csv")
        rows = load_from_csv(args.file, args.limit)
    else:
        if not args.file:
            raise ValueError("--file is required when --source is json")
        rows = load_from_json(args.file, args.limit)

    if not rows:
        log.error("No data loaded. Exiting.")
        return

    log.info("Loaded %d raw records.", len(rows))

    # 2. Clean, extract metadata, store in DB
    judgments = upsert_judgments(rows)

    if not judgments:
        log.error("No valid judgments after cleaning. Exiting.")
        return

    if args.skip_embed:
        log.info("--skip-embed set. Skipping FAISS and TF-IDF build. Done.")
        return

    # 3. Load embedding model
    model = load_embedding_model(args.model)

    # 4. Build FAISS semantic index
    embed_judgments(judgments, model, INDEX_DIR)

    # 5. Build TF-IDF keyword baseline
    build_tfidf(judgments, INDEX_DIR)

    log.info("=" * 60)
    log.info("Ingestion complete. %d judgments indexed.", len(judgments))
    log.info("Index dir: %s", INDEX_DIR)
    log.info("=" * 60)


if __name__ == "__main__":
    main()
