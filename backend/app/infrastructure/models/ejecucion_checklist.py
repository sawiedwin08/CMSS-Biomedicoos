"""Ejecución de checklist en una OT (RFC-013 - trazabilidad de intervención)."""
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.enums.estado_checklist import EstadoChecklist
from app.infrastructure.db.base import Base
from app.infrastructure.db.types import pg_enum


class EjecucionChecklistPaso(Base):
    """Registro de la ejecución de cada paso del checklist en una OT."""
    __tablename__ = "ejecucion_checklist_pasos"

    id: Mapped[int] = mapped_column(primary_key=True)
    ot_id: Mapped[int] = mapped_column(ForeignKey("ordenes_trabajo.id"), index=True)
    paso_id: Mapped[int] = mapped_column(ForeignKey("checklist_pasos.id"))

    estado: Mapped[EstadoChecklist] = mapped_column(
        pg_enum(EstadoChecklist, "estado_checklist"),
        default=EstadoChecklist.NO_REALIZADO,
    )
    observacion: Mapped[str | None] = mapped_column(String(500))
