"""Schemas Pydantic para documentos de equipos."""
from datetime import datetime

from pydantic import BaseModel, Field


class UsuarioEnDocumento(BaseModel):
    """Info mínima del usuario que subió el documento."""

    id: int
    nombre: str

    model_config = {"from_attributes": True}


class DocumentoEquipoRead(BaseModel):
    """Representación de un documento de equipo (lectura)."""

    id: int
    equipo_id: int
    usuario_id: int | None
    usuario: UsuarioEnDocumento | None = None
    tipo: str = Field(
        description="manual | plano | calibracion | recomendacion"
    )
    nombre_archivo: str
    tamaño_bytes: int
    mime_type: str
    descripcion: str | None = None
    año_documento: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentoEquipoCreate(BaseModel):
    """Datos para crear un documento (usado en multipart form)."""

    tipo: str = Field(
        description="manual | plano | calibracion | recomendacion",
        min_length=1,
        max_length=30,
    )
    descripcion: str | None = Field(default=None, max_length=500)


class DocumentoEquipoListResponse(BaseModel):
    """Listado de documentos por tipo."""

    tipo: str
    documentos: list[DocumentoEquipoRead]


class DocumentoEquipoDownloadResponse(BaseModel):
    """Respuesta cuando se descarga un documento (metadatos)."""

    id: int
    nombre_archivo: str
    mime_type: str
    tamaño_bytes: int
