"""Schemas Pydantic para sedes (RF-004)."""
from pydantic import BaseModel, ConfigDict, Field


class SedeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    direccion: str | None = None
    ciudad: str | None = None
    activo: bool


class SedeCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    direccion: str | None = Field(default=None, max_length=250)
    ciudad: str | None = Field(default=None, max_length=100)
    activo: bool = True


class SedeUpdate(SedeCreate):
    pass
