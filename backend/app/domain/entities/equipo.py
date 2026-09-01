"""Entidad de dominio Equipo — núcleo del Inventario (RF-001..006)."""
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from app.domain.enums.clasificacion_riesgo import ClasificacionRiesgo
from app.domain.enums.criticidad import Criticidad
from app.domain.enums.estado_equipo import EstadoEquipo
from app.domain.enums.propiedad import Propiedad


@dataclass
class Equipo:
    codigo_interno: str
    serial_fabricante: str
    nombre: str
    estado: EstadoEquipo = EstadoEquipo.OPERATIVO
    marca: str | None = None
    modelo: str | None = None
    criticidad: Criticidad | None = None
    registro_invima: str | None = None
    clasificacion_riesgo: ClasificacionRiesgo | None = None
    propiedad: Propiedad | None = None
    sede_id: int | None = None
    servicio_id: int | None = None
    proveedor_id: int | None = None
    fecha_adquisicion: date | None = None
    costo_adquisicion: Decimal | None = None
    fin_garantia: date | None = None
    orden_compra: str | None = None
    id: int | None = None
    # Nombres resueltos para lectura
    sede_nombre: str | None = None
    servicio_nombre: str | None = None
    proveedor_nombre: str | None = None
