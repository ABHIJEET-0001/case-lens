"""
scripts/clean_text.py
─────────────────────
Text cleaning and metadata extraction utilities for Indian court judgments.

All functions are pure (no side effects) so they can be tested in isolation
and reused by the scraper and any future ingestion pipeline.
"""
import re
from datetime import date, datetime
from typing import Optional


# ── Text cleaning ─────────────────────────────────────────────────────────────

# Boilerplate lines commonly found in Indian judgment PDFs/scraped HTML
_BOILERPLATE_PATTERNS = [
    r"(?i)^\s*page\s+\d+\s+of\s+\d+\s*$",
    r"(?i)^\s*(reportable|non[\s-]?reportable)\s*$",
    r"(?i)^\s*in\s+the\s+(supreme court|high court).*\s*$",   # repeated header lines
    r"(?i)^\s*\*{3,}\s*$",                                    # *** dividers
    r"(?i)^\s*-{5,}\s*$",                                     # --- dividers
    r"(?i)^\s*(judgment|order|decree)\s*$",
    r"(?i)^\s*pronounced\s+on\s*:?\s*$",
]
_BOILERPLATE_RE = re.compile("|".join(_BOILERPLATE_PATTERNS), re.MULTILINE)


def clean_judgment_text(text: str) -> str:
    """
    Remove common artifacts from scraped/PDF-extracted Indian judgments:
    - Repeated header/footer lines
    - Excessive whitespace and blank lines
    - Unicode control characters
    Returns cleaned text suitable for embedding.
    """
    if not text or not text.strip():
        return ""

    # Strip unicode control chars (except newlines and tabs)
    text = re.sub(r"[^\S\n\t ]+", " ", text)
    text = re.sub(r"[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]", "", text)

    # Remove boilerplate lines
    text = _BOILERPLATE_RE.sub("", text)

    # Collapse 3+ consecutive blank lines into two
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Collapse runs of spaces/tabs
    text = re.sub(r"[ \t]{2,}", " ", text)

    return text.strip()


# ── Metadata extraction ───────────────────────────────────────────────────────

# Indian legal citation patterns:
#   AIR 2019 SC 1234   |   (2022) 3 SCC 456   |   2021 SCR 789
#   WP(C) 1234/2022    |   CRL.A. 1243/2022
_CITATION_PATTERNS = [
    r"AIR\s+\d{4}\s+\w+\s+\d+",
    r"\(\d{4}\)\s+\d+\s+SCC\s+\d+",
    r"\d{4}\s+SCR\s+\d+",
    r"\d{4}\s+\(\d+\)\s+\w+LJ\s+\d+",           # state Law Journals
    r"(?:WP|CRL\.?A?|CIV\.?A?|SA|FA)\(?[A-Z]*\)?\s*\d+/\d{4}",
]
_CITATION_RE = re.compile("|".join(_CITATION_PATTERNS), re.IGNORECASE)

# Court name heuristics — ordered most-specific first
_COURT_PATTERNS = [
    (r"supreme\s+court\s+of\s+india", "Supreme Court of India"),
    (r"high\s+court\s+of\s+(\w[\w\s]+?)(?:\s+at\s+(\w+))?(?:\.|,|\n)", None),  # dynamic
    (r"district\s+court", "District Court"),
    (r"sessions\s+court", "Sessions Court"),
    (r"national\s+consumer\s+disputes\s+redressal\s+commission", "NCDRC"),
    (r"national\s+company\s+law\s+tribunal", "NCLT"),
    (r"debt\s+recovery\s+tribunal", "DRT"),
]

_DATE_RE = re.compile(
    r"""
    (?:
        # Day Month Year  e.g.  14 November 2022  |  3rd January, 2021
        (?P<d1>\d{1,2})(?:st|nd|rd|th)?\s+
        (?P<m1>January|February|March|April|May|June|July|August|
               September|October|November|December)\s*,?\s*
        (?P<y1>\d{4})
    |
        # Month Day, Year  e.g.  November 14, 2022
        (?P<m2>January|February|March|April|May|June|July|August|
               September|October|November|December)\s+
        (?P<d2>\d{1,2}),?\s*
        (?P<y2>\d{4})
    |
        # DD/MM/YYYY or DD-MM-YYYY
        (?P<d3>\d{2})[/\-](?P<m3>\d{2})[/\-](?P<y3>\d{4})
    )
    """,
    re.VERBOSE | re.IGNORECASE,
)

_MONTH_MAP = {
    m: i for i, m in enumerate(
        ["january","february","march","april","may","june",
         "july","august","september","october","november","december"], 1
    )
}

