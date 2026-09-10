"""Schemas Pydantic para OrdenTrabajo (RF-013)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums.tipo_mantenimiento import TipoMantenimiento
from app.domain.enums.estado_ot import EstadoOT


class OTBase(BaseModel):
    tipo: TipoMantenimiento = TipoMantenimiento.PREVENTIVO
    descripcion: str | None = Field(default=None, max_length=2000)
    observaciones: str | None = Field(default=None, max_length=2000)
    tecnico_id: int | None = None
    tecnico_nombre: str | None = Field(default=None, max_length=200)
    fecha_programada: datetime | None = None
    tiempo_empleado_minutos: int | None = None
    costo_total: float | None = None
    repuestos: str | None = Field(default=None, max_length=2000)


class OTCreate(OTBase):
    pass


class OTUpdate(OTBase):
    estado: EstadoOT | None = None


class OTRead(OTBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipo_id: int
    equipo_nombre: str | None = None
    estado: EstadoOT
    fecha_inicio: datetime | None
    fecha_cierre: datetime | None
    fecha_firma_coordinador: datetime | None
    fecha_firma_tecnico: datetime | None
    created_at: datetime
    updated_at: datetime


class ChecklistPasoCreate(BaseModel):
    orden: int
    descripcion: str = Field(min_length=1, max_length=500)
    instrucciones: str | None = Field(default=None, max_length=2000)


class ChecklistEquipoCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=200)
    descripcion: str | None = Field(default=None, max_length=2000)
    pasos: list[ChecklistPasoCreate] = Field(default_factory=list)


class ChecklistPasoRead(ChecklistPasoCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    checklist_id: int


class ChecklistEquipoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipo_id: int
    nombre: str
    descripcion: str | None
    activo: bool
    pasos: list[ChecklistPasoRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class EjecucionPasoCreate(BaseModel):
    paso_id: int
    estado: str = Field(pattern="^(R|NR|PA)$")
    observacion: str | None = Field(default=None, max_length=500)


class EjecucionPasoRead(EjecucionPasoCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ot_id: int


class CambioEstadoOT(BaseModel):
    """Schema para cambiar el estado de una OT."""
    nuevo_estado: EstadoOT
