"""Fuentes de alimentación del equipo (selección múltiple). Vocabulario fijo."""
from enum import StrEnum


class FuenteAlimentacion(StrEnum):
    AGUA = "Agua"
    DERIVADOS_PETROLEO = "Derivados de petroleo"
    O2 = "O2"
    VAPOR = "Vapor"
    NINGUNO = "Ninguno"
    AIRE = "Aire"
    GAS = "Gas"
    ELECTRICIDAD = "Electricidad"
    NITROGENO = "Nitrogeno"
    ENERGIA_SOLAR = "Energia solar"
    CO2 = "CO2"
    GASOLINA = "Gasolina"
