"""Tipos de mantenimiento (RF-013)."""
from enum import Enum


class TipoMantenimiento(str, Enum):
    """Tipos de órdenes de trabajo para equipos biomédicos."""
    PREVENTIVO = "preventivo"
    CORRECTIVO = "correctivo"
    CALIBRACION = "calibracion"
    OTRA = "otra"
