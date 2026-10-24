"""Repositorio SQLAlchemy para MantenimientoActivo (bitácora del módulo Sistemas)."""
from datetime import date

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.activo import Activo as ActivoModel
from app.infrastructure.models.mantenimiento_activo import MantenimientoActivo


class MantenimientoActivoRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def listar_por_activo(self, activo_id: int) -> list[MantenimientoActivo]:
        stmt = (
            select(MantenimientoActivo)
            .where(MantenimientoActivo.activo_id == activo_id)
            .order_by(MantenimientoActivo.fecha.desc().nullslast(), MantenimientoActivo.created_at.desc())
        )
        return list(self._session.scalars(stmt))

    def listar_todos(self) -> list[tuple[MantenimientoActivo, str, str]]:
        stmt = (
            select(MantenimientoActivo, ActivoModel.codigo_interno, ActivoModel.nombre)
            .join(ActivoModel, MantenimientoActivo.activo_id == ActivoModel.id)
            .order_by(MantenimientoActivo.fecha.desc().nullslast(), MantenimientoActivo.created_at.desc())
        )
        return [(row[0], row[1], row[2]) for row in self._session.execute(stmt).all()]

    def obtener_por_id_y_activo(
        self, mantenimiento_id: int, activo_id: int
    ) -> MantenimientoActivo | None:
        return self._session.scalar(
            select(MantenimientoActivo).where(
                and_(
                    MantenimientoActivo.id == mantenimiento_id,
                    MantenimientoActivo.activo_id == activo_id,
                )
            )
        )

    def crear(
        self,
        activo_id: int,
        tipo: str,
        fecha: date | None,
        responsable: str | None,
        descripcion: str | None,
    ) -> MantenimientoActivo:
        m = MantenimientoActivo(
            activo_id=activo_id,
            tipo=tipo,
            fecha=fecha,
            responsable=responsable,
            descripcion=descripcion,
        )
        self._session.add(m)
        self._session.commit()
        self._session.refresh(m)
        return m

    def eliminar(self, mantenimiento_id: int, activo_id: int) -> None:
        m = self.obtener_por_id_y_activo(mantenimiento_id, activo_id)
        if m is None:
            raise RecursoNoEncontrado(
                f"El mantenimiento {mantenimiento_id} no existe o no pertenece al activo."
            )
        self._session.delete(m)
        self._session.commit()
