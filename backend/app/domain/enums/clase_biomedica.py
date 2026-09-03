"""Clase biomédica del equipo (finalidad clínica). Vocabulario fijo."""
from enum import StrEnum


class ClaseBiomedica(StrEnum):
    DESCRIPCION = "Descripcion"
    DIAGNOSTICO = "Diagnostico"
    TRATAMIENTO_MANTENIMIENTO_VIDA = "Tratamiento y Mantenimiento de la Vida"
    PREVENCION = "Prevencion"
    REHABILITACION = "Rehabilitacion"
    ANALISIS_LABORATORIO = "Analisis de Laboratorio"
    NO_APLICA = "No Aplica"
