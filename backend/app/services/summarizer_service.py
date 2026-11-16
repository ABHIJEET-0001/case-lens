"""
app/services/summarizer_service.py
──────────────────────────────────
Abstractive legal summarization via Google Gemini API (structured 4-part ratio),
with a deterministic local extractive fallback (TextRank sentence scoring).
Caches generated summaries in the PostgreSQL `summaries` table.
"""
import json
import logging
import re
from typing import Optional, Dict
from uuid import UUID

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import Judgment, Summary
from app.schemas.search import PrecedentSummarySchema

log = logging.getLogger("summarizer")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

LEGAL_SUMMARY_PROMPT = """You are a senior judicial research clerk for an appellate court.
Analyze the following Indian court judgment text and provide a rigorous, objective 4-part legal summary.

Your output MUST be a valid JSON object matching this exact schema:
{{
  "facts": "A clear, concise 2-3 sentence summary of the material factual matrix and procedural origin.",
  "issue": "The core constitutional, statutory, or substantive question(s) of law before the bench.",
  "holding": "The ratio decidendi and binding legal principle established by the court.",
  "outcome_text": "The formal disposition of the petition or appeal (e.g. Appeal allowed, Petition dismissed, Quashed, Remanded)."
}}

Judgment Text (excerpt):
{judgment_text}

JSON Output:"""


class SummarizerService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_generate_summary(self, judgment_id: UUID) -> PrecedentSummarySchema:
        """
        Check database cache first. If missing, generate via Gemini API
        (or local extractive fallback) and cache the result in PostgreSQL.
        """
        judgment = self.db.query(Judgment).filter(Judgment.id == judgment_id).first()
        if not judgment:
            raise ValueError(f"Judgment with ID '{judgment_id}' not found.")

        # 1. Cache hit check
        if judgment.summary:
            log.info("Summary cache hit for judgment %s", judgment_id)
            return PrecedentSummarySchema(
                facts=judgment.summary.facts,
                issue=judgment.summary.issue,
                holding=judgment.summary.holding,
                outcome_text=judgment.summary.outcome_text,
                model_used=judgment.summary.model_used,
            )

        # 2. Cache miss: generate summary
        log.info("Summary cache miss for judgment %s. Generating...", judgment_id)
        summary_data = self._generate_summary(judgment.full_text)

        # 3. Store in database
        db_summary = Summary(
            judgment_id=judgment.id,
            facts=summary_data.get("facts"),
            issue=summary_data.get("issue"),
            holding=summary_data.get("holding"),
            outcome_text=summary_data.get("outcome_text"),
            model_used=summary_data.get("model_used", "gemini-1.5-flash"),
        )
        self.db.add(db_summary)
        self.db.commit()
        self.db.refresh(db_summary)

        return PrecedentSummarySchema(
            facts=db_summary.facts,
            issue=db_summary.issue,
            holding=db_summary.holding,
            outcome_text=db_summary.outcome_text,
            model_used=db_summary.model_used,
        )

    def _generate_summary(self, text: str) -> Dict[str, str]:
        """Try Gemini API first; fallback to local extractive summarizer on any failure."""
        api_key = settings.gemini_api_key.strip()
        if api_key and not api_key.startswith("your-") and not api_key.startswith("change"):
            try:
                return self._call_gemini_api(text, api_key)
            except Exception as exc:
                log.warning("Gemini API summarization failed (%s). Using local extractive fallback.", exc)

        return self._local_extractive_fallback(text)

    def _call_gemini_api(self, text: str, api_key: str) -> Dict[str, str]:
        """Call Gemini 1.5 Flash via HTTP request."""
        # Use first 12,000 characters to cover key parts of judgment
        excerpt = text[:12000]
        prompt = LEGAL_SUMMARY_PROMPT.format(judgment_text=excerpt)

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            },
        }

        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                f"{GEMINI_API_URL}?key={api_key}",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        if resp.status_code != 200:
            raise RuntimeError(f"Gemini API returned HTTP {resp.status_code}: {resp.text}")

        res_json = resp.json()
        raw_text = res_json["candidates"][0]["content"]["parts"][0]["text"]

        data = json.loads(raw_text)
        return {
            "facts": data.get("facts", ""),
            "issue": data.get("issue", ""),
            "holding": data.get("holding", ""),
            "outcome_text": data.get("outcome_text", ""),
            "model_used": "gemini-1.5-flash",
        }

    def _local_extractive_fallback(self, text: str) -> Dict[str, str]:
        """
        Deterministic sentence scoring fallback based on legal keywords.
        Identifies sentences with highest importance weights.
        """
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 30]

        if not sentences:
            return {
                "facts": text[:200] + "...",
                "issue": "Substantive question of law raised under statutory provisions.",
                "holding": "Appellate court ratio and principles applied.",
                "outcome_text": "Disposed in terms of order.",
                "model_used": "extractive_fallback",
            }

        # Sentence scoring heuristics
        fact_kw = re.compile(r"\b(appellant|petitioner|respondent|prosecution|allegation|filed|convicted|suit)\b", re.I)
        issue_kw = re.compile(r"\b(whether|question|issue|contention|argued|challenge|validity|interpretation)\b", re.I)
        holding_kw = re.compile(r"\b(held|hold|principle|we are of the opinion|settled law|laid down|in our view)\b", re.I)
        outcome_kw = re.compile(r"\b(allowed|dismissed|disposed|remanded|quashed|decreed|bail is granted)\b", re.I)

        facts_sents = [s for s in sentences[:20] if fact_kw.search(s)][:2]
        issue_sents = [s for s in sentences[:35] if issue_kw.search(s)][:1]
        holding_sents = [s for s in sentences[-30:] if holding_kw.search(s)][:2]
        outcome_sents = [s for s in sentences[-15:] if outcome_kw.search(s)][:1]

        facts_text = " ".join(facts_sents) if facts_sents else sentences[0]
        issue_text = " ".join(issue_sents) if issue_sents else "Legal question concerning statutory interpretation and procedural compliance."
        holding_text = " ".join(holding_sents) if holding_sents else (sentences[-2] if len(sentences) > 2 else sentences[-1])
        outcome_text = " ".join(outcome_sents) if outcome_sents else "Disposed on merits."

        return {
            "facts": facts_text[:350],
            "issue": issue_text[:300],
            "holding": holding_text[:350],
            "outcome_text": outcome_text[:150],
            "model_used": "extractive_heuristic_fallback",
        }
