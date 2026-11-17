import pytest
from app.services.query_expansion import expand_statutory_query

def test_ipc_to_bns_expansion():
    query = "bail petition under Section 302 IPC"
    expanded, notes = expand_statutory_query(query)
    assert "Section 103 BNS" in expanded
    assert any("IPC 302" in n for n in notes)

def test_crpc_to_bnss_expansion():
    query = "anticipatory bail under Section 438 CrPC"
    expanded, notes = expand_statutory_query(query)
    assert "Section 482 BNSS" in expanded
    assert any("CrPC 438" in n for n in notes)

def test_no_statutory_references_unchanged():
    query = "environmental compensation for industrial pollution"
    expanded, notes = expand_statutory_query(query)
    assert expanded == query
    assert len(notes) == 0
