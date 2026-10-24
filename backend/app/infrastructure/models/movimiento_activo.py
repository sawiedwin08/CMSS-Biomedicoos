"""Movimiento / reasignación de un activo de TI (trazabilidad de ubicación y responsable).

Se usan claves foráneas explícitas sin relaciones ORM de conveniencia para evitar
ambigüedad de joins (hay dos FK hacia sedes, dos hacia áreas y dos hacia usuarios).
"""
from datetime import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


class MovimientoActivo(Base):
    __tablename__ = "movimientos_activo"
    __table_args__ = {"schema": "sistemas"}

    id: Mapped[int] = mapped_column(primary_key=True)
    activo_id: Mapped[int] = mapped_column(
        ForeignKey("sistemas.activos.id", ondelete="CASCADE"), index=True
    )

    sede_origen_id: Mapped[int | None] = mapped_column(ForeignKey("comun.sedes.id"))
    area_origen_id: Mapped[int | None] = mapped_column(ForeignKey("comun.servicios.id"))
    sede_destino_id: Mapped[int | None] = mapped_column(ForeignKey("comun.sedes.id"))
    area_destino_id: Mapped[int | None] = mapped_column(ForeignKey("comun.servicios.id"))
    usuario_origen_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    usuario_destino_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))

    motivo: Mapped[str | None] = mapped_column(String(250))
    responsable: Mapped[str | None] = mapped_column(String(150))
    fecha_movimiento: Mapped[datetime] = mapped_column(server_default=func.now())
