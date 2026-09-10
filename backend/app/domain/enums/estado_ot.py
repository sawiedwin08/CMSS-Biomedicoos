"""Estados de una Orden de Trabajo (RF-013)."""
from enum import Enum


class EstadoOT(str, Enum):
    """Estados posibles de una orden de trabajo."""
    PENDIENTE = "pendiente"
    EN_PROGRESO = "en_progreso"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"
