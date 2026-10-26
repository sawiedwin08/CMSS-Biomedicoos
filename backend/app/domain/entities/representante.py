"""Entidad de dominio Representante (maestro de equipos biomédicos)."""
from dataclasses import dataclass


@dataclass
class Representante:
    nombre: str
    pais: str | None = None
    ciudad: str | None = None
    direccion: str | None = None
    telefono: str | None = None
    correo: str | None = None
    activo: bool = True
    id: int | None = None
