import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "db" in data
    assert "index_loaded" in data

def test_cases_count_endpoint():
    response = client.get("/api/v1/cases/count")
    assert response.status_code == 200
    data = response.json()
    assert "count" in data
    assert isinstance(data["count"], int)
