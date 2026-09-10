"""Schemas Pydantic para MovimientoEquipo (RF-004 — trazabilidad de ubicaciones)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MovimientoEquipoCreate(BaseModel):
    """Datos para registrar un nuevo movimiento."""
    sede_origen_id: int | None = None
    servicio_origen_id: int | None = None
    sede_destino_id: int | None = None
    servicio_destino_id: int | None = None
    motivo: str | None = Field(default=None, max_length=250)
    responsable: str | None = Field(default=None, max_length=150)


class MovimientoEquipoRead(BaseModel):
    """Lectura de un movimiento con detalles relacionados."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipo_id: int
    sede_origen_id: int | None
    servicio_origen_id: int | None
    sede_destino_id: int | None
    servicio_destino_id: int | None
    motivo: str | None
    responsable: str | None
    fecha_movimiento: datetime

    # Campos adicionales para UI (nombres de sede/servicio)
    sede_origen_nombre: str | None = None
    servicio_origen_nombre: str | None = None
    sede_destino_nombre: str | None = None
    servicio_destino_nombre: str | None = None
