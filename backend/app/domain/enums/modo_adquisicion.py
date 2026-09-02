"""Modo de adquisición del equipo. Vocabulario fijo."""
from enum import StrEnum


class ModoAdquisicion(StrEnum):
    COMPRA_DIRECTA = "Compra Directa"
    COMODATO = "Comodato"
