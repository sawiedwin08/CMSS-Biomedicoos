"""Schemas Pydantic para equipos (RF-001..007)."""
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums.clasificacion_riesgo import ClasificacionRiesgo
from app.domain.enums.criticidad import Criticidad
from app.domain.enums.estado_equipo import EstadoEquipo
from app.domain.enums.propiedad import Propiedad


class EquipoBase(BaseModel):
    # Opcional al crear: si viene vacío, el sistema genera 'EQ-0001'.
    codigo_interno: str | None = Field(default=None, max_length=50)
    serial_fabricante: str = Field(min_length=1, max_length=100)
    nombre: str = Field(min_length=2, max_length=200)
    estado: EstadoEquipo = EstadoEquipo.OPERATIVO
    marca: str | None = Field(default=None, max_length=100)
    modelo: str | None = Field(default=None, max_length=100)
    criticidad: Criticidad | None = None
    registro_invima: str | None = Field(default=None, max_length=100)
    clasificacion_riesgo: ClasificacionRiesgo | None = None
    propiedad: Propiedad | None = None
    sede_id: int | None = None
    servicio_id: int | None = None
    proveedor_id: int | None = None
    fecha_adquisicion: date | None = None
    costo_adquisicion: Decimal | None = None
    fin_garantia: date | None = None
    orden_compra: str | None = Field(default=None, max_length=100)


class EquipoCreate(EquipoBase):
    pass


class EquipoUpdate(EquipoBase):
    # En edición el código ya existe y es obligatorio.
    codigo_interno: str = Field(min_length=1, max_length=50)


class EquipoRead(EquipoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo_interno: str
    sede_nombre: str | None = None
    servicio_nombre: str | None = None
    proveedor_nombre: str | None = None


class ErrorFilaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    fila: int
    mensaje: str


class ImportacionResultado(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total: int
    creados: int
    errores: list[ErrorFilaRead]
