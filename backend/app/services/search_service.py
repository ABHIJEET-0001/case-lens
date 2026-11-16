"""
app/services/search_service.py
──────────────────────────────
Orchestrates hybrid retrieval (FAISS semantic + TF-IDF keyword),
applies database metadata filters, and generates passage snippets.
"""
import time
import re
from typing import List, Dict, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.schemas.search import (
    SearchRequest,
    SearchResponse,
    PrecedentResult,
    PrecedentSummarySchema,
)
from app.repositories.judgment_repo import JudgmentRepository
from app.repositories.vector_index_repo import VectorIndexRepository
from app.db.models import Judgment


class SearchService:
    def __init__(self, db: Session):
        self.db = db
        self.judgment_repo = JudgmentRepository(db)
        self.vector_repo = VectorIndexRepository.get_instance()

    def search(self, request: SearchRequest) -> SearchResponse:
        start_time = time.perf_counter()

        # Retrieve a broader pool of candidates to allow for post-filtering
        candidate_k = min(100, max(request.top_k * 3, 25))

        # 1. Semantic retrieval (FAISS)
        semantic_matches = self.vector_repo.search_semantic(
            request.query, top_k=candidate_k
        )
        semantic_scores: Dict[UUID, float] = {
            j_id: score for j_id, score in semantic_matches
        }

        # 2. Keyword baseline retrieval (TF-IDF)
        keyword_scores: Dict[UUID, float] = self.vector_repo.search_keyword(
            request.query, top_k=candidate_k
        )

        # 3. Candidate ID pool union
        candidate_ids = list(set(list(semantic_scores.keys()) + list(keyword_scores.keys())))

        # If vector index is empty or offline, fallback to database ILIKE search
        if not candidate_ids:
            return self._fallback_database_search(request, start_time)

        # 4. Fetch full records with metadata filters applied in SQL
        judgments = self.judgment_repo.get_by_ids(candidate_ids, request.filters)

        # 5. Compute ranking scores per judgment
        results: List[PrecedentResult] = []
        alpha = 0.75  # 75% semantic weight, 25% keyword weight in hybrid mode

        for j in judgments:
            sim_score = semantic_scores.get(j.id, 0.0)
            key_score = keyword_scores.get(j.id, 0.0)

            if request.method == "semantic":
                final_score = sim_score
            elif request.method == "keyword":
                final_score = key_score
            else:  # hybrid
                final_score = (alpha * sim_score) + ((1.0 - alpha) * key_score)

            snippet = self._extract_snippet(j.full_text, request.query)

            summary_schema = None
            if j.summary:
                summary_schema = PrecedentSummarySchema(
                    facts=j.summary.facts,
                    issue=j.summary.issue,
                    holding=j.summary.holding,
                    outcome_text=j.summary.outcome_text,
                    model_used=j.summary.model_used,
                )

            results.append(
                PrecedentResult(
                    id=j.id,
                    title=j.title,
                    citation=j.citation,
                    court=j.court,
                    judgment_date=j.judgment_date,
                    case_type=j.case_type,
                    outcome=j.outcome,
                    bench=j.bench,
                    word_count=j.word_count,
                    similarity_score=round(sim_score, 4),
                    keyword_score=round(key_score, 4),
                    hybrid_score=round(final_score, 4),
                    matched_snippet=snippet,
                    summary=summary_schema,
                )
            )

        # 6. Sort by chosen score descending
        results.sort(key=lambda x: x.hybrid_score, reverse=True)
        top_results = results[: request.top_k]

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        return SearchResponse(
            query=request.query,
            total_found=len(top_results),
            retrieval_method=request.method,
            latency_ms=round(latency_ms, 2),
            results=top_results,
        )

    def _extract_snippet(self, full_text: str, query: str) -> str:
        """Find the paragraph or sentence window most relevant to query terms."""
        if not full_text:
            return ""

        words = [w for w in re.split(r"\W+", query.lower()) if len(w) > 3]
        paragraphs = full_text.split("\n\n")

        best_para = ""
        max_overlap = -1

        for p in paragraphs:
            p_clean = p.strip()
            if len(p_clean) < 80:
                continue
            p_lower = p_clean.lower()
            overlap = sum(1 for w in words if w in p_lower)
            if overlap > max_overlap:
                max_overlap = overlap
                best_para = p_clean

        if not best_para:
            best_para = full_text[:400].strip()

        # Truncate to reasonable snippet length
        if len(best_para) > 350:
            best_para = best_para[:350].rsplit(" ", 1)[0] + "..."

        return best_para

    def _fallback_database_search(
        self, request: SearchRequest, start_time: float
    ) -> SearchResponse:
        """Graceful fallback if vector index is not yet built."""
        terms = [t for t in request.query.split() if len(t) > 2]
        query = self.db.query(Judgment)

        if terms:
            for term in terms[:3]:
                query = query.filter(Judgment.full_text.ilike(f"%{term}%"))

        if request.filters:
            if request.filters.court:
                query = query.filter(Judgment.court.ilike(f"%{request.filters.court}%"))
            if request.filters.case_type:
                query = query.filter(Judgment.case_type.ilike(f"%{request.filters.case_type}%"))

        judgments = query.limit(request.top_k).all()

        results = [
            PrecedentResult(
                id=j.id,
                title=j.title,
                citation=j.citation,
                court=j.court,
                judgment_date=j.judgment_date,
                case_type=j.case_type,
                outcome=j.outcome,
                bench=j.bench,
                word_count=j.word_count,
                similarity_score=0.5,
                keyword_score=0.5,
                hybrid_score=0.5,
                matched_snippet=j.full_text[:300] + "...",
                summary=None,
            )
            for j in judgments
        ]

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        return SearchResponse(
            query=request.query,
            total_found=len(results),
            retrieval_method="database_fallback",
            latency_ms=round(latency_ms, 2),
            results=results,
        )
