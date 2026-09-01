"""Implementación SQLAlchemy del puerto ProveedorRepository."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.entities.proveedor import Proveedor
from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.equipo import Equipo
from app.infrastructure.models.proveedor import Proveedor as ProveedorModel


class ProveedorRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _a_entidad(model: ProveedorModel) -> Proveedor:
        return Proveedor(
            id=model.id,
            nombre=model.nombre,
            nit=model.nit,
            contacto=model.contacto,
            telefono=model.telefono,
            email=model.email,
            activo=model.activo,
        )

    def listar(self) -> list[Proveedor]:
        models = self._session.scalars(
            select(ProveedorModel).order_by(ProveedorModel.nombre)
        )
        return [self._a_entidad(m) for m in models]

    def obtener_por_id(self, proveedor_id: int) -> Proveedor | None:
        model = self._session.get(ProveedorModel, proveedor_id)
        return self._a_entidad(model) if model else None

    def existe_nombre(self, nombre: str, excluir_id: int | None = None) -> bool:
        stmt = select(ProveedorModel.id).where(ProveedorModel.nombre == nombre)
        if excluir_id is not None:
            stmt = stmt.where(ProveedorModel.id != excluir_id)
        return self._session.scalar(stmt) is not None

    def crear(self, proveedor: Proveedor) -> Proveedor:
        model = ProveedorModel(
            nombre=proveedor.nombre,
            nit=proveedor.nit,
            contacto=proveedor.contacto,
            telefono=proveedor.telefono,
            email=proveedor.email,
            activo=proveedor.activo,
        )
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def actualizar(self, proveedor_id: int, datos: Proveedor) -> Proveedor:
        model = self._session.get(ProveedorModel, proveedor_id)
        if model is None:
            raise RecursoNoEncontrado(f"El proveedor {proveedor_id} no existe.")
        model.nombre = datos.nombre
        model.nit = datos.nit
        model.contacto = datos.contacto
        model.telefono = datos.telefono
        model.email = datos.email
        model.activo = datos.activo
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def eliminar(self, proveedor_id: int) -> None:
        model = self._session.get(ProveedorModel, proveedor_id)
        if model is None:
            raise RecursoNoEncontrado(f"El proveedor {proveedor_id} no existe.")
        self._session.delete(model)
        self._session.commit()

    def contar_equipos(self, proveedor_id: int) -> int:
        total = self._session.scalar(
            select(func.count(Equipo.id)).where(Equipo.proveedor_id == proveedor_id)
        )
        return int(total or 0)
