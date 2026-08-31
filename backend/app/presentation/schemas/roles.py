"""Schemas Pydantic para roles (RF-028, RF-029)."""
from pydantic import BaseModel, ConfigDict, Field

from app.presentation.schemas.permisos import PermisoRead


class RolRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str | None = None
    es_sistema: bool
    permisos: list[PermisoRead] = []


class RolCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=50)
    descripcion: str | None = Field(default=None, max_length=200)
    permiso_ids: list[int] = []


class RolUpdate(BaseModel):
    nombre: str = Field(min_length=2, max_length=50)
    descripcion: str | None = Field(default=None, max_length=200)


class RolPermisosUpdate(BaseModel):
    permiso_ids: list[int]
