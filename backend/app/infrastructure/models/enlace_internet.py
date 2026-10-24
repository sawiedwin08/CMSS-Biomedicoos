"""Enlace de Internet / proveedor (WAN) — sección Redes e infraestructura."""
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class EnlaceInternet(Base, TimestampMixin):
    __tablename__ = "enlaces_internet"
    __table_args__ = {"schema": "sistemas"}

    id: Mapped[int] = mapped_column(primary_key=True)
    proveedor: Mapped[str] = mapped_column(String(150), index=True)
    sede_id: Mapped[int | None] = mapped_column(ForeignKey("comun.sedes.id"), index=True)
    tipo: Mapped[str | None] = mapped_column(String(50))  # fibra, cable, satelital…
    ancho_bajada: Mapped[str | None] = mapped_column(String(50))
    ancho_subida: Mapped[str | None] = mapped_column(String(50))
    ip_publica: Mapped[str | None] = mapped_column(String(45), index=True)
    contacto: Mapped[str | None] = mapped_column(String(150))
    telefono: Mapped[str | None] = mapped_column(String(50))
    costo: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    estado: Mapped[str] = mapped_column(String(20), default="activo", server_default="activo")
    observaciones: Mapped[str | None] = mapped_column(Text)
