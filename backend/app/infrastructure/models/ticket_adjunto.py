"""Adjunto de un ticket de la Mesa de ayuda (captura, log, foto del error)."""
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class TicketAdjunto(Base, TimestampMixin):
    __tablename__ = "ticket_adjuntos"
    __table_args__ = {"schema": "sistemas"}

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("sistemas.tickets.id", ondelete="CASCADE"), index=True
    )
    nombre_archivo: Mapped[str] = mapped_column(String(255))
    ruta_archivo: Mapped[str] = mapped_column(String(500))
    mime_type: Mapped[str] = mapped_column(String(100), default="application/octet-stream")
    tamano_bytes: Mapped[int] = mapped_column()
    origen: Mapped[str] = mapped_column(
        String(20), default="solicitante", server_default="solicitante"
    )
    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL")
    )
