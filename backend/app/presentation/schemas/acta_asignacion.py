"""Schema del formulario del Acta de Asignación de equipos tecnológicos."""
from pydantic import BaseModel, Field


class AccesorioItem(BaseModel):
    nombre: str
    entregado: bool = False
    marca_serie: str | None = None
    observaciones: str | None = None


class ActaAsignacionDatos(BaseModel):
    codigo: str | None = None
    fecha: str | None = None  # AAAA-MM-DD; por defecto hoy

    # Funcionario asignado
    funcionario_nombre: str | None = Field(default=None, max_length=200)
    funcionario_documento: str | None = Field(default=None, max_length=50)
    funcionario_cargo: str | None = Field(default=None, max_length=150)
    dependencia: str | None = Field(default=None, max_length=200)
    correo: str | None = Field(default=None, max_length=150)
    telefono: str | None = Field(default=None, max_length=50)

    # Estado al asignar
    estado_condicion: str | None = None  # nuevo | usado | reasignado
    observaciones_estado: str | None = None

    accesorios: list[AccesorioItem] = []

    # Firmas (digitado)
    entrega_nombre: str | None = Field(default=None, max_length=200)
    entrega_cargo: str | None = Field(default=None, max_length=150)
    recibe_nombre: str | None = Field(default=None, max_length=200)
    recibe_cargo: str | None = Field(default=None, max_length=150)
