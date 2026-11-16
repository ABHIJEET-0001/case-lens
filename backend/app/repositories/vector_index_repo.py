"""
app/repositories/vector_index_repo.py
─────────────────────────────────────
Manages FAISS vector index, TF-IDF matrix, and embedding model inference.
Cached as a singleton in memory for sub-millisecond retrieval.
"""
import os
import json
import pickle
import logging
from pathlib import Path
from typing import List, Tuple, Dict, Optional
from uuid import UUID

import numpy as np

log = logging.getLogger("vector_repo")

# Directory where FAISS index and TF-IDF baseline are persisted
INDEX_DIR = Path(os.environ.get("INDEX_DIR", "/app/data/index"))
# Local fallback path for development without docker volume
LOCAL_INDEX_DIR = Path("data/index")


class VectorIndexRepository:
    _instance: Optional["VectorIndexRepository"] = None

    def __init__(self):
        self.index = None
        self.id_map: List[str] = []
        self.embedding_model = None
        self.tfidf_vectorizer = None
        self.tfidf_matrix = None
        self.tfidf_ids: List[str] = []
        self.is_ready = False
        self._load_indexes()

    @classmethod
    def get_instance(cls) -> "VectorIndexRepository":
        if cls._instance is None:
            cls._instance = VectorIndexRepository()
        return cls._instance

    def _resolve_index_dir(self) -> Path:
        if INDEX_DIR.exists():
            return INDEX_DIR
        if LOCAL_INDEX_DIR.exists():
            return LOCAL_INDEX_DIR
        return INDEX_DIR

    def _load_indexes(self):
        idx_dir = self._resolve_index_dir()
        faiss_path = idx_dir / "judgments.faiss"
        id_map_path = idx_dir / "id_map.json"
        tfidf_path = idx_dir / "tfidf.pkl"

        if not faiss_path.exists() or not id_map_path.exists():
            log.warning(
                "FAISS index files not found at %s. Vector search will be unavailable until scripts/ingest.py is run.",
                idx_dir,
            )
            return

        try:
            import faiss

            log.info("Loading FAISS index from %s...", faiss_path)
            self.index = faiss.read_index(str(faiss_path))
            with open(id_map_path, "r", encoding="utf-8") as f:
                self.id_map = json.load(f)

            log.info("FAISS index loaded. Total vectors: %d", self.index.ntotal)

            # Load SentenceTransformer model
            from sentence_transformers import SentenceTransformer

            model_name = os.environ.get(
                "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
            )
            log.info("Loading embedding model: %s...", model_name)
            self.embedding_model = SentenceTransformer(model_name)

            # Load TF-IDF baseline if present
            if tfidf_path.exists():
                with open(tfidf_path, "rb") as f:
                    tfidf_data = pickle.load(f)
                    self.tfidf_vectorizer = tfidf_data["vectorizer"]
                    self.tfidf_matrix = tfidf_data["matrix"]
                    self.tfidf_ids = tfidf_data["ids"]
                log.info("TF-IDF matrix loaded. Documents: %d", len(self.tfidf_ids))

            self.is_ready = True
        except Exception as exc:
            log.error("Failed to load vector indexes: %s", exc)
            self.is_ready = False

    def search_semantic(
        self, query: str, top_k: int = 20
    ) -> List[Tuple[UUID, float]]:
        """
        Embed query, perform inner-product cosine search in FAISS,
        and return list of (judgment_uuid, similarity_score).
        """
        if not self.is_ready or self.index is None or self.embedding_model is None:
            return []

        # Encode and normalize query vector (shape: 1, dim)
        query_vec = self.embedding_model.encode(
            [query],
            normalize_embeddings=True,
            convert_to_numpy=True,
        ).astype("float32")

        actual_k = min(top_k, self.index.ntotal)
        if actual_k <= 0:
            return []

        scores, indices = self.index.search(query_vec, actual_k)

        results: List[Tuple[UUID, float]] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and idx < len(self.id_map):
                judgment_id_str = self.id_map[idx]
                # Clamp cosine similarity to [0.0, 1.0]
                clamped_score = float(max(0.0, min(1.0, score)))
                results.append((UUID(judgment_id_str), clamped_score))

        return results

    def search_keyword(
        self, query: str, top_k: int = 20
    ) -> Dict[UUID, float]:
        """
        Compute TF-IDF cosine similarity for query and return dict of {uuid: score}.
        """
        if self.tfidf_vectorizer is None or self.tfidf_matrix is None:
            return {}

        query_vec = self.tfidf_vectorizer.transform([query])
        # Cosine similarity between sparse query vector and document matrix
        scores = (self.tfidf_matrix * query_vec.T).toarray().flatten()

        top_indices = np.argsort(scores)[::-1][:top_k]

        results: Dict[UUID, float] = {}
        max_score = float(np.max(scores)) if len(scores) > 0 and np.max(scores) > 0 else 1.0

        for idx in top_indices:
            raw_score = float(scores[idx])
            if raw_score > 0 and idx < len(self.tfidf_ids):
                # Normalized keyword score [0.0, 1.0]
                norm_score = raw_score / max_score
                results[UUID(self.tfidf_ids[idx])] = float(norm_score)

        return results
