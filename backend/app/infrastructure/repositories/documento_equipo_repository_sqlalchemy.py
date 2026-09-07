"""Implementación SQLAlchemy del repositorio para DocumentoEquipo."""
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.documento_equipo import DocumentoEquipo


class DocumentoEquipoRepositorySQLAlchemy:
    """Repositorio para gestión de documentos de equipos."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def listar_por_equipo(self, equipo_id: int) -> list[DocumentoEquipo]:
        """Listar todos los documentos de un equipo, ordenados por tipo y fecha."""
        modelos = self._session.scalars(
            select(DocumentoEquipo)
            .where(DocumentoEquipo.equipo_id == equipo_id)
            .order_by(DocumentoEquipo.tipo, DocumentoEquipo.created_at.desc())
        ).all()
        return list(modelos)

    def listar_por_equipo_y_tipo(
        self, equipo_id: int, tipo: str
    ) -> list[DocumentoEquipo]:
        """Listar documentos de un equipo filtrados por tipo."""
        modelos = self._session.scalars(
            select(DocumentoEquipo)
            .where(
                and_(
                    DocumentoEquipo.equipo_id == equipo_id,
                    DocumentoEquipo.tipo == tipo,
                )
            )
            .order_by(DocumentoEquipo.created_at.desc())
        ).all()
        return list(modelos)

    def obtener_por_id(self, documento_id: int) -> DocumentoEquipo | None:
        """Obtener un documento por su ID."""
        return self._session.get(DocumentoEquipo, documento_id)

    def obtener_por_id_y_equipo(
        self, documento_id: int, equipo_id: int
    ) -> DocumentoEquipo | None:
        """Obtener un documento verificando que pertenece al equipo."""
        return self._session.scalar(
            select(DocumentoEquipo).where(
                and_(
                    DocumentoEquipo.id == documento_id,
                    DocumentoEquipo.equipo_id == equipo_id,
                )
            )
        )

    def crear(
        self,
        equipo_id: int,
        tipo: str,
        nombre_archivo: str,
        ruta_archivo: str,
        tamaño_bytes: int,
        mime_type: str,
        usuario_id: int | None = None,
        descripcion: str | None = None,
        año_documento: int | None = None,
    ) -> DocumentoEquipo:
        """Crear un nuevo documento para un equipo."""
        documento = DocumentoEquipo(
            equipo_id=equipo_id,
            usuario_id=usuario_id,
            tipo=tipo,
            nombre_archivo=nombre_archivo,
            ruta_archivo=ruta_archivo,
            tamaño_bytes=tamaño_bytes,
            mime_type=mime_type,
            descripcion=descripcion,
            año_documento=año_documento,
        )
        self._session.add(documento)
        self._session.commit()
        self._session.refresh(documento)
        return documento

    def eliminar(self, documento_id: int, equipo_id: int) -> None:
        """Eliminar un documento (verificando que pertenece al equipo)."""
        documento = self.obtener_por_id_y_equipo(documento_id, equipo_id)
        if documento is None:
            raise RecursoNoEncontrado(
                f"El documento {documento_id} no existe o no pertenece al equipo."
            )
        self._session.delete(documento)
        self._session.commit()

    def contar_por_equipo(self, equipo_id: int) -> int:
        """Contar documentos de un equipo."""
        total = self._session.scalar(
            select(len(DocumentoEquipo.id)).where(
                DocumentoEquipo.equipo_id == equipo_id
            )
        )
        return int(total or 0)
