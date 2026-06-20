"""Application configuration loaded from environment variables.

All tunables live here so that swapping providers (LLM / receipt / recipe) or
moving from SQLite to Postgres is a one-line env change, never a code change.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # App
    app_env: str = "development"
    database_url: str = "sqlite:///./data/naengbu.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # LLM provider
    llm_provider: str = "mock"  # azure_openai | mock
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_api_version: str = "2024-08-01-preview"
    azure_openai_deployment: str = "gpt-4o"

    # Receipt parser
    receipt_parser: str = "llm_vision"  # llm_vision | clova_hybrid
    clova_ocr_invoke_url: str = ""
    clova_ocr_secret: str = ""

    # Recipe source
    recipe_source: str = "hybrid"  # llm_gen | seed_db | hybrid

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def azure_openai_configured(self) -> bool:
        return bool(self.azure_openai_endpoint and self.azure_openai_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
