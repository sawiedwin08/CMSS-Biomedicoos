"""Schemas Pydantic para permisos (RF-029)."""
from pydantic import BaseModel, ConfigDict


class PermisoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    modulo: str
    accion: str
    codigo: str
    descripcion: str | None = None
