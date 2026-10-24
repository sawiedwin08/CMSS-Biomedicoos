"""Plantillas de rutina de mantenimiento reutilizables (RF-013)."""
from typing import Any

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class PlantillaRutina(Base, TimestampMixin):
    """Rutina/checklist guardada como plantilla para reutilizar en futuros mantenimientos.

    `pasos` es una lista JSON: [{"orden": 1, "descripcion": "...", "instrucciones": null}, ...]
    """
    __tablename__ = "plantillas_rutina"
    __table_args__ = {"schema": "biomedicos"}

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    pasos: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
