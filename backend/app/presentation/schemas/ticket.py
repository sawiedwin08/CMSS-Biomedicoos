"""Schemas de la Mesa de ayuda (tickets)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums.mesa_ayuda import (
    CategoriaTicket,
    CausaTicket,
    EstadoTicket,
    PrioridadTicket,
)


# ---------- Público (sin login) ----------
class TicketPublicoCreate(BaseModel):
    solicitante_nombre: str = Field(min_length=2, max_length=150)
    solicitante_correo: str = Field(min_length=5, max_length=150)
    area: str | None = Field(default=None, max_length=150)
    categoria: CategoriaTicket
    asunto: str = Field(min_length=3, max_length=200)
    descripcion: str = Field(min_length=3)


class TicketCreado(BaseModel):
    numero: str


class SeguimientoConsulta(BaseModel):
    numero: str
    correo: str


class ComentarioPublicoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    autor: str
    texto: str
    created_at: datetime


class AdjuntoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_archivo: str
    tamano_bytes: int
    mime_type: str
    origen: str
    created_at: datetime


class TicketPublicoRead(BaseModel):
    numero: str
    asunto: str
    categoria: str
    estado: str
    created_at: datetime
    comentarios: list[ComentarioPublicoRead] = []
    adjuntos: list[AdjuntoRead] = []


# ---------- Interno (bandeja) ----------
class TicketListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: str
    asunto: str
    solicitante_nombre: str
    categoria: str
    prioridad: str
    estado: str
    tecnico_nombre: str | None = None
    created_at: datetime


class TicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: str
    solicitante_nombre: str
    solicitante_correo: str
    area: str | None
    categoria: str
    asunto: str
    descripcion: str
    prioridad: str
    estado: str
    tecnico_id: int | None
    causa: str | None = None
    solucion: str | None = None
    fecha_primera_respuesta: datetime | None = None
    fecha_cierre: datetime | None = None
    created_at: datetime
    updated_at: datetime


class TicketUpdate(BaseModel):
    estado: EstadoTicket
    prioridad: PrioridadTicket
    categoria: CategoriaTicket
    causa: CausaTicket | None = None
    solucion: str | None = Field(default=None, max_length=2000)


class AsignarTicket(BaseModel):
    """Asignación/reasignación del técnico (permiso aparte)."""

    tecnico_id: int | None = None


class ComentarioCreate(BaseModel):
    texto: str = Field(min_length=1)
    es_publico: bool = True


class ComentarioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    autor: str
    texto: str
    es_publico: bool
    created_at: datetime
