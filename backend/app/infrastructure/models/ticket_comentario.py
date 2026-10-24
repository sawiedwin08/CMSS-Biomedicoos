"""Comentario / seguimiento de un ticket de la Mesa de ayuda."""
from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class TicketComentario(Base, TimestampMixin):
    __tablename__ = "ticket_comentarios"
    __table_args__ = {"schema": "sistemas"}

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("sistemas.tickets.id", ondelete="CASCADE"), index=True
    )
    autor: Mapped[str] = mapped_column(String(150))
    # Público = lo ve el solicitante en el seguimiento; interno = nota del equipo.
    es_publico: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    texto: Mapped[str] = mapped_column(Text)
    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL")
    )
