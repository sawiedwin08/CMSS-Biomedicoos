"""Orden de Trabajo (OT) para mantenimiento de equipos (RF-013)."""
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, func, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.enums.tipo_mantenimiento import TipoMantenimiento
from app.domain.enums.estado_ot import EstadoOT
from app.infrastructure.db.base import Base
from app.infrastructure.db.types import pg_enum
from app.infrastructure.models.mixins import TimestampMixin


class OrdenTrabajo(Base, TimestampMixin):
    __tablename__ = "ordenes_trabajo"

    id: Mapped[int] = mapped_column(primary_key=True)
    equipo_id: Mapped[int] = mapped_column(ForeignKey("equipos.id"), index=True)

    tipo: Mapped[TipoMantenimiento] = mapped_column(
        pg_enum(TipoMantenimiento, "tipo_mantenimiento"),
        default=TipoMantenimiento.PREVENTIVO,
    )
    estado: Mapped[EstadoOT] = mapped_column(
        pg_enum(EstadoOT, "estado_ot"),
        default=EstadoOT.PENDIENTE,
    )
    descripcion: Mapped[str | None] = mapped_column(Text)
    observaciones: Mapped[str | None] = mapped_column(Text)

    tecnico_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    tecnico_nombre: Mapped[str | None] = mapped_column(String(200))

    fecha_programada: Mapped[datetime | None]
    fecha_inicio: Mapped[datetime | None]
    fecha_cierre: Mapped[datetime | None]

    tiempo_empleado_minutos: Mapped[int | None]

    costo_total: Mapped[float | None] = mapped_column(Numeric(10, 2))

    repuestos: Mapped[str | None] = mapped_column(Text)

    firma_coordinador: Mapped[str | None] = mapped_column(Text)
    firma_tecnico: Mapped[str | None] = mapped_column(Text)
    fecha_firma_coordinador: Mapped[datetime | None]
    fecha_firma_tecnico: Mapped[datetime | None]
