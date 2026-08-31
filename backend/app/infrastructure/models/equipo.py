"""Equipo biomédico — entidad núcleo del sistema (Módulo Inventario, RF-001..008)."""
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.enums.clasificacion_riesgo import ClasificacionRiesgo
from app.domain.enums.criticidad import Criticidad
from app.domain.enums.estado_equipo import EstadoEquipo
from app.infrastructure.db.base import Base
from app.infrastructure.db.types import pg_enum
from app.infrastructure.models.mixins import TimestampMixin


class Equipo(Base, TimestampMixin):
    __tablename__ = "equipos"

    id: Mapped[int] = mapped_column(primary_key=True)

    # --- Identificación única (RF-002) ---
    codigo_interno: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    serial_fabricante: Mapped[str] = mapped_column(String(100), index=True)

    # --- Ficha base (RF-001) ---
    nombre: Mapped[str] = mapped_column(String(200), index=True)
    marca: Mapped[str | None] = mapped_column(String(100))
    modelo: Mapped[str | None] = mapped_column(String(100))
    criticidad: Mapped[Criticidad | None] = mapped_column(
        pg_enum(Criticidad, "criticidad")
    )

    # --- Registro INVIMA (RF-003) ---
    registro_invima: Mapped[str | None] = mapped_column(String(100))
    clasificacion_riesgo: Mapped[ClasificacionRiesgo | None] = mapped_column(
        pg_enum(ClasificacionRiesgo, "clasificacion_riesgo")
    )

    # --- Estado (RF-006) ---
    estado: Mapped[EstadoEquipo] = mapped_column(
        pg_enum(EstadoEquipo, "estado_equipo"),
        default=EstadoEquipo.OPERATIVO,
        server_default=EstadoEquipo.OPERATIVO.value,
    )

    # --- Ubicación actual (RF-004) ---
    sede_id: Mapped[int | None] = mapped_column(ForeignKey("sedes.id"), index=True)
    servicio_id: Mapped[int | None] = mapped_column(ForeignKey("servicios.id"), index=True)

    # --- Datos de adquisición (RF-005) ---
    proveedor_id: Mapped[int | None] = mapped_column(ForeignKey("proveedores.id"))
    fecha_adquisicion: Mapped[date | None] = mapped_column(Date)
    costo_adquisicion: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    fin_garantia: Mapped[date | None] = mapped_column(Date)
    orden_compra: Mapped[str | None] = mapped_column(String(100))

    # --- Relaciones ---
    sede: Mapped["Sede | None"] = relationship()  # noqa: F821
    servicio: Mapped["Servicio | None"] = relationship()  # noqa: F821
    proveedor: Mapped["Proveedor | None"] = relationship()  # noqa: F821
