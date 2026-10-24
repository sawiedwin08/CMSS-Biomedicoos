"""Repositorio SQLAlchemy para MovimientoActivo (trazabilidad de activos de TI)."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.models.movimiento_activo import MovimientoActivo


class MovimientoActivoRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def registrar_movimiento(
        self,
        activo_id: int,
        sede_origen_id: int | None,
        area_origen_id: int | None,
        sede_destino_id: int | None,
        area_destino_id: int | None,
        usuario_origen_id: int | None,
        usuario_destino_id: int | None,
        motivo: str | None = None,
        responsable: str | None = None,
    ) -> MovimientoActivo:
        movimiento = MovimientoActivo(
            activo_id=activo_id,
            sede_origen_id=sede_origen_id,
            area_origen_id=area_origen_id,
            sede_destino_id=sede_destino_id,
            area_destino_id=area_destino_id,
            usuario_origen_id=usuario_origen_id,
            usuario_destino_id=usuario_destino_id,
            motivo=motivo,
            responsable=responsable,
        )
        self._session.add(movimiento)
        self._session.commit()
        self._session.refresh(movimiento)
        return movimiento

    def obtener_historial(self, activo_id: int) -> list[MovimientoActivo]:
        stmt = (
            select(MovimientoActivo)
            .where(MovimientoActivo.activo_id == activo_id)
            .order_by(MovimientoActivo.fecha_movimiento.desc())
        )
        return list(self._session.scalars(stmt))
