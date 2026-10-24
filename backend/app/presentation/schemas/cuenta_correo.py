"""Schemas de cuentas de correo (la contraseña nunca se incluye en la lista)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CuentaCorreoCreate(BaseModel):
    correo: str = Field(min_length=3, max_length=150)
    contrasena: str = Field(min_length=1, max_length=200)
    asignado_a: str | None = Field(default=None, max_length=150)
    area: str | None = Field(default=None, max_length=150)
    recuperacion: str | None = Field(default=None, max_length=150)
    proposito: str | None = Field(default=None, max_length=200)
    estado: str = "activa"
    notas: str | None = None


class CuentaCorreoUpdate(BaseModel):
    correo: str = Field(min_length=3, max_length=150)
    # Vacía o nula = conservar la contraseña actual.
    contrasena: str | None = Field(default=None, max_length=200)
    asignado_a: str | None = Field(default=None, max_length=150)
    area: str | None = Field(default=None, max_length=150)
    recuperacion: str | None = Field(default=None, max_length=150)
    proposito: str | None = Field(default=None, max_length=200)
    estado: str = "activa"
    notas: str | None = None


class CuentaCorreoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    correo: str
    asignado_a: str | None
    area: str | None
    recuperacion: str | None
    proposito: str | None
    estado: str
    notas: str | None
    created_at: datetime


class PasswordRevelado(BaseModel):
    password: str
