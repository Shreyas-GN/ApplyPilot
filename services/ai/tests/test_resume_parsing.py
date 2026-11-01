from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_parse_resume_mock_extracts_email_and_phone():
    text = "Jane Doe\njane.doe@example.com\n(555) 123-4567\nhttps://github.com/janedoe"
    response = client.post("/parse-resume", json={"text": text})
    assert response.status_code == 200
    body = response.json()
    assert body["personal"]["email"] == "jane.doe@example.com"
    assert body["personal"]["githubUrl"] == "https://github.com/janedoe"
    assert body["experience"] == []
    assert body["education"] == []
    assert 0 <= body["overallConfidence"] <= 1


def test_parse_resume_mock_never_invents_experience():
    # No structured sections in the text at all — the mock provider must
    # not synthesize any experience/education/skills entries.
    response = client.post("/parse-resume", json={"text": "Just some unrelated text."})
    assert response.status_code == 200
    body = response.json()
    assert body["experience"] == []
    assert body["education"] == []
    assert body["skills"] == []
    assert body["projects"] == []
    assert body["certifications"] == []


def test_parse_resume_rejects_empty_text():
    response = client.post("/parse-resume", json={"text": "   "})
    assert response.status_code == 400
