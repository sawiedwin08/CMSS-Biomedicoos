"""Implementación SQLAlchemy del puerto PermisoRepository."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.entities.permiso import Permiso
from app.infrastructure.models.permiso import PermisoModel


class PermisoRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _a_entidad(model: PermisoModel) -> Permiso:
        return Permiso(
            id=model.id,
            modulo=model.modulo,
            accion=model.accion,
            codigo=model.codigo,
            descripcion=model.descripcion,
        )

    def listar(self) -> list[Permiso]:
        models = self._session.scalars(
            select(PermisoModel).order_by(PermisoModel.modulo, PermisoModel.codigo)
        )
        return [self._a_entidad(m) for m in models]

    def existen_ids(self, permiso_ids: list[int]) -> bool:
        if not permiso_ids:
            return True
        unicos = set(permiso_ids)
        encontrados = self._session.scalar(
            select(func.count(PermisoModel.id)).where(PermisoModel.id.in_(unicos))
        )
        return encontrados == len(unicos)
