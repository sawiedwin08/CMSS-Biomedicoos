"""DTOs de gestión de servicios (RF-004)."""
from dataclasses import dataclass


@dataclass
class DatosServicio:
    nombre: str
    sede_id: int
    activo: bool = True
