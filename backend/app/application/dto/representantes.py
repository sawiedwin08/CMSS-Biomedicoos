"""DTOs de gestión de representantes (maestro de equipos biomédicos)."""
from dataclasses import dataclass


@dataclass
class DatosRepresentante:
    nombre: str
    pais: str | None = None
    ciudad: str | None = None
    direccion: str | None = None
    telefono: str | None = None
    correo: str | None = None
    activo: bool = True
