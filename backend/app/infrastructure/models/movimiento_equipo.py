"""Movimiento / traslado de un equipo entre ubicaciones (RF-004).

Registra la trazabilidad de los cambios de sede/servicio de cada equipo.
Se usan claves foráneas explícitas sin relaciones ORM de conveniencia para
evitar ambigüedad de joins (hay dos FK hacia 'sedes' y dos hacia 'servicios').
"""
from datetime import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


class MovimientoEquipo(Base):
    __tablename__ = "movimientos_equipo"

    id: Mapped[int] = mapped_column(primary_key=True)
    equipo_id: Mapped[int] = mapped_column(ForeignKey("equipos.id"), index=True)

    sede_origen_id: Mapped[int | None] = mapped_column(ForeignKey("sedes.id"))
    servicio_origen_id: Mapped[int | None] = mapped_column(ForeignKey("servicios.id"))
    sede_destino_id: Mapped[int | None] = mapped_column(ForeignKey("sedes.id"))
    servicio_destino_id: Mapped[int | None] = mapped_column(ForeignKey("servicios.id"))

    motivo: Mapped[str | None] = mapped_column(String(250))
    responsable: Mapped[str | None] = mapped_column(String(150))
    fecha_movimiento: Mapped[datetime] = mapped_column(server_default=func.now())
