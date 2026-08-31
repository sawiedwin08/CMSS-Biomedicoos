"""Configuración de la aplicación cargada desde variables de entorno (.env)."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Raíz del repositorio (…/CMSS-Biomedico), donde vive el archivo .env
_REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Aplicación
    APP_NAME: str = "CMSS-Biomedico"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Base de datos (PostgreSQL)
    DATABASE_URL: str = "postgresql+psycopg://cmss:changeme@localhost:5432/cmss_biomedico"

    # Seguridad / JWT
    SECRET_KEY: str = "cambiar-esta-clave"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173"

    # Almacenamiento de archivos
    STORAGE_DIR: str = "./uploads"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
