from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", extra="ignore")

    ai_service_port: int = 8000
    redis_url: str = "redis://localhost:6379"
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-5-5"


settings = Settings()
