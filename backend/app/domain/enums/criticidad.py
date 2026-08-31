"""Criticidad del equipo para priorización de mantenimiento y filtros (RF-007)."""
from enum import StrEnum


class Criticidad(StrEnum):
    ALTA = "alta"
    MEDIA = "media"
    BAJA = "baja"
