"""Schemas Pydantic para representantes (maestro de equipos biomédicos)."""
from pydantic import BaseModel, ConfigDict, Field


class RepresentanteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    pais: str | None = None
    ciudad: str | None = None
    direccion: str | None = None
    telefono: str | None = None
    correo: str | None = None
    activo: bool


class RepresentanteCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=200)
    pais: str | None = Field(default=None, max_length=100)
    ciudad: str | None = Field(default=None, max_length=100)
    direccion: str | None = Field(default=None, max_length=200)
    telefono: str | None = Field(default=None, max_length=50)
    correo: str | None = Field(default=None, max_length=150)
    activo: bool = True


class RepresentanteUpdate(RepresentanteCreate):
    pass
