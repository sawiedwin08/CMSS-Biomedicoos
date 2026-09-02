"""Entidad de dominio Sede (RF-004 — soporte multi-sede)."""
from dataclasses import dataclass


@dataclass
class Sede:
    nombre: str
    direccion: str | None = None
    ciudad: str | None = None
    activo: bool = True
    id: int | None = None
