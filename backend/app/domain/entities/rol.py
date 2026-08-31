"""Entidad de dominio Rol (RF-028, RF-029)."""
from dataclasses import dataclass, field

from app.domain.entities.permiso import Permiso


@dataclass
class Rol:
    nombre: str
    descripcion: str | None = None
    es_sistema: bool = False
    permisos: list[Permiso] = field(default_factory=list)
    id: int | None = None
