"""Clasificación de riesgo de dispositivos médicos según INVIMA (RF-003).

Colombia clasifica los dispositivos médicos en cuatro clases de riesgo
(Decreto 4725 de 2005): I (bajo), IIa (moderado), IIb (alto) y III (muy alto).
Se incluye NR (no requiere / no reglamentado) para equipos sin clasificación.
"""
from enum import StrEnum


class ClasificacionRiesgo(StrEnum):
    I = "I"
    IIA = "IIa"
    IIB = "IIb"
    III = "III"
    NR = "NR"
