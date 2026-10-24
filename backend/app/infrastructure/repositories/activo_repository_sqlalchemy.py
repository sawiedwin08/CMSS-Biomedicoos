"""Implementación SQLAlchemy del puerto ActivoRepository (módulo Sistemas)."""
from dataclasses import fields
from datetime import date

from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session

from app.application.dto.activos import DatosBaja, FiltroActivos
from app.domain.entities.activo import Activo
from app.domain.enums.activos import EstadoActivo
from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.activo import Activo as ActivoModel

# Campos de datos (todos menos el id); entidad y modelo comparten los nombres.
_CAMPOS = tuple(f.name for f in fields(Activo) if f.name != "id")


class ActivoRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _a_entidad(model: ActivoModel) -> Activo:
        datos = {campo: getattr(model, campo) for campo in _CAMPOS}
        return Activo(id=model.id, **datos)

    def _asignar(self, model: ActivoModel, activo: Activo) -> None:
        for campo in _CAMPOS:
            valor = getattr(activo, campo)
            # Los StrEnum se guardan como su valor de texto.
            setattr(model, campo, valor.value if hasattr(valor, "value") else valor)

    def listar(self, filtro: FiltroActivos) -> list[Activo]:
        stmt = select(ActivoModel)
        if filtro.estado is not None:
            stmt = stmt.where(ActivoModel.estado == filtro.estado.value)
        else:
            # Por defecto se ocultan los dados de baja.
            stmt = stmt.where(ActivoModel.estado != EstadoActivo.DADO_DE_BAJA.value)
        if filtro.categoria is not None:
            stmt = stmt.where(ActivoModel.categoria == filtro.categoria.value)
        if filtro.sede_id is not None:
            stmt = stmt.where(ActivoModel.sede_id == filtro.sede_id)
        if filtro.asignado_a_usuario_id is not None:
            stmt = stmt.where(
                ActivoModel.asignado_a_usuario_id == filtro.asignado_a_usuario_id
            )
        if filtro.texto:
            patron = f"%{filtro.texto.strip()}%"
            stmt = stmt.where(
                or_(
                    ActivoModel.nombre.ilike(patron),
                    ActivoModel.codigo_interno.ilike(patron),
                    ActivoModel.serial.ilike(patron),
                    ActivoModel.placa_inventario.ilike(patron),
                )
            )
        stmt = stmt.order_by(ActivoModel.codigo_interno)
        return [self._a_entidad(m) for m in self._session.scalars(stmt)]

    def obtener_por_id(self, activo_id: int) -> Activo | None:
        model = self._session.get(ActivoModel, activo_id)
        return self._a_entidad(model) if model else None

    def existe_codigo(self, codigo: str, excluir_id: int | None = None) -> bool:
        stmt = select(ActivoModel.id).where(ActivoModel.codigo_interno == codigo)
        if excluir_id is not None:
            stmt = stmt.where(ActivoModel.id != excluir_id)
        return self._session.scalar(stmt) is not None

    def siguiente_codigo(self) -> str:
        for _ in range(1000):
            numero = self._session.execute(
                text("SELECT nextval('sistemas.activo_codigo_seq')")
            ).scalar_one()
            codigo = f"SIS-{numero:04d}"
            if not self.existe_codigo(codigo):
                return codigo
        raise RuntimeError("No se pudo generar un código interno único.")

    def crear(self, activo: Activo) -> Activo:
        model = ActivoModel()
        self._asignar(model, activo)
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def actualizar(self, activo_id: int, activo: Activo) -> Activo:
        model = self._session.get(ActivoModel, activo_id)
        if model is None:
            raise RecursoNoEncontrado(f"El activo {activo_id} no existe.")
        self._asignar(model, activo)
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def dar_de_baja(self, activo_id: int, datos: DatosBaja) -> Activo:
        model = self._session.get(ActivoModel, activo_id)
        if model is None:
            raise RecursoNoEncontrado(f"El activo {activo_id} no existe.")
        model.estado = EstadoActivo.DADO_DE_BAJA.value
        model.motivo_baja = datos.motivo_baja.value
        model.fecha_baja = datos.fecha_baja or date.today()
        model.baja_autorizado_por = datos.baja_autorizado_por
        model.acta_baja = datos.acta_baja
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def eliminar(self, activo_id: int) -> None:
        model = self._session.get(ActivoModel, activo_id)
        if model is None:
            raise RecursoNoEncontrado(f"El activo {activo_id} no existe.")
        self._session.delete(model)
        self._session.commit()
