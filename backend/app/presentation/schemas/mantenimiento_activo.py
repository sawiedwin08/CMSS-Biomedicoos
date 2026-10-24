"""Schemas Pydantic para la bitácora de mantenimientos (módulo Sistemas)."""
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums.activos import TipoMantenimientoTI


class MantenimientoCreate(BaseModel):
    tipo: TipoMantenimientoTI
    fecha: date | None = None
    responsable: str | None = Field(default=None, max_length=150)
    descripcion: str | None = None


class MantenimientoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activo_id: int
    tipo: TipoMantenimientoTI
    fecha: date | None
    responsable: str | None
    descripcion: str | None
    created_at: datetime


class MantenimientoListItem(MantenimientoRead):
    activo_codigo: str
    activo_nombre: str
