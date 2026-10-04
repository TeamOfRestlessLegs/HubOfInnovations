from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

SERVICE_DIR = Path(__file__).resolve().parents[1]
# Lokalnie: HubOfInnovations/Dane. W kontenerze (/app) nie ma katalogu wyżej — tam ustaw SPLOT_DANE_DIR.
DEFAULT_DANE_DIR = SERVICE_DIR.parents[1] / "Dane" if len(SERVICE_DIR.parents) > 1 else Path("/dane")


class Settings(BaseSettings):
    """Konfiguracja z zmiennych środowiskowych / pliku .env w katalogu ai-service."""

    model_config = SettingsConfigDict(env_file=SERVICE_DIR / ".env", extra="ignore")

    openai_key: str  # OPENAI_KEY
    vector_db_path: Path = SERVICE_DIR / "vector_db"  # VECTOR_DB_PATH
    collection: str = "innowacje"  # COLLECTION — fragmenty
    profiles_collection: str = "innowacje_profile"  # PROFILES_COLLECTION — 1 dokument na innowację
    splot_dane_dir: Path = DEFAULT_DANE_DIR  # SPLOT_DANE_DIR — pakiet splot_dane (Obserwator)
    innovations_api_url: str = "http://127.0.0.1:8081"  # INNOVATIONS_API_URL — serwis innovations (Java)
    innovations_timeout: float = 3.0  # INNOVATIONS_TIMEOUT — sekundy; po nim /search zwraca wyniki bez szczegółów
    analysis_model: str = "gpt-4.1-mini"  # ANALYSIS_MODEL — model do analiz innowacji
    analysis_db_path: Path = SERVICE_DIR / "data" / "analyses.sqlite"  # ANALYSIS_DB_PATH — cache analiz
    observer_db_path: Path | None = None  # OBSERVER_DB_PATH — domyślnie Dane/data/obserwator.sqlite
    middleman_model: str = "gpt-4o-mini"  # MIDDLEMAN_MODEL — model OpenAI piszący plany wdrożenia
    assistant_model: str = "gpt-4o-mini"  # ASSISTANT_MODEL — model OpenAI asystenta wniosku


@lru_cache
def get_settings() -> Settings:
    return Settings()
