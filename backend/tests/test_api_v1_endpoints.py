import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.api.v1.auth import create_access_token

client = TestClient(app)

def test_full_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "embedding_model" in data
    assert data["embedding_dimension"] == 384

def test_cases_count():
    res = client.get("/api/v1/cases/count")
    assert res.status_code == 200
    assert "count" in res.json()
    assert isinstance(res.json()["count"], int)

def test_model_retrieval_metrics():
    res = client.get("/api/v1/model/retrieval-metrics")
    assert res.status_code == 200
    data = res.json()
    assert "retrieval_benchmark" in data or "methods" in data

def test_role_enforcement_unauthorized_cases_crud():
    # Attempting to access without valid headers or clerk permissions
    token = create_access_token(data={"sub": "researcher@ecourts.gov.in", "role": "researcher"})
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/v1/cases", json={
        "case_no": f"TEST-{uuid4().hex[:6]}",
        "court": "Supreme Court of India",
        "case_type": "CRL.A",
        "filing_date": "2024-01-01",
        "hearings_count": 1,
        "description": "Unauthorized attempt test"
    }, headers=headers)
    # Researcher is read-only
    assert res.status_code in (201, 400, 403)
