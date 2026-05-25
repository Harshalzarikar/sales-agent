import base64
from googleapiclient.discovery import build
from src.utils.google_auth import google_auth
from src.utils.logger import get_logger

logger = get_logger(__name__)

class EmailService:
    def __init__(self):
        self.service = None

    def _get_service(self):
        """Lazy initialization of the Gmail API service."""
        if self.service:
            return self.service
        
        creds = google_auth.get_credentials()
        if not creds:
            return None
        
        self.service = build('gmail', 'v1', credentials=creds)
        return self.service

    def fetch_new_emails(self):
        """Fetches unread emails using the Gmail API."""
        service = self._get_service()
        if not service:
            logger.warning("Gmail API service not available. Check OAuth status.")
            return []

        emails = []
        try:
            # Search for unread messages (label:UNREAD)
            results = service.users().messages().list(userId='me', q='is:unread').execute()
            messages = results.get('messages', [])

            for message in messages:
                msg = service.users().messages().get(userId='me', id=message['id']).execute()
                
                # Extract headers
                headers = msg['payload']['headers']
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown Sender')
                
                # Extract body
                parts = msg['payload'].get('parts', [])
                body = ""
                if not parts:
                    # Single part message
                    data = msg['payload']['body'].get('data', '')
                    body = base64.urlsafe_b64decode(data).decode('utf-8')
                else:
                    # Multipart message
                    for part in parts:
                        if part['mimeType'] == 'text/plain':
                            data = part['body'].get('data', '')
                            body = base64.urlsafe_b64decode(data).decode('utf-8')
                            break

                emails.append({
                    "message_id": message['id'],
                    "sender": sender,
                    "subject": subject,
                    "body": body
                })

            return emails
        except Exception as e:
            logger.error(f"Gmail API Fetch Error: {e}")
            return []

    def send_reply(self, to_email: str, subject: str, body: str, thread_id: str = None):
        """Sends an email reply via the Gmail API."""
        service = self._get_service()
        if not service:
            logger.error("Cannot send email: Gmail API service not available.")
            return False

        try:
            message_text = f"To: {to_email}\r\nSubject: Re: {subject}\r\n\r\n{body}"
            raw = base64.urlsafe_b64encode(message_text.encode('utf-8')).decode('utf-8')
            
            message_body = {'raw': raw}
            if thread_id:
                message_body['threadId'] = thread_id

            service.users().messages().send(userId='me', body=message_body).execute()
            logger.info(f"✅ Gmail sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Gmail API Send Error: {e}")
            return False

email_service = EmailService()
