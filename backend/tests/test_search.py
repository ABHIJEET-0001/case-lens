"""
backend/tests/test_search.py
────────────────────────────
Unit tests for search schemas and snippet extraction.
"""
from app.schemas.search import SearchRequest, SearchFilters, PrecedentResult
from app.services.search_service import SearchService


def test_search_request_schema():
    req = SearchRequest(
        query="Section 45 PMLA bail",
        filters=SearchFilters(court="Supreme Court", year_from=2020),
        top_k=5,
        method="hybrid",
    )
    assert req.query == "Section 45 PMLA bail"
    assert req.filters.court == "Supreme Court"
    assert req.top_k == 5
    assert req.method == "hybrid"


def test_snippet_extraction():
    class DummyDB:
        pass

    service = SearchService(DummyDB())
    sample_text = (
        "The appellant approached the court challenging detention.\n\n"
        "Section 45 of the Prevention of Money Laundering Act imposes twin conditions on bail.\n\n"
        "In our view, the appeal must be dismissed."
    )
    snippet = service._extract_snippet(sample_text, "twin conditions under Section 45")
    assert "Section 45" in snippet or "twin conditions" in snippet
