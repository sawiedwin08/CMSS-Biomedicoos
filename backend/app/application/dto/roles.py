"""DTOs de gestión de roles (RF-028, RF-029)."""
from dataclasses import dataclass, field


@dataclass
class DatosNuevoRol:
    nombre: str
    descripcion: str | None = None
    permiso_ids: list[int] = field(default_factory=list)


@dataclass
class DatosActualizarRol:
    nombre: str
    descripcion: str | None = None
