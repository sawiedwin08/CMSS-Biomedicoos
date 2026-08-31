"""Entidad de dominio Permiso (RF-029)."""
from dataclasses import dataclass


@dataclass
class Permiso:
    modulo: str
    accion: str
    codigo: str
    descripcion: str | None = None
    id: int | None = None
