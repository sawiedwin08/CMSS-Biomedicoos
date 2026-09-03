"""Implementación SQLAlchemy del puerto ModuloRepository."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.entities.modulo import Modulo
from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.modulo import ModuloModel
from app.infrastructure.models.rol import RolModel


class ModuloRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _a_entidad(m: ModuloModel) -> Modulo:
        return Modulo(
            id=m.id,
            slug=m.slug,
            nombre=m.nombre,
            descripcion=m.descripcion,
            icono=m.icono,
            orden=m.orden,
            activo=m.activo,
        )

    def listar(self) -> list[Modulo]:
        stmt = select(ModuloModel).order_by(ModuloModel.orden, ModuloModel.nombre)
        return [self._a_entidad(m) for m in self._session.scalars(stmt)]

    def listar_de_rol(self, rol_id: int, solo_activos: bool = True) -> list[Modulo]:
        rol = self._session.get(RolModel, rol_id)
        if rol is None:
            return []
        mods = sorted(rol.modulos, key=lambda m: (m.orden, m.nombre))
        if solo_activos:
            mods = [m for m in mods if m.activo]
        return [self._a_entidad(m) for m in mods]

    def establecer_modulos_de_rol(self, rol_id: int, modulo_ids: list[int]) -> None:
        rol = self._session.get(RolModel, rol_id)
        if rol is None:
            raise RecursoNoEncontrado(f"El rol {rol_id} no existe.")
        mods = self._session.scalars(
            select(ModuloModel).where(ModuloModel.id.in_(modulo_ids))
        ).all()
        rol.modulos = list(mods)
        self._session.commit()
