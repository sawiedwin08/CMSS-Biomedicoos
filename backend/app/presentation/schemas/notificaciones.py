"""Schemas de notificaciones internas (módulo Sistemas)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificacionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo: str
    titulo: str
    mensaje: str
    ticket_id: int | None
    ticket_numero: str | None
    leido: bool
    created_at: datetime
