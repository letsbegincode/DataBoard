from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "http://localhost:5173"
    # Cross-origin SPA (e.g. Vercel → Render): set COOKIE_SECURE=true and COOKIE_SAMESITE=none
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    class Config:
        env_file = ".env"

settings = Settings()
