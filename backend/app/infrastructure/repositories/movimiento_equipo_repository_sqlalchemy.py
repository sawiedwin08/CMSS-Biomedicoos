"""Repositorio SQLAlchemy para MovimientoEquipo (RF-004 — trazabilidad de ubicaciones)."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.movimiento_equipo import MovimientoEquipo as MovimientoEquipoModel


class MovimientoEquipoRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def registrar_movimiento(
        self,
        equipo_id: int,
        sede_origen_id: int | None,
        servicio_origen_id: int | None,
        sede_destino_id: int | None,
        servicio_destino_id: int | None,
        motivo: str | None = None,
        responsable: str | None = None,
    ) -> MovimientoEquipoModel:
        """Registra un movimiento de ubicación de un equipo."""
        movimiento = MovimientoEquipoModel(
            equipo_id=equipo_id,
            sede_origen_id=sede_origen_id,
            servicio_origen_id=servicio_origen_id,
            sede_destino_id=sede_destino_id,
            servicio_destino_id=servicio_destino_id,
            motivo=motivo,
            responsable=responsable,
        )
        self._session.add(movimiento)
        self._session.commit()
        self._session.refresh(movimiento)
        return movimiento

    def obtener_historial(self, equipo_id: int) -> list[MovimientoEquipoModel]:
        """Obtiene el historial de movimientos de un equipo, ordenado por fecha descendente."""
        stmt = (
            select(MovimientoEquipoModel)
            .where(MovimientoEquipoModel.equipo_id == equipo_id)
            .order_by(MovimientoEquipoModel.fecha_movimiento.desc())
        )
        return list(self._session.scalars(stmt))

    def obtener_movimiento_por_id(self, movimiento_id: int) -> MovimientoEquipoModel | None:
        """Obtiene un movimiento por su ID."""
        return self._session.get(MovimientoEquipoModel, movimiento_id)

    def eliminar_movimiento(self, movimiento_id: int) -> None:
        """Elimina un movimiento de ubicación."""
        movimiento = self._session.get(MovimientoEquipoModel, movimiento_id)
        if movimiento is None:
            raise RecursoNoEncontrado(f"El movimiento {movimiento_id} no existe.")
        self._session.delete(movimiento)
        self._session.commit()
