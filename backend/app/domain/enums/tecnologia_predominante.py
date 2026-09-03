"""Tecnología predominante del equipo. Vocabulario fijo."""
from enum import StrEnum


class TecnologiaPredominante(StrEnum):
    ELECTRICO = "Eléctrico"
    MECANICO = "Mecanico"
    NEUMATICO = "Neumático"
    ELECTRONICA = "Electrónica"
    ELECTROMECANICO = "Electromecánico"
    A_VAPOR = "A vapor"
    HIDRAULICO = "Hidráulico"
    OTRO = "Otro"
