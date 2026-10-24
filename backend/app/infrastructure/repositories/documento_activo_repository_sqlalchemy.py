"""Repositorio SQLAlchemy para DocumentoActivo (documentos adjuntos de activos de TI)."""
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.activo import Activo as ActivoModel
from app.infrastructure.models.documento_activo import DocumentoActivo


class DocumentoActivoRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def listar_por_activo(self, activo_id: int) -> list[DocumentoActivo]:
        modelos = self._session.scalars(
            select(DocumentoActivo)
            .where(DocumentoActivo.activo_id == activo_id)
            .order_by(DocumentoActivo.tipo, DocumentoActivo.created_at.desc())
        ).all()
        return list(modelos)

    def listar_actas(self) -> list[tuple[DocumentoActivo, str, str]]:
        """Todas las actas (tipo 'acta') con el código y nombre de su activo."""
        stmt = (
            select(DocumentoActivo, ActivoModel.codigo_interno, ActivoModel.nombre)
            .join(ActivoModel, DocumentoActivo.activo_id == ActivoModel.id)
            .where(DocumentoActivo.tipo == "acta")
            .order_by(DocumentoActivo.created_at.desc())
        )
        return [(row[0], row[1], row[2]) for row in self._session.execute(stmt).all()]

    def listar_actas(self) -> list[tuple[DocumentoActivo, str, str]]:
        """Todas las actas (tipo 'acta') con el código y nombre de su activo."""
        stmt = (
            select(DocumentoActivo, ActivoModel.codigo_interno, ActivoModel.nombre)
            .join(ActivoModel, DocumentoActivo.activo_id == ActivoModel.id)
            .where(DocumentoActivo.tipo == "acta")
            .order_by(DocumentoActivo.created_at.desc())
        )
        return [(row[0], row[1], row[2]) for row in self._session.execute(stmt).all()]

    def obtener_por_id_y_activo(
        self, documento_id: int, activo_id: int
    ) -> DocumentoActivo | None:
        return self._session.scalar(
            select(DocumentoActivo).where(
                and_(
                    DocumentoActivo.id == documento_id,
                    DocumentoActivo.activo_id == activo_id,
                )
            )
        )

    def crear(
        self,
        activo_id: int,
        tipo: str,
        nombre_archivo: str,
        ruta_archivo: str,
        tamano_bytes: int,
        mime_type: str,
        usuario_id: int | None = None,
        descripcion: str | None = None,
    ) -> DocumentoActivo:
        documento = DocumentoActivo(
            activo_id=activo_id,
            usuario_id=usuario_id,
            tipo=tipo,
            nombre_archivo=nombre_archivo,
            ruta_archivo=ruta_archivo,
            tamano_bytes=tamano_bytes,
            mime_type=mime_type,
            descripcion=descripcion,
        )
        self._session.add(documento)
        self._session.commit()
        self._session.refresh(documento)
        return documento

    def eliminar(self, documento_id: int, activo_id: int) -> None:
        documento = self.obtener_por_id_y_activo(documento_id, activo_id)
        if documento is None:
            raise RecursoNoEncontrado(
                f"El documento {documento_id} no existe o no pertenece al activo."
            )
        self._session.delete(documento)
        self._session.commit()
