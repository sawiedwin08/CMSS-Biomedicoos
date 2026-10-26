"""Implementación SQLAlchemy del puerto RepresentanteRepository."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.entities.representante import Representante
from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.representante import Representante as RepresentanteModel


class RepresentanteRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _a_entidad(model: RepresentanteModel) -> Representante:
        return Representante(
            id=model.id,
            nombre=model.nombre,
            pais=model.pais,
            ciudad=model.ciudad,
            direccion=model.direccion,
            telefono=model.telefono,
            correo=model.correo,
            activo=model.activo,
        )

    def listar(self) -> list[Representante]:
        models = self._session.scalars(
            select(RepresentanteModel).order_by(RepresentanteModel.nombre)
        )
        return [self._a_entidad(m) for m in models]

    def obtener_por_id(self, representante_id: int) -> Representante | None:
        model = self._session.get(RepresentanteModel, representante_id)
        return self._a_entidad(model) if model else None

    def existe_nombre(self, nombre: str, excluir_id: int | None = None) -> bool:
        stmt = select(RepresentanteModel.id).where(RepresentanteModel.nombre == nombre)
        if excluir_id is not None:
            stmt = stmt.where(RepresentanteModel.id != excluir_id)
        return self._session.scalar(stmt) is not None

    def crear(self, representante: Representante) -> Representante:
        model = RepresentanteModel(
            nombre=representante.nombre,
            pais=representante.pais,
            ciudad=representante.ciudad,
            direccion=representante.direccion,
            telefono=representante.telefono,
            correo=representante.correo,
            activo=representante.activo,
        )
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def actualizar(
        self, representante_id: int, datos: Representante
    ) -> Representante:
        model = self._session.get(RepresentanteModel, representante_id)
        if model is None:
            raise RecursoNoEncontrado(
                f"El representante {representante_id} no existe."
            )
        model.nombre = datos.nombre
        model.pais = datos.pais
        model.ciudad = datos.ciudad
        model.direccion = datos.direccion
        model.telefono = datos.telefono
        model.correo = datos.correo
        model.activo = datos.activo
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def eliminar(self, representante_id: int) -> None:
        model = self._session.get(RepresentanteModel, representante_id)
        if model is None:
            raise RecursoNoEncontrado(
                f"El representante {representante_id} no existe."
            )
        self._session.delete(model)
        self._session.commit()
