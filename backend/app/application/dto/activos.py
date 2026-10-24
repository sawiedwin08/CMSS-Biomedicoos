"""DTOs del inventario de activos de TI (módulo Sistemas)."""
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from app.domain.enums.activos import (
    CategoriaActivo,
    EstadoActivo,
    MotivoBaja,
    TipoComputo,
    TipoPeriferico,
    TipoRed,
)


@dataclass
class DatosActivo:
    # Mismos campos que la entidad Activo (sin id); se copian con asdict.
    codigo_interno: str
    categoria: CategoriaActivo
    nombre: str

    estado: EstadoActivo = EstadoActivo.OPERATIVO
    marca: str | None = None
    modelo: str | None = None
    serial: str | None = None
    placa_inventario: str | None = None
    sede_id: int | None = None
    area_id: int | None = None
    piso: str | None = None
    asignado_a_usuario_id: int | None = None
    fecha_asignacion: date | None = None
    fecha_adquisicion: date | None = None
    proveedor_id: int | None = None
    costo: Decimal | None = None
    orden_compra: str | None = None
    factura: str | None = None
    garantia_inicio: date | None = None
    garantia_fin: date | None = None
    observaciones: str | None = None
    ip: str | None = None
    mac: str | None = None

    tipo_computo: TipoComputo | None = None
    hostname: str | None = None
    cpu: str | None = None
    ram_capacidad: str | None = None
    ram_tipo: str | None = None
    disco_tipo: str | None = None
    disco_capacidad: str | None = None
    sistema_operativo: str | None = None
    dominio: str | None = None
    inc_teclado: bool = False
    inc_mouse: bool = False
    inc_cable_poder: bool = False
    inc_cable_video: bool = False
    accesorios_otro: str | None = None

    tipo_red: TipoRed | None = None
    num_puertos: int | None = None
    poe: bool = False
    firmware: str | None = None
    ubicacion_fisica: str | None = None
    config_notas: str | None = None

    tipo_periferico: TipoPeriferico | None = None
    asociado_a_activo_id: int | None = None
    monitor_pulgadas: str | None = None
    monitor_resolucion: str | None = None
    impresora_tecnologia: str | None = None
    impresora_conexion: str | None = None


@dataclass
class DatosBaja:
    motivo_baja: MotivoBaja
    fecha_baja: date | None = None
    baja_autorizado_por: str | None = None
    acta_baja: str | None = None


@dataclass
class FiltroActivos:
    texto: str | None = None
    categoria: CategoriaActivo | None = None
    estado: EstadoActivo | None = None
    sede_id: int | None = None
    asignado_a_usuario_id: int | None = None
