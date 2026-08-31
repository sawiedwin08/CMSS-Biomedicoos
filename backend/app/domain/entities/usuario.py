"""Entidad de dominio Usuario (independiente de la persistencia)."""
from dataclasses import dataclass, field


@dataclass
class Usuario:
    nombre: str
    email: str
    hashed_password: str
    rol_id: int
    activo: bool = True
    es_protegido: bool = False
    id: int | None = None
    # Datos del rol resueltos para autorización (se llenan al leer de la BD).
    rol_nombre: str | None = None
    permisos: frozenset[str] = field(default_factory=frozenset)

    def tiene_permiso(self, codigo: str) -> bool:
        return codigo in self.permisos
