"""Schema del resumen del tablero de Inicio (módulo Sistemas)."""
from pydantic import BaseModel


class EstadoConteo(BaseModel):
    estado: str
    cantidad: int


class PrioridadConteo(BaseModel):
    prioridad: str
    cantidad: int


class DiaConteo(BaseModel):
    fecha: str
    cantidad: int


class AreaConteo(BaseModel):
    area: str
    cantidad: int


class ResumenRead(BaseModel):
    # Inventario de equipos
    activos_total: int
    activos_operativo: int
    activos_en_reparacion: int
    activos_en_bodega: int
    activos_baja: int
    # Soporte
    tickets_abiertos: int
    tickets_recibidos_periodo: int
    # Período efectivo (ISO) para mostrar y para los gráficos
    periodo_desde: str
    periodo_hasta: str
    tickets_por_dia: list[DiaConteo]
    tickets_por_estado: list[EstadoConteo]
    tickets_por_prioridad: list[PrioridadConteo]
    tickets_por_area: list[AreaConteo]
