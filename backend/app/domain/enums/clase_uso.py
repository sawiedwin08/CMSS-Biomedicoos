"""Clase de uso del equipo. Vocabulario fijo."""
from enum import StrEnum


class ClaseUso(StrEnum):
    MEDICO = "Medico"
    BASICO = "Basico"
    APOYO = "Apoyo"
    USO = "Uso"
    NO_APLICA = "No Aplica"
