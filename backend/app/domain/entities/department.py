"""Entidad de Dominio - Departamento (Módulo Tardanzas - RF-031)."""
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Department:
    id: int | None
    name: str
    is_active: bool = True
    is_deleted: bool = False
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
