import os
import json
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from src.config import settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

# Scopes required for the application
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
]

class GoogleAuthHandler:
    def __init__(self):
        self.token_path = settings.google_token_file
        self.client_config = {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.google_redirect_uri]
            }
        }

    def get_auth_url(self):
        """Generates the authorization URL for the client."""
        flow = Flow.from_client_config(
            self.client_config,
            scopes=SCOPES,
            redirect_uri=settings.google_redirect_uri
        )
        auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
        return auth_url

    def handle_callback(self, code: str):
        """Processes the authorization code from the callback."""
        try:
            flow = Flow.from_client_config(
                self.client_config,
                scopes=SCOPES,
                redirect_uri=settings.google_redirect_uri
            )
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            # Save the credentials for the next run
            with open(self.token_path, 'w') as token:
                token.write(credentials.to_json())
            
            logger.info("✅ Google OAuth credentials saved successfully.")
            return credentials
        except Exception as e:
            logger.error(f"❌ OAuth Handshake Failed: {str(e)}")
            raise e

    def get_credentials(self):
        """Retrieves valid credentials, refreshing them if necessary."""
        creds = None
        if os.path.exists(self.token_path):
            creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                logger.info("🔄 Refreshing Google OAuth token...")
                creds.refresh(Request())
                with open(self.token_path, 'w') as token:
                    token.write(creds.to_json())
            else:
                logger.warning("❌ No valid Google OAuth credentials found.")
                return None
        
        return creds

google_auth = GoogleAuthHandler()
