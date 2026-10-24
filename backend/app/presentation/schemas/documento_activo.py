"""Schemas Pydantic para documentos de activos de TI."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UsuarioEnDocumento(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str


class ActaListItem(BaseModel):
    """Fila de la lista global de actas (sección Actas del módulo)."""

    id: int
    activo_id: int
    activo_codigo: str
    activo_nombre: str
    tipo: str
    nombre_archivo: str
    descripcion: str | None = None
    usuario: UsuarioEnDocumento | None = None
    created_at: datetime


class DocumentoActivoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activo_id: int
    usuario_id: int | None
    usuario: UsuarioEnDocumento | None = None
    tipo: str = Field(description="factura | garantia | acta | manual | otro")
    nombre_archivo: str
    tamano_bytes: int
    mime_type: str
    descripcion: str | None = None
    created_at: datetime
    updated_at: datetime
