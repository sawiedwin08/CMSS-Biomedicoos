"""Entidad de dominio Servicio (área dentro de una sede — RF-004)."""
from dataclasses import dataclass


@dataclass
class Servicio:
    nombre: str
    sede_id: int
    activo: bool = True
    id: int | None = None
    sede_nombre: str | None = None
