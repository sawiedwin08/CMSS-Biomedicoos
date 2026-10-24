"""Bitácora de mantenimientos de un activo de TI (módulo Sistemas).

Cada entrada es un mantenimiento/verificación/seguimiento realizado al equipo.
Alimenta la Hoja de Vida del activo.
"""
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class MantenimientoActivo(Base, TimestampMixin):
    __tablename__ = "mantenimientos_activo"
    __table_args__ = {"schema": "sistemas"}

    id: Mapped[int] = mapped_column(primary_key=True)
    activo_id: Mapped[int] = mapped_column(
        ForeignKey("sistemas.activos.id", ondelete="CASCADE"), index=True
    )
    tipo: Mapped[str] = mapped_column(
        String(20), index=True, comment="verificacion | preventivo | correctivo | seguimiento"
    )
    fecha: Mapped[date | None] = mapped_column(Date)
    responsable: Mapped[str | None] = mapped_column(String(150))
    descripcion: Mapped[str | None] = mapped_column(Text)
