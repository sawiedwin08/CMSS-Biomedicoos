"""Schemas Pydantic del inventario de activos de TI (módulo Sistemas)."""
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums.activos import (
    CategoriaActivo,
    EstadoActivo,
    MotivoBaja,
    TipoComputo,
    TipoPeriferico,
    TipoRed,
)


class ActivoBase(BaseModel):
    # --- Comunes ---
    categoria: CategoriaActivo
    nombre: str = Field(min_length=1, max_length=200)
    codigo_interno: str = Field(default="", max_length=50)
    estado: EstadoActivo = EstadoActivo.OPERATIVO
    marca: str | None = Field(default=None, max_length=100)
    modelo: str | None = Field(default=None, max_length=100)
    serial: str | None = Field(default=None, max_length=100)
    placa_inventario: str | None = Field(default=None, max_length=50)
    sede_id: int | None = None
    area_id: int | None = None
    piso: str | None = Field(default=None, max_length=50)
    asignado_a_usuario_id: int | None = None
    asignado_a_nombre: str | None = Field(default=None, max_length=150)
    fecha_asignacion: date | None = None
    fecha_adquisicion: date | None = None
    proveedor_id: int | None = None
    costo: Decimal | None = None
    orden_compra: str | None = Field(default=None, max_length=100)
    factura: str | None = Field(default=None, max_length=100)
    garantia_inicio: date | None = None
    garantia_fin: date | None = None
    observaciones: str | None = None
    ip: str | None = Field(default=None, max_length=45)
    mac: str | None = Field(default=None, max_length=17)

    # --- Cómputo ---
    tipo_computo: TipoComputo | None = None
    hostname: str | None = Field(default=None, max_length=100)
    cpu: str | None = Field(default=None, max_length=150)
    ram_capacidad: str | None = Field(default=None, max_length=50)
    ram_tipo: str | None = Field(default=None, max_length=30)
    disco_tipo: str | None = Field(default=None, max_length=20)
    disco_capacidad: str | None = Field(default=None, max_length=50)
    sistema_operativo: str | None = Field(default=None, max_length=100)
    dominio: str | None = Field(default=None, max_length=100)
    inc_teclado: bool = False
    inc_mouse: bool = False
    inc_cable_poder: bool = False
    inc_cable_video: bool = False
    accesorios_otro: str | None = Field(default=None, max_length=200)

    # --- Red ---
    tipo_red: TipoRed | None = None
    num_puertos: int | None = None
    poe: bool = False
    firmware: str | None = Field(default=None, max_length=100)
    ubicacion_fisica: str | None = Field(default=None, max_length=150)
    config_notas: str | None = None

    # --- Periférico ---
    tipo_periferico: TipoPeriferico | None = None
    asociado_a_activo_id: int | None = None
    monitor_pulgadas: str | None = Field(default=None, max_length=20)
    monitor_resolucion: str | None = Field(default=None, max_length=30)
    impresora_tecnologia: str | None = Field(default=None, max_length=30)
    impresora_conexion: str | None = Field(default=None, max_length=30)


class ActivoCreate(ActivoBase):
    pass


class ActivoUpdate(ActivoBase):
    pass


class ActivoRead(ActivoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    # --- Baja ---
    fecha_baja: date | None = None
    motivo_baja: MotivoBaja | None = None
    baja_autorizado_por: str | None = None
    acta_baja: str | None = None


class ActivoBaja(BaseModel):
    motivo_baja: MotivoBaja
    fecha_baja: date | None = None
    baja_autorizado_por: str | None = Field(default=None, max_length=150)
    acta_baja: str | None = Field(default=None, max_length=200)
