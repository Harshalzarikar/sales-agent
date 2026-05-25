"""
API integration tests for the Beaver Agent FastAPI application.
Tests cover: health check, process endpoint, input validation, auth, and history.
"""
import pytest
from unittest.mock import patch


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

def test_health_returns_healthy(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


# ---------------------------------------------------------------------------
# /process — Success paths
# ---------------------------------------------------------------------------

def test_process_lead_email(client, sample_lead_email, mock_graph_result):
    with patch("main.graph.invoke", return_value=mock_graph_result):
        response = client.post("/process", json={"email_text": sample_lead_email})

    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Lead"
    assert data["company"] == "Acme Corp"
    assert "draft" in data
    assert isinstance(data["trace"], list)
    assert "thread_id" in data
    assert data["revisions"] == 1
    assert data["time_ms"] >= 0


def test_process_complaint_email(client, sample_complaint_email, mock_complaint_result):
    with patch("main.graph.invoke", return_value=mock_complaint_result):
        response = client.post("/process", json={"email_text": sample_complaint_email})

    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Complaint"
    assert "draft" in data


def test_process_uses_provided_thread_id(client, sample_lead_email, mock_graph_result):
    """If caller provides a thread_id, the same ID must appear in the response."""
    custom_thread = "test-thread-abc-123"
    with patch("main.graph.invoke", return_value=mock_graph_result):
        response = client.post(
            "/process",
            json={"email_text": sample_lead_email, "thread_id": custom_thread},
        )

    assert response.status_code == 200
    assert response.json()["thread_id"] == custom_thread


# ---------------------------------------------------------------------------
# /process — Input validation
# ---------------------------------------------------------------------------

def test_process_rejects_empty_email(client):
    response = client.post("/process", json={"email_text": ""})
    assert response.status_code == 422


def test_process_rejects_oversized_email(client):
    """Email longer than max_email_length must be rejected with 422."""
    huge_text = "A" * 10_001
    response = client.post("/process", json={"email_text": huge_text})
    assert response.status_code == 422


def test_process_rejects_missing_email_field(client):
    response = client.post("/process", json={})
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# /process — Error handling
# ---------------------------------------------------------------------------

def test_process_handles_graph_exception(client, sample_lead_email):
    """If the agent graph raises, the API should return 500 (not crash)."""
    with patch("main.graph.invoke", side_effect=RuntimeError("LLM timeout")):
        response = client.post("/process", json={"email_text": sample_lead_email})

    assert response.status_code == 500
    assert "Agent pipeline error" in response.json()["detail"]


# ---------------------------------------------------------------------------
# /process — Authentication
# ---------------------------------------------------------------------------

def test_process_accepts_valid_api_key(client, sample_lead_email, mock_graph_result):
    """When API_KEY is configured, correct header must be accepted."""
    with patch("main.settings.api_key", "test-secret-key"):
        with patch("main.graph.invoke", return_value=mock_graph_result):
            response = client.post(
                "/process",
                json={"email_text": sample_lead_email},
                headers={"X-API-Key": "test-secret-key"},
            )
    assert response.status_code == 200


def test_process_rejects_wrong_api_key(client, sample_lead_email):
    """Wrong API key must return 401."""
    with patch("main.settings.api_key", "correct-key"):
        response = client.post(
            "/process",
            json={"email_text": sample_lead_email},
            headers={"X-API-Key": "wrong-key"},
        )
    assert response.status_code == 401


def test_process_rejects_missing_api_key_when_required(client, sample_lead_email):
    """Missing API key header when key is required must return 401."""
    with patch("main.settings.api_key", "required-key"):
        response = client.post("/process", json={"email_text": sample_lead_email})
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# /history
# ---------------------------------------------------------------------------

def test_history_returns_list(client):
    with patch("main.db.get_recent_records", return_value=[]):
        response = client.get("/history")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_history_limit_capped_at_100(client):
    """Requesting more than 100 records should still work (capped internally)."""
    with patch("main.db.get_recent_records", return_value=[]) as mock_get:
        response = client.get("/history?limit=999")
    assert response.status_code == 200
    # Verify the cap was applied — should be called with limit=100 not 999
    mock_get.assert_called_once_with(limit=100)


def test_history_returns_records(client):
    """History endpoint should return whatever the DB returns."""
    fake_records = [
        {"thread_id": "t1", "category": "Lead", "company": "Acme", "draft": "Dear...", "created_at": "2026-01-01 12:00:00"},
    ]
    with patch("main.db.get_recent_records", return_value=fake_records):
        response = client.get("/history?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["category"] == "Lead"

