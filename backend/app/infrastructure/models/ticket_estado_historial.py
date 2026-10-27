"""Historial de estados de un ticket (para medir el recorrido y el tiempo por estado)."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


class TicketEstadoHistorial(Base):
    __tablename__ = "ticket_estado_historial"
    __table_args__ = {"schema": "sistemas"}

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("sistemas.tickets.id", ondelete="CASCADE"), index=True
    )
    # Estado al que ENTRÓ el ticket, con la fecha/hora del cambio.
    estado: Mapped[str] = mapped_column(String(20))
    fecha: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
