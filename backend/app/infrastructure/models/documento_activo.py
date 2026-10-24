"""Documentos adjuntos de un activo de TI (factura, garantía, acta de baja, etc.)."""
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class DocumentoActivo(Base, TimestampMixin):
    __tablename__ = "documento_activos"
    __table_args__ = {"schema": "sistemas"}

    id: Mapped[int] = mapped_column(primary_key=True)
    activo_id: Mapped[int] = mapped_column(
        ForeignKey("sistemas.activos.id", ondelete="CASCADE"), index=True
    )
    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True
    )

    tipo: Mapped[str] = mapped_column(
        String(30), index=True, comment="factura | garantia | acta | manual | otro"
    )
    nombre_archivo: Mapped[str] = mapped_column(String(255))
    ruta_archivo: Mapped[str] = mapped_column(String(500))
    tamano_bytes: Mapped[int] = mapped_column(comment="Tamaño en bytes del archivo")
    mime_type: Mapped[str] = mapped_column(
        String(100), default="application/octet-stream"
    )
    descripcion: Mapped[str | None] = mapped_column(String(500))

    usuario: Mapped["UsuarioModel"] = relationship(  # noqa: F821
        foreign_keys=[usuario_id]
    )
