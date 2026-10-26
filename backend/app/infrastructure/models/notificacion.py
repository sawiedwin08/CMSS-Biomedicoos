"""Notificación interna (módulo Sistemas): novedades de tickets para supervisores."""
from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class Notificacion(Base, TimestampMixin):
    __tablename__ = "notificaciones"
    __table_args__ = {"schema": "sistemas"}

    id: Mapped[int] = mapped_column(primary_key=True)
    # Destinatario de la novedad.
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), index=True
    )
    tipo: Mapped[str] = mapped_column(String(30))  # ticket_nuevo / ticket_comentario / ticket_estado
    titulo: Mapped[str] = mapped_column(String(160))
    mensaje: Mapped[str] = mapped_column(Text)
    ticket_id: Mapped[int | None] = mapped_column(
        ForeignKey("sistemas.tickets.id", ondelete="CASCADE"), index=True
    )
    ticket_numero: Mapped[str | None] = mapped_column(String(20))
    leido: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", index=True
    )
