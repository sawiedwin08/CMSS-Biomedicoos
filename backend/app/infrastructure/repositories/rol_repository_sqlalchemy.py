"""Implementación SQLAlchemy del puerto RolRepository."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.entities.permiso import Permiso
from app.domain.entities.rol import Rol
from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.permiso import PermisoModel
from app.infrastructure.models.rol import RolModel
from app.infrastructure.models.usuario import UsuarioModel


class RolRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _a_entidad(model: RolModel) -> Rol:
        return Rol(
            id=model.id,
            nombre=model.nombre,
            descripcion=model.descripcion,
            es_sistema=model.es_sistema,
            permisos=[
                Permiso(
                    id=p.id,
                    modulo=p.modulo,
                    accion=p.accion,
                    codigo=p.codigo,
                    descripcion=p.descripcion,
                )
                for p in model.permisos
            ],
        )

    def _modelo(self, rol_id: int) -> RolModel:
        model = self._session.get(RolModel, rol_id)
        if model is None:
            raise RecursoNoEncontrado(f"El rol {rol_id} no existe.")
        return model

    def _permisos_por_ids(self, permiso_ids: list[int]) -> list[PermisoModel]:
        if not permiso_ids:
            return []
        return list(
            self._session.scalars(
                select(PermisoModel).where(PermisoModel.id.in_(set(permiso_ids)))
            )
        )

    def listar(self) -> list[Rol]:
        models = self._session.scalars(select(RolModel).order_by(RolModel.id))
        return [self._a_entidad(m) for m in models]

    def obtener_por_id(self, rol_id: int) -> Rol | None:
        model = self._session.get(RolModel, rol_id)
        return self._a_entidad(model) if model else None

    def obtener_por_nombre(self, nombre: str) -> Rol | None:
        model = self._session.scalar(
            select(RolModel).where(RolModel.nombre == nombre)
        )
        return self._a_entidad(model) if model else None

    def existe_nombre(self, nombre: str) -> bool:
        return (
            self._session.scalar(select(RolModel.id).where(RolModel.nombre == nombre))
            is not None
        )

    def crear(
        self, nombre: str, descripcion: str | None, permiso_ids: list[int]
    ) -> Rol:
        model = RolModel(nombre=nombre, descripcion=descripcion, es_sistema=False)
        model.permisos = self._permisos_por_ids(permiso_ids)
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def actualizar(self, rol_id: int, nombre: str, descripcion: str | None) -> Rol:
        model = self._modelo(rol_id)
        model.nombre = nombre
        model.descripcion = descripcion
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def establecer_permisos(self, rol_id: int, permiso_ids: list[int]) -> Rol:
        model = self._modelo(rol_id)
        model.permisos = self._permisos_por_ids(permiso_ids)
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def eliminar(self, rol_id: int) -> None:
        model = self._modelo(rol_id)
        self._session.delete(model)
        self._session.commit()

    def contar_usuarios(self, rol_id: int) -> int:
        total = self._session.scalar(
            select(func.count(UsuarioModel.id)).where(UsuarioModel.rol_id == rol_id)
        )
        return int(total or 0)