_CASE_TYPE_RE = re.compile(
    r"\b(CRL\.?A?|WP|W\.P\.|CIV\.?A?|SA|FA|OP|ICA|CS|RFA|RSA|MFA|CRP|SLP|RP)\b",
    re.IGNORECASE,
)

_OUTCOME_PATTERNS = [
    (r"\bappeal\s+(?:is\s+)?allowed\b", "Allowed"),
    (r"\bappeal\s+(?:is\s+)?dismissed\b", "Dismissed"),
    (r"\bpetition\s+(?:is\s+)?allowed\b", "Allowed"),
    (r"\bpetition\s+(?:is\s+)?dismissed\b", "Dismissed"),
    (r"\bsuit\s+(?:is\s+)?decreed\b", "Decreed"),
    (r"\bsuit\s+(?:is\s+)?dismissed\b", "Dismissed"),
    (r"\bwrit\s+(?:petition\s+)?(?:is\s+)?allowed\b", "Allowed"),
    (r"\bwrit\s+(?:petition\s+)?(?:is\s+)?dismissed\b", "Dismissed"),
    (r"\bmatter\s+(?:is\s+)?settled\b", "Settled"),
    (r"\bcompromised\b", "Settled"),
    (r"\bquashed\b", "Quashed"),
    (r"\bremanded\b", "Remanded"),
]
_OUTCOME_RE = [(re.compile(p, re.IGNORECASE), label) for p, label in _OUTCOME_PATTERNS]


def extract_citation(text: str) -> Optional[str]:
    """Return the first legal citation found in the text, or None."""
    m = _CITATION_RE.search(text[:3000])   # citations appear near the top
    return m.group(0).strip() if m else None


def extract_court(text: str) -> str:
    """
    Identify the court from the first 2000 characters of the judgment.
    Returns a normalised court name string, or 'Unknown Court'.
    """
    header = text[:2000]
    for pattern, label in _COURT_PATTERNS:
        m = re.search(pattern, header, re.IGNORECASE)
        if m:
            if label:
                return label
            # For High Court pattern, build name from capture groups
            state = (m.group(1) or "").strip().title()
            bench = (m.group(2) or "").strip().title()
            return f"High Court of {state}" + (f" at {bench}" if bench else "")
    return "Unknown Court"


def extract_judgment_date(text: str) -> Optional[date]:
    """
    Find the first valid date in the judgment (usually 'Pronounced on' line).
    Looks in the first 3000 and last 1000 characters.
    """
    search_text = text[:3000] + text[-1000:]
    for m in _DATE_RE.finditer(search_text):
        try:
            g = m.groupdict()
            if g.get("y1"):
                return date(int(g["y1"]), _MONTH_MAP[g["m1"].lower()], int(g["d1"]))
            if g.get("y2"):
                return date(int(g["y2"]), _MONTH_MAP[g["m2"].lower()], int(g["d2"]))
            if g.get("y3"):
                y = int(g["y3"])
                if 1950 <= y <= datetime.now().year:
                    return date(y, int(g["m3"]), int(g["d3"]))
        except (ValueError, KeyError):
            continue
    return None


def extract_case_type(text: str) -> Optional[str]:
    """Return the first case-type abbreviation found (e.g. 'CRL.A', 'WP')."""
    m = _CASE_TYPE_RE.search(text[:2000])
    return m.group(0).upper().rstrip(".") if m else None


def extract_outcome(text: str) -> Optional[str]:
    """
    Scan the last 2000 characters of the judgment for a disposal keyword.
    Returns a normalised label like 'Allowed', 'Dismissed', etc.
    """
    tail = text[-2000:]
    for pattern, label in _OUTCOME_RE:
        if pattern.search(tail):
            return label
    return None


# ── Chunking ──────────────────────────────────────────────────────────────────

def chunk_text(
    text: str,
    chunk_words: int = 300,
    overlap_words: int = 50,
) -> list[str]:
    """
    Split text into overlapping word-based chunks suitable for embedding.

    Args:
        text:          Cleaned judgment text.
        chunk_words:   Target words per chunk.
        overlap_words: Words of overlap between consecutive chunks.

    Returns:
        List of chunk strings. Minimum 1 chunk even for short texts.
    """
    words = text.split()
    if not words:
        return []

    chunks = []
    step = chunk_words - overlap_words
    for start in range(0, len(words), step):
        chunk = " ".join(words[start : start + chunk_words])
        if chunk.strip():
            chunks.append(chunk)
        # Stop if we've covered everything
        if start + chunk_words >= len(words):
            break

    return chunks if chunks else [text]
