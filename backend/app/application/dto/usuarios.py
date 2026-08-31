"""DTOs de gestión de usuarios."""
from dataclasses import dataclass


@dataclass
class DatosNuevoUsuario:
    nombre: str
    email: str
    password: str
    rol_id: int


@dataclass
class DatosActualizarUsuario:
    nombre: str
    email: str
    rol_id: int
    activo: bool
    # Solo se aplica si el actor tiene permiso 'usuarios:proteger'.
    es_protegido: bool | None = None
