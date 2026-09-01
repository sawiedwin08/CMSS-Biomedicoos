"""Implementación SQLAlchemy del puerto SedeRepository."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.entities.sede import Sede
from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.equipo import Equipo
from app.infrastructure.models.sede import Sede as SedeModel
from app.infrastructure.models.servicio import Servicio


class SedeRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _a_entidad(model: SedeModel) -> Sede:
        return Sede(
            id=model.id,
            nombre=model.nombre,
            direccion=model.direccion,
            ciudad=model.ciudad,
            activo=model.activo,
        )

    def listar(self) -> list[Sede]:
        models = self._session.scalars(select(SedeModel).order_by(SedeModel.nombre))
        return [self._a_entidad(m) for m in models]

    def obtener_por_id(self, sede_id: int) -> Sede | None:
        model = self._session.get(SedeModel, sede_id)
        return self._a_entidad(model) if model else None

    def existe_nombre(self, nombre: str, excluir_id: int | None = None) -> bool:
        stmt = select(SedeModel.id).where(SedeModel.nombre == nombre)
        if excluir_id is not None:
            stmt = stmt.where(SedeModel.id != excluir_id)
        return self._session.scalar(stmt) is not None

    def crear(self, sede: Sede) -> Sede:
        model = SedeModel(
            nombre=sede.nombre,
            direccion=sede.direccion,
            ciudad=sede.ciudad,
            activo=sede.activo,
        )
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def actualizar(
        self,
        sede_id: int,
        nombre: str,
        direccion: str | None,
        ciudad: str | None,
        activo: bool,
    ) -> Sede:
        model = self._session.get(SedeModel, sede_id)
        if model is None:
            raise RecursoNoEncontrado(f"La sede {sede_id} no existe.")
        model.nombre = nombre
        model.direccion = direccion
        model.ciudad = ciudad
        model.activo = activo
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def eliminar(self, sede_id: int) -> None:
        model = self._session.get(SedeModel, sede_id)
        if model is None:
            raise RecursoNoEncontrado(f"La sede {sede_id} no existe.")
        self._session.delete(model)
        self._session.commit()

    def contar_servicios(self, sede_id: int) -> int:
        total = self._session.scalar(
            select(func.count(Servicio.id)).where(Servicio.sede_id == sede_id)
        )
        return int(total or 0)

    def contar_equipos(self, sede_id: int) -> int:
        total = self._session.scalar(
            select(func.count(Equipo.id)).where(Equipo.sede_id == sede_id)
        )
        return int(total or 0)
