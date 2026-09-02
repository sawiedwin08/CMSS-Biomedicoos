"""DTOs de gestión de sedes (RF-004)."""
from dataclasses import dataclass


@dataclass
class DatosSede:
    nombre: str
    direccion: str | None = None
    ciudad: str | None = None
    activo: bool = True
