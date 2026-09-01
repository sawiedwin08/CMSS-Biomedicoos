"""Implementación SQLAlchemy del puerto ServicioRepository."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.entities.servicio import Servicio
from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.equipo import Equipo
from app.infrastructure.models.servicio import Servicio as ServicioModel


class ServicioRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _a_entidad(model: ServicioModel) -> Servicio:
        return Servicio(
            id=model.id,
            nombre=model.nombre,
            sede_id=model.sede_id,
            activo=model.activo,
            sede_nombre=model.sede.nombre if model.sede else None,
        )

    def listar(self) -> list[Servicio]:
        models = self._session.scalars(
            select(ServicioModel).order_by(ServicioModel.nombre)
        )
        return [self._a_entidad(m) for m in models]

    def obtener_por_id(self, servicio_id: int) -> Servicio | None:
        model = self._session.get(ServicioModel, servicio_id)
        return self._a_entidad(model) if model else None

    def existe_nombre(
        self, nombre: str, sede_id: int, excluir_id: int | None = None
    ) -> bool:
        stmt = select(ServicioModel.id).where(
            ServicioModel.nombre == nombre, ServicioModel.sede_id == sede_id
        )
        if excluir_id is not None:
            stmt = stmt.where(ServicioModel.id != excluir_id)
        return self._session.scalar(stmt) is not None

    def crear(self, servicio: Servicio) -> Servicio:
        model = ServicioModel(
            nombre=servicio.nombre,
            sede_id=servicio.sede_id,
            activo=servicio.activo,
        )
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def actualizar(
        self, servicio_id: int, nombre: str, sede_id: int, activo: bool
    ) -> Servicio:
        model = self._session.get(ServicioModel, servicio_id)
        if model is None:
            raise RecursoNoEncontrado(f"El servicio {servicio_id} no existe.")
        model.nombre = nombre
        model.sede_id = sede_id
        model.activo = activo
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def eliminar(self, servicio_id: int) -> None:
        model = self._session.get(ServicioModel, servicio_id)
        if model is None:
            raise RecursoNoEncontrado(f"El servicio {servicio_id} no existe.")
        self._session.delete(model)
        self._session.commit()

    def contar_equipos(self, servicio_id: int) -> int:
        total = self._session.scalar(
            select(func.count(Equipo.id)).where(Equipo.servicio_id == servicio_id)
        )
        return int(total or 0)
