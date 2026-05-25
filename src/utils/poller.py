import time
import threading
from src.utils.email_service import email_service
from src.utils.db import db
from src.config import settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

class EmailPoller:
    def __init__(self):
        self.running = False
        self._thread = None

    def start(self):
        if not self.running:
            self.running = True
            self._thread = threading.Thread(target=self._poll_loop, daemon=True)
            self._thread.start()
            logger.info("📡 Background Email Poller started.")

    def stop(self):
        self.running = False
        if self._thread:
            self._thread.join()
        logger.info("🛑 Background Email Poller stopped.")

    def _poll_loop(self):
        while self.running:
            try:
                new_emails = email_service.fetch_new_emails()
                if new_emails:
                    logger.info(f"📩 Poller: Found {len(new_emails)} new emails.")
                    for mail in new_emails:
                        db.save_inbox_item(
                            message_id=mail["message_id"],
                            sender=mail["sender"],
                            subject=mail["subject"],
                            body=mail["body"]
                        )
                
            except Exception as e:
                logger.error(f"Poller Loop Error: {e}")
            
            time.sleep(settings.poll_interval)

poller = EmailPoller()
