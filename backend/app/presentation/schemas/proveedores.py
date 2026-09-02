"""Schemas Pydantic para proveedores (RF-005)."""
from pydantic import BaseModel, ConfigDict, Field


class ProveedorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    nit: str | None = None
    contacto: str | None = None
    telefono: str | None = None
    email: str | None = None
    activo: bool


class ProveedorCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=200)
    nit: str | None = Field(default=None, max_length=30)
    contacto: str | None = Field(default=None, max_length=150)
    telefono: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=150)
    activo: bool = True


class ProveedorUpdate(ProveedorCreate):
    pass
