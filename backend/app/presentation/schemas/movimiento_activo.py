"""Schemas Pydantic para MovimientoActivo (trazabilidad de activos de TI)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MovimientoActivoCreate(BaseModel):
    """Datos para registrar un traslado/reasignación (el destino)."""

    sede_destino_id: int | None = None
    area_destino_id: int | None = None
    usuario_destino_id: int | None = None
    motivo: str | None = Field(default=None, max_length=250)
    responsable: str | None = Field(default=None, max_length=150)


class MovimientoActivoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activo_id: int
    sede_origen_id: int | None
    area_origen_id: int | None
    sede_destino_id: int | None
    area_destino_id: int | None
    usuario_origen_id: int | None
    usuario_destino_id: int | None
    motivo: str | None
    responsable: str | None
    fecha_movimiento: datetime

    # Nombres para la UI
    sede_origen_nombre: str | None = None
    area_origen_nombre: str | None = None
    sede_destino_nombre: str | None = None
    area_destino_nombre: str | None = None
    usuario_origen_nombre: str | None = None
    usuario_destino_nombre: str | None = None
