"""Entidad de Dominio - AppSetting (Módulo Tardanzas - RF-031)."""
from dataclasses import dataclass
from datetime import datetime


@dataclass
class AppSetting:
    id: int | None
    key: str
    value: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
