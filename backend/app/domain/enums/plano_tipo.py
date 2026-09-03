"""Tipos de planos disponibles del equipo (selección múltiple). Vocabulario fijo."""
from enum import StrEnum


class PlanoTipo(StrEnum):
    ELECTRICO = "Eléctrico"
    ELECTRONICOS = "Electrónicos"
    HIDRAULICOS = "Hidraulicos"
    NEUMATICOS = "Neumaticos"
    NINGUNO = "Ninguno"
