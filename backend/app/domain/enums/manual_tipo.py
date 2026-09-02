"""Tipos de manuales disponibles del equipo (selección múltiple). Vocabulario fijo."""
from enum import StrEnum


class ManualTipo(StrEnum):
    OPERACION = "Operación"
    MANTENIMIENTO = "Mantenimiento"
    PARTES = "Partes"
    DESPIECES = "Despieces"
    NINGUNO = "Ninguno"
