"""
Production Configuration — Single Source of Truth.
Implements Model Routing: different tiers for different agents.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    # --- API Keys ---
    google_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None

    # --- Model Routing (Interview Q8: Tiered Cost Optimization) ---
    # Router: cheap/fast model (classification is easy)
    router_model: str = "gemini-2.5-flash"
    router_temperature: float = 0.0  # deterministic classification

    # Writer: medium model (creative drafting)
    writer_model: str = "gemini-2.5-flash"
    writer_temperature: float = 0.5  # some creativity

    # Verifier: smartest model (needs to catch subtle errors)
    verifier_model: str = "gemini-2.5-flash"
    verifier_temperature: float = 0.1  # near-deterministic review

    # Researcher: fast model (just extraction)
    researcher_model: str = "gemini-2.5-flash"
    researcher_temperature: float = 0.0

    # --- Graph Config ---
    max_revisions: int = 3          # Max Writer↔Verifier loops
    recursion_limit: int = 15       # Hard failsafe for LangGraph

    # --- DB Config ---
    db_name: str = "beaver.db"

    # --- App Config ---
    app_name: str = "Beaver Agent"
    debug: bool = False
    log_level: str = "INFO"

    # --- Security ---
    # Optional API key for protecting the /process endpoint.
    # If set, callers must send "X-API-Key: <value>" header.
    api_key: Optional[str] = None
    # Comma-separated allowed CORS origins. Override in production.
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    # Maximum length (chars) of accepted email text. Guards against DoS.
    max_email_length: int = 10_000

    # --- Google OAuth (Gmail integration) ---
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: str = "http://localhost:8000/callback"
    google_token_file: str = "token.json"

    # --- Email Poller ---
    # How often (seconds) to poll Gmail for new unread emails.
    poll_interval: int = 60

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        """Parse allowed_origins string into a list."""
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
