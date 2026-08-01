from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "http://localhost:5173"
    # Cross-origin SPA (e.g. Vercel → Render): set COOKIE_SECURE=true and COOKIE_SAMESITE=none
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    # Upload / compute guardrails (env-overridable)
    MAX_UPLOAD_BYTES: int = 5 * 1024 * 1024  # 5 MB
    MAX_UPLOAD_ROWS: int = 10_000
    MAX_UPLOAD_COLUMNS: int = 50

    # Auth rate limit: max requests per IP per window for register/login/refresh
    AUTH_RATE_LIMIT_PER_MINUTE: int = 20


settings = Settings()
