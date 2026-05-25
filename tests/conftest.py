"""
Pytest configuration and shared fixtures for the Beaver Agent test suite.
"""
import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture(scope="session")
def client():
    """
    Creates a FastAPI TestClient for the full application.
    Patches the global `db` object in main.py to use an isolated in-memory DB
    so tests don't touch the real beaver.db file.
    """
    from src.utils.db import Database

    # Create a fresh in-memory database for the test session
    test_db = Database()
    test_db.db_name = "file:testmaindb?mode=memory&cache=shared"
    test_db.init_db()

    with patch("main.db", test_db):
        from main import app
        from fastapi.testclient import TestClient
        with TestClient(app) as c:
            yield c


@pytest.fixture
def mock_graph_result():
    """A realistic graph output for a Lead email."""
    return {
        "category": "Lead",
        "company_name": "Acme Corp",
        "draft_email": "Dear John,\n\nThank you for your interest in our product. Let's schedule a call.\n\nBest regards,\nSales Team",
        "revision_count": 1,
        "messages": [
            "📧 Email classified as: Lead",
            "🔍 Researched: Acme Corp",
            "✍️ Draft v1 created",
            "⚖️ Verdict: APPROVED",
        ],
    }


@pytest.fixture
def mock_complaint_result():
    """A realistic graph output for a Complaint email."""
    return {
        "category": "Complaint",
        "company_name": None,
        "draft_email": "Dear valued customer,\n\nWe sincerely apologize for the inconvenience...",
        "revision_count": 0,
        "messages": [
            "📧 Email classified as: Complaint",
            "🛡️ Support response drafted",
        ],
    }


@pytest.fixture
def sample_lead_email():
    return (
        "Subject: Enterprise License Inquiry\n\n"
        "Hi team,\n\nI'm Sarah Chen, CTO at Acme Corp. "
        "We're evaluating sales automation tools for our 200-person sales org. "
        "Could we schedule a 30-min call this week?\n\nBest,\nSarah"
    )


@pytest.fixture
def sample_complaint_email():
    return (
        "Subject: Billing Issue - Urgent\n\n"
        "My name is John Martin. I was charged twice for my subscription this month. "
        "This is unacceptable. Please resolve this immediately."
    )
