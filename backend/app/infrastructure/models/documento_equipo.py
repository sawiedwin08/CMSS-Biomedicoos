"""Documentos asociados a equipos biomédicos (manuales, planos, calibración, etc.)."""
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class DocumentoEquipo(Base, TimestampMixin):
    """Almacena metadatos de documentos subidos para cada equipo."""

    __tablename__ = "documento_equipos"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Referencias
    equipo_id: Mapped[int] = mapped_column(
        ForeignKey("equipos.id", ondelete="CASCADE"), index=True
    )
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Tipo de documento
    tipo: Mapped[str] = mapped_column(
        String(30),
        index=True,
        comment="manual | plano | calibracion | recomendacion",
    )

    # Información del archivo
    nombre_archivo: Mapped[str] = mapped_column(String(255))
    ruta_archivo: Mapped[str] = mapped_column(
        String(500), comment="Ruta relativa en el servidor: uploads/documentos/equipo_{id}/{tipo}/{nombre}"
    )
    tamaño_bytes: Mapped[int] = mapped_column(comment="Tamaño en bytes del archivo")
    mime_type: Mapped[str] = mapped_column(
        String(100), default="application/octet-stream"
    )

    # Descripción opcional
    descripcion: Mapped[str | None] = mapped_column(String(500))

    # Año del documento
    año_documento: Mapped[int | None] = mapped_column(nullable=True, index=True, comment="Año en que se generó el documento")

    # Relaciones
    equipo: Mapped["Equipo"] = relationship(  # noqa: F821
        back_populates="documentos",
        foreign_keys=[equipo_id],
    )
    usuario: Mapped["UsuarioModel"] = relationship(  # noqa: F821
        foreign_keys=[usuario_id],
    )

    def __repr__(self) -> str:
        return f"<DocumentoEquipo(equipo_id={self.equipo_id}, tipo={self.tipo}, archivo={self.nombre_archivo})>"
