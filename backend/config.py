"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    # Database
    DATABASE_URL: str = "sqlite:///./pis.db"

    # Authentication
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # AI Integration
    AI_API_KEY: str = ""
    AI_API_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    AI_MODEL: str = "gemini-2.0-flash"

    # Application
    APP_NAME: str = "Personal Intelligence System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Default currency
    DEFAULT_CURRENCY: str = "NPR"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
