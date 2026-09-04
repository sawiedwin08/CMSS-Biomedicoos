"""Schemas Pydantic para usuarios (contrato HTTP / Swagger)."""
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UsuarioCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    rol_id: int


class UsuarioUpdate(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    email: EmailStr
    rol_id: int
    activo: bool = True
    # Solo lo aplica el backend si el actor tiene 'usuarios:proteger'.
    es_protegido: bool | None = None


class AsignarRol(BaseModel):
    rol_id: int


class CambiarPassword(BaseModel):
    password: str = Field(min_length=8, max_length=128)


class UsuarioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    email: EmailStr
    activo: bool
    es_protegido: bool
    rol_id: int
    rol_nombre: str | None = None
    permisos: list[str] = []
    modulos: list[str] = []
