"""Schemas Pydantic para módulos de la plataforma."""
from pydantic import BaseModel, ConfigDict


class ModuloRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    nombre: str
    descripcion: str | None = None
    icono: str | None = None
    orden: int
    activo: bool


class RolModulosUpdate(BaseModel):
    modulo_ids: list[int]
