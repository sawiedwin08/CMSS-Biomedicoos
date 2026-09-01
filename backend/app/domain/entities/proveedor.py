"""Entidad de dominio Proveedor (RF-005 — datos de adquisición)."""
from dataclasses import dataclass


@dataclass
class Proveedor:
    nombre: str
    nit: str | None = None
    contacto: str | None = None
    telefono: str | None = None
    email: str | None = None
    activo: bool = True
    id: int | None = None
