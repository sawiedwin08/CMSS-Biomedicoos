"""Activo de TI — entidad núcleo del Inventario del módulo Sistemas.

Una sola tabla cubre las tres categorías (cómputo, red, periférico): los campos
comunes siempre aplican y los específicos de cada categoría quedan nulos cuando
no corresponden. Vive en el esquema `sistemas`; referencia maestros compartidos
en `comun` y al usuario asignado en `public.usuarios`.
"""
from datetime import date
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    LargeBinary,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class Activo(Base, TimestampMixin):
    __tablename__ = "activos"
    __table_args__ = {"schema": "sistemas"}

    id: Mapped[int] = mapped_column(primary_key=True)

    # --- Comunes ---
    codigo_interno: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    categoria: Mapped[str] = mapped_column(String(20), index=True)
    nombre: Mapped[str] = mapped_column(String(200), index=True)
    marca: Mapped[str | None] = mapped_column(String(100))
    modelo: Mapped[str | None] = mapped_column(String(100))
    serial: Mapped[str | None] = mapped_column(String(100), index=True)
    placa_inventario: Mapped[str | None] = mapped_column(String(50), index=True)
    estado: Mapped[str] = mapped_column(String(20), default="operativo", index=True)

    # --- Ubicación y asignación ---
    sede_id: Mapped[int | None] = mapped_column(ForeignKey("comun.sedes.id"), index=True)
    area_id: Mapped[int | None] = mapped_column(ForeignKey("comun.servicios.id"), index=True)
    piso: Mapped[str | None] = mapped_column(String(50))
    asignado_a_usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), index=True
    )
    # Nombre libre del responsable (no necesariamente un usuario del sistema).
    asignado_a_nombre: Mapped[str | None] = mapped_column(String(150))
    fecha_asignacion: Mapped[date | None] = mapped_column(Date)

    # --- Adquisición y garantía ---
    fecha_adquisicion: Mapped[date | None] = mapped_column(Date)
    proveedor_id: Mapped[int | None] = mapped_column(ForeignKey("comun.proveedores.id"))
    costo: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    orden_compra: Mapped[str | None] = mapped_column(String(100))
    factura: Mapped[str | None] = mapped_column(String(100))
    garantia_inicio: Mapped[date | None] = mapped_column(Date)
    garantia_fin: Mapped[date | None] = mapped_column(Date)

    observaciones: Mapped[str | None] = mapped_column(Text)

    # --- Red (IP/MAC: compartidos por cómputo y equipo de red) ---
    ip: Mapped[str | None] = mapped_column(String(45))
    mac: Mapped[str | None] = mapped_column(String(17))

    # --- Foto ---
    foto_mime: Mapped[str | None] = mapped_column(String(50))
    foto: Mapped[bytes | None] = mapped_column(LargeBinary, deferred=True)

    # --- Específicos: Equipo de cómputo ---
    tipo_computo: Mapped[str | None] = mapped_column(String(20))
    hostname: Mapped[str | None] = mapped_column(String(100))
    cpu: Mapped[str | None] = mapped_column(String(150))
    ram_capacidad: Mapped[str | None] = mapped_column(String(50))
    ram_tipo: Mapped[str | None] = mapped_column(String(30))
    disco_tipo: Mapped[str | None] = mapped_column(String(20))
    disco_capacidad: Mapped[str | None] = mapped_column(String(50))
    sistema_operativo: Mapped[str | None] = mapped_column(String(100))
    dominio: Mapped[str | None] = mapped_column(String(100))
    inc_teclado: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    inc_mouse: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    inc_cable_poder: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    inc_cable_video: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    accesorios_otro: Mapped[str | None] = mapped_column(String(200))

    # --- Específicos: Equipo de red ---
    tipo_red: Mapped[str | None] = mapped_column(String(20))
    num_puertos: Mapped[int | None] = mapped_column(Integer)
    poe: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    firmware: Mapped[str | None] = mapped_column(String(100))
    ubicacion_fisica: Mapped[str | None] = mapped_column(String(150))
    config_notas: Mapped[str | None] = mapped_column(Text)

    # --- Específicos: Periférico ---
    tipo_periferico: Mapped[str | None] = mapped_column(String(30))
    asociado_a_activo_id: Mapped[int | None] = mapped_column(
        ForeignKey("sistemas.activos.id", ondelete="SET NULL")
    )
    monitor_pulgadas: Mapped[str | None] = mapped_column(String(20))
    monitor_resolucion: Mapped[str | None] = mapped_column(String(30))
    impresora_tecnologia: Mapped[str | None] = mapped_column(String(30))
    impresora_conexion: Mapped[str | None] = mapped_column(String(30))

    # --- Datos de baja (cuando estado = baja) ---
    fecha_baja: Mapped[date | None] = mapped_column(Date)
    motivo_baja: Mapped[str | None] = mapped_column(String(30))
    baja_autorizado_por: Mapped[str | None] = mapped_column(String(150))
    acta_baja: Mapped[str | None] = mapped_column(String(200))
