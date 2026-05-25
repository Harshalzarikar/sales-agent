"""
Unit tests for the Database utility layer.
Uses an isolated in-memory SQLite database — never touches beaver.db.

Note: SQLite in-memory databases (:memory:) don't persist across separate
connections. We use a shared URI connection to allow multiple callers
to share the same in-memory instance.
"""
import pytest
import sqlite3
from unittest.mock import patch


@pytest.fixture
def test_db():
    """
    Create a fresh Database instance backed by a named in-memory SQLite URI
    so all connections share the same in-memory database within a test.
    """
    shared_uri = "file:testdb?mode=memory&cache=shared"

    with patch("src.config.settings.db_name", shared_uri):
        import importlib
        import src.utils.db as db_module
        importlib.reload(db_module)
        db = db_module.Database()
        db.db_name = shared_uri
        # Use URI mode for shared in-memory database
        db._use_uri = True
        db.init_db()
        yield db
        # Clean up tables after each test
        with db._connect() as conn:
            conn.execute("DROP TABLE IF EXISTS processed_emails")
            conn.execute("DROP TABLE IF EXISTS inbox_items")


class TestDatabaseInit:

    def test_init_creates_processed_emails_table(self, test_db):
        with test_db._connect() as conn:
            cursor = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='processed_emails'"
            )
            assert cursor.fetchone() is not None

    def test_init_creates_inbox_items_table(self, test_db):
        with test_db._connect() as conn:
            cursor = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='inbox_items'"
            )
            assert cursor.fetchone() is not None

    def test_init_is_idempotent(self, test_db):
        """Calling init_db twice should not raise an error."""
        test_db.init_db()
        test_db.init_db()  # Should not fail


class TestSaveRecord:

    def test_saves_and_retrieves_record(self, test_db):
        test_db.save_record(
            category="Lead",
            company="Acme Corp",
            draft="Dear Acme Corp, thank you...",
            thread_id="thread-123",
        )
        records = test_db.get_recent_records(limit=5)
        assert len(records) == 1
        assert records[0]["category"] == "Lead"
        assert records[0]["company"] == "Acme Corp"
        assert records[0]["thread_id"] == "thread-123"

    def test_save_multiple_records(self, test_db):
        for i in range(5):
            test_db.save_record(
                category="Lead",
                company=f"Company {i}",
                draft=f"Draft {i}",
                thread_id=f"thread-{i}",
            )
        records = test_db.get_recent_records(limit=10)
        assert len(records) == 5

    def test_get_recent_records_returns_newest_first(self, test_db):
        test_db.save_record(category="Lead", company="First", draft="d1", thread_id="t1")
        test_db.save_record(category="Complaint", company="Second", draft="d2", thread_id="t2")
        records = test_db.get_recent_records(limit=10)
        # Both records should be returned
        assert len(records) == 2
        companies = [r["company"] for r in records]
        assert "First" in companies
        assert "Second" in companies


    def test_get_recent_records_respects_limit(self, test_db):
        for i in range(10):
            test_db.save_record(
                category="Spam", company=f"Co{i}", draft=f"Draft{i}", thread_id=f"t{i}"
            )
        records = test_db.get_recent_records(limit=3)
        assert len(records) == 3


class TestSaveInboxItem:

    def test_saves_inbox_item(self, test_db):
        test_db.save_inbox_item(
            message_id="msg-001",
            sender="sender@example.com",
            subject="Test Subject",
            body="Email body content",
        )
        with test_db._connect() as conn:
            cursor = conn.execute("SELECT * FROM inbox_items WHERE message_id = 'msg-001'")
            row = cursor.fetchone()
        assert row is not None

    def test_ignores_duplicate_message_id(self, test_db):
        """Saving the same message_id twice should silently ignore the second."""
        test_db.save_inbox_item("msg-dup", "a@b.com", "Sub", "Body")
        test_db.save_inbox_item("msg-dup", "a@b.com", "Sub", "Body")  # duplicate

        with test_db._connect() as conn:
            cursor = conn.execute(
                "SELECT COUNT(*) FROM inbox_items WHERE message_id = 'msg-dup'"
            )
            count = cursor.fetchone()[0]
        assert count == 1
