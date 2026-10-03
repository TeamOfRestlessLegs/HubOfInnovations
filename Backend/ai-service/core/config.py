from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

SERVICE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    """Konfiguracja z zmiennych środowiskowych / pliku .env w katalogu ai-service."""

    model_config = SettingsConfigDict(env_file=SERVICE_DIR / ".env", extra="ignore")

    openai_key: str  # OPENAI_KEY
    vector_db_path: Path = SERVICE_DIR / "vector_db"  # VECTOR_DB_PATH
    collection: str = "innowacje"  # COLLECTION — fragmenty
    profiles_collection: str = "innowacje_profile"  # PROFILES_COLLECTION — 1 dokument na innowację
    splot_dane_dir: Path = SERVICE_DIR.parents[1] / "Dane"  # SPLOT_DANE_DIR — pakiet splot_dane (Obserwator)
    observer_db_path: Path | None = None  # OBSERVER_DB_PATH — domyślnie Dane/data/obserwator.sqlite


@lru_cache
def get_settings() -> Settings:
    return Settings()
