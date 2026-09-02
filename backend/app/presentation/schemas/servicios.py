"""Schemas Pydantic para servicios (RF-004)."""
from pydantic import BaseModel, ConfigDict, Field


class ServicioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    sede_id: int
    sede_nombre: str | None = None
    activo: bool


class ServicioCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    sede_id: int
    activo: bool = True


class ServicioUpdate(ServicioCreate):
    pass
