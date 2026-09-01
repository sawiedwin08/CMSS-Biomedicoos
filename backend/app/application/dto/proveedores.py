"""DTOs de gestión de proveedores (RF-005)."""
from dataclasses import dataclass


@dataclass
class DatosProveedor:
    nombre: str
    nit: str | None = None
    contacto: str | None = None
    telefono: str | None = None
    email: str | None = None
    activo: bool = True
