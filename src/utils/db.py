import sqlite3
from typing import Optional
from src.config import settings
from src.utils.logger import get_logger

logger = get_logger(__name__)


class Database:
    def __init__(self):
        self.db_name = settings.db_name

    def _connect(self):
        """Create a thread-safe SQLite connection. Supports URI mode for shared in-memory DBs."""
        is_uri = self.db_name.startswith("file:")
        return sqlite3.connect(self.db_name, check_same_thread=False, uri=is_uri)

    def init_db(self):
        """Initialize all tables. Safe to call multiple times (idempotent)."""
        with self._connect() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS processed_emails (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    thread_id TEXT,
                    user_id TEXT,
                    category TEXT,
                    company TEXT,
                    draft TEXT,
                    time_ms INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Migrate: add user_id column if it doesn't exist (safe upgrade)
            try:
                conn.execute("ALTER TABLE processed_emails ADD COLUMN user_id TEXT")
            except Exception:
                pass  # Column already exists
            try:
                conn.execute("ALTER TABLE processed_emails ADD COLUMN time_ms INTEGER DEFAULT 0")
            except Exception:
                pass  # Column already exists

            conn.execute("""
                CREATE TABLE IF NOT EXISTS inbox_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id TEXT UNIQUE,
                    sender TEXT,
                    subject TEXT,
                    body TEXT,
                    processed INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Index for per-user queries (multi-tenant performance)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_processed_emails_user_id
                ON processed_emails (user_id, created_at DESC)
            """)
        logger.info("Database initialized.")

    def save_record(
        self,
        category: str,
        company: str,
        draft: str,
        thread_id: str = "default",
        user_id: Optional[str] = None,
        time_ms: int = 0,
    ):
        """Save a processed email record, optionally associated with a user."""
        with self._connect() as conn:
            conn.execute(
                """INSERT INTO processed_emails
                   (thread_id, user_id, category, company, draft, time_ms)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (thread_id, user_id, category, company, draft, time_ms)
            )

    def save_inbox_item(self, message_id: str, sender: str, subject: str, body: str):
        """Persist a raw inbound email from the Gmail poller. Ignores duplicates."""
        try:
            with self._connect() as conn:
                conn.execute(
                    """INSERT OR IGNORE INTO inbox_items (message_id, sender, subject, body)
                       VALUES (?, ?, ?, ?)""",
                    (message_id, sender, subject, body)
                )
        except Exception as e:
            logger.error(f"Failed to save inbox item {message_id}: {e}")

    def get_recent_records(
        self,
        limit: int = 20,
        user_id: Optional[str] = None,
    ) -> list[dict]:
        """
        Retrieve the most recent processed email records.
        If user_id is provided, filters to only that user's records (multi-tenant isolation).
        """
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            if user_id:
                cursor = conn.execute(
                    """SELECT thread_id, user_id, category, company, draft, time_ms, created_at
                       FROM processed_emails
                       WHERE user_id = ?
                       ORDER BY created_at DESC
                       LIMIT ?""",
                    (user_id, limit)
                )
            else:
                cursor = conn.execute(
                    """SELECT thread_id, user_id, category, company, draft, time_ms, created_at
                       FROM processed_emails
                       ORDER BY created_at DESC
                       LIMIT ?""",
                    (limit,)
                )
            return [dict(row) for row in cursor.fetchall()]

    def get_usage_stats(self, user_id: Optional[str] = None) -> dict:
        """
        Returns usage stats for the current calendar month.
        Used by the dashboard usage meter.
        """
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            base_where = "WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')"
            params: tuple = ()
            if user_id:
                base_where += " AND user_id = ?"
                params = (user_id,)

            cursor = conn.execute(
                f"""SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN category = 'Lead' THEN 1 ELSE 0 END) as leads,
                    SUM(CASE WHEN category = 'Complaint' THEN 1 ELSE 0 END) as complaints,
                    SUM(CASE WHEN category = 'Spam' THEN 1 ELSE 0 END) as spam,
                    AVG(time_ms) as avg_time_ms
                FROM processed_emails {base_where}""",
                params
            )
            row = cursor.fetchone()
            return {
                "this_month": {
                    "total": row["total"] or 0,
                    "leads": row["leads"] or 0,
                    "complaints": row["complaints"] or 0,
                    "spam": row["spam"] or 0,
                    "avg_time_ms": int(row["avg_time_ms"] or 0),
                }
            }


db = Database()
