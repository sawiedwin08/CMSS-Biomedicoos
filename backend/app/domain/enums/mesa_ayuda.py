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


# Estados en los que el ticket se considera resuelto/cerrado (para medir tiempos).
ESTADOS_CERRADOS = frozenset({EstadoTicket.RESUELTO.value, EstadoTicket.CERRADO.value})


class CausaTicket(StrEnum):
    """Causa raíz / tipo de solución (la registra el técnico al resolver)."""

    HARDWARE = "hardware"
    SOFTWARE = "software"
    CONFIGURACION = "configuracion"
    USUARIO = "usuario"
    RED = "red"
    PROVEEDOR = "proveedor"
    OTRO = "otro"
