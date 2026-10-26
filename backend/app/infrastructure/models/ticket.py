"""Ticket de la Mesa de ayuda (módulo Sistemas)."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class Ticket(Base, TimestampMixin):
    __tablename__ = "tickets"
    __table_args__ = {"schema": "sistemas"}

    id: Mapped[int] = mapped_column(primary_key=True)
    numero: Mapped[str] = mapped_column(String(20), unique=True, index=True)

    # --- Solicitante (puede no tener cuenta) ---
    solicitante_nombre: Mapped[str] = mapped_column(String(150))
    solicitante_correo: Mapped[str] = mapped_column(String(150), index=True)
    area: Mapped[str | None] = mapped_column(String(150))

    # --- Contenido ---
    categoria: Mapped[str] = mapped_column(String(40), index=True)
    asunto: Mapped[str] = mapped_column(String(200))
    descripcion: Mapped[str] = mapped_column(Text)

    # --- Gestión ---
    prioridad: Mapped[str] = mapped_column(String(20), default="media", server_default="media")
    estado: Mapped[str] = mapped_column(
        String(20), default="nuevo", server_default="nuevo", index=True
    )
    tecnico_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), index=True
    )

    # --- Resolución (lo registra el técnico) ---
    causa: Mapped[str | None] = mapped_column(String(30))
    solucion: Mapped[str | None] = mapped_column(Text)

    # --- Marcas de tiempo para métricas ---
    # Primera respuesta del equipo (primer comentario interno).
    fecha_primera_respuesta: Mapped[datetime | None] = mapped_column(DateTime)
    # Momento en que el ticket llegó a resuelto/cerrado (se limpia si se reabre).
    fecha_cierre: Mapped[datetime | None] = mapped_column(DateTime)
