from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_200_with_expected_shape():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert "status" in body
    assert "checks" in body
    assert "redis" in body["checks"]
