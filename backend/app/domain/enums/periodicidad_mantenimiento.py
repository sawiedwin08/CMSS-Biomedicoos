"""Periodicidades de mantenimiento (RF-004)."""
from enum import Enum


class PeriodicidadMantenimiento(str, Enum):
    """Períodos en los que se realiza mantenimiento a equipos."""
    SEMANAL = "semanal"
    QUINCENAL = "quincenal"
    MENSUAL = "mensual"
    TRIMESTRAL = "trimestral"
    SEMESTRAL = "semestral"
    ANUAL = "anual"

    @property
    def dias(self) -> int:
        """Retorna la cantidad de días de cada periodo."""
        return {
            "semanal": 7,
            "quincenal": 15,
            "mensual": 30,
            "trimestral": 90,
            "semestral": 180,
            "anual": 365,
        }[self.value]
