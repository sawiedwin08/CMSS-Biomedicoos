"""Schema del resumen del tablero de Inicio (módulo Sistemas)."""
from pydantic import BaseModel


class EstadoConteo(BaseModel):
    estado: str
    cantidad: int


class ResumenRead(BaseModel):
    activos_total: int
    activos_operativo: int
    activos_en_reparacion: int
    activos_en_bodega: int
    activos_baja: int
    tickets_abiertos: int
    tickets_nuevos_hoy: int
    cuentas_activas: int
    tickets_por_estado: list[EstadoConteo]
