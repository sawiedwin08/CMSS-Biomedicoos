"""Schemas de la sección Redes e infraestructura (enlaces de internet + IPs)."""
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class EnlaceBase(BaseModel):
    proveedor: str = Field(min_length=1, max_length=150)
    sede_id: int | None = None
    tipo: str | None = Field(default=None, max_length=50)
    ancho_bajada: str | None = Field(default=None, max_length=50)
    ancho_subida: str | None = Field(default=None, max_length=50)
    ip_publica: str | None = Field(default=None, max_length=45)
    contacto: str | None = Field(default=None, max_length=150)
    telefono: str | None = Field(default=None, max_length=50)
    costo: Decimal | None = None
    estado: str = "activo"
    observaciones: str | None = None


class EnlaceCreate(EnlaceBase):
    pass


class EnlaceUpdate(EnlaceBase):
    pass


class EnlaceRead(EnlaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sede_nombre: str | None = None


class IpEnUso(BaseModel):
    ip: str
    origen: str  # equipo | enlace
    referencia: str
    sede: str | None = None
    duplicada: bool = False
