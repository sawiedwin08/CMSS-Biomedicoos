"""Tipo de propiedad / tenencia del equipo (RF-005)."""
from enum import StrEnum


class Propiedad(StrEnum):
    PROPIO = "propio"
    ALQUILADO = "alquilado"
    LEASING = "leasing"
    PRESTAMO = "prestamo"
