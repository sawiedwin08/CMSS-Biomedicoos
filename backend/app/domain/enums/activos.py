"""Vocabularios del inventario de activos de TI (módulo Sistemas).

Se usan para validar en los schemas de la API. En la base se almacenan como
texto (el *valor* del StrEnum), no como tipos ENUM nativos de PostgreSQL.
"""
from enum import StrEnum


class CategoriaActivo(StrEnum):
    COMPUTO = "computo"
    RED = "red"
    PERIFERICO = "periferico"


class EstadoActivo(StrEnum):
    OPERATIVO = "operativo"
    ASIGNADO = "asignado"
    EN_BODEGA = "en_bodega"
    EN_REPARACION = "en_reparacion"
    DADO_DE_BAJA = "baja"


class TipoComputo(StrEnum):
    ESCRITORIO = "escritorio"
    PORTATIL = "portatil"
    SERVIDOR = "servidor"
    AIO = "aio"


class TipoRed(StrEnum):
    ROUTER = "router"
    SWITCH = "switch"
    ACCESS_POINT = "access_point"
    FIREWALL = "firewall"
    MODEM = "modem"


class TipoPeriferico(StrEnum):
    MONITOR = "monitor"
    IMPRESORA = "impresora"
    ESCANER = "escaner"
    UPS = "ups"
    DIADEMA = "diadema"
    CAMARA = "camara"
    DOCKING = "docking"
    PROYECTOR = "proyector"
    LECTOR = "lector"
    OTRO = "otro"


class MotivoBaja(StrEnum):
    OBSOLESCENCIA = "obsolescencia"
    DANIO = "danio"
    PERDIDA = "perdida"
    ROBO = "robo"
    DONACION = "donacion"
    VENTA = "venta"


class TipoMantenimientoTI(StrEnum):
    VERIFICACION = "verificacion"
    PREVENTIVO = "preventivo"
    CORRECTIVO = "correctivo"
    SEGUIMIENTO = "seguimiento"
