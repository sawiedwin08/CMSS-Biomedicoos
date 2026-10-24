"""Vocabularios de la Mesa de ayuda (tickets). Se guardan como texto."""
from enum import StrEnum


class CategoriaTicket(StrEnum):
    HARDWARE = "hardware"
    SOFTWARE = "software"
    RED = "red"
    CORREO = "correo"
    ACCESOS = "accesos"
    IMPRESION = "impresion"
    OTRO = "otro"


class PrioridadTicket(StrEnum):
    BAJA = "baja"
    MEDIA = "media"
    ALTA = "alta"
    CRITICA = "critica"


class EstadoTicket(StrEnum):
    NUEVO = "nuevo"
    ASIGNADO = "asignado"
    EN_PROCESO = "en_proceso"
    EN_ESPERA = "en_espera"
    RESUELTO = "resuelto"
    CERRADO = "cerrado"
    REABIERTO = "reabierto"
