"""Entidad de dominio Módulo (área funcional de la plataforma)."""
from dataclasses import dataclass


@dataclass
class Modulo:
    slug: str
    nombre: str
    descripcion: str | None = None
    icono: str | None = None
    orden: int = 0
    activo: bool = True
    id: int | None = None
