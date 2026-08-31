"""Estado operativo de un equipo biomédico (RF-006)."""
from enum import StrEnum


class EstadoEquipo(StrEnum):
    OPERATIVO = "operativo"
    EN_MANTENIMIENTO = "mantenimiento"
    FUERA_DE_SERVICIO = "fuera_de_servicio"
    DADO_DE_BAJA = "baja"
