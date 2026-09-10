"""Repositorio SQLAlchemy para OrdenTrabajo (RF-013)."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.exceptions import RecursoNoEncontrado
from app.domain.enums.estado_ot import EstadoOT
from app.infrastructure.models.orden_trabajo import OrdenTrabajo


class OrdenTrabajoRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def crear(self, ot: OrdenTrabajo) -> OrdenTrabajo:
        """Crea una nueva orden de trabajo."""
        self._session.add(ot)
        self._session.commit()
        self._session.refresh(ot)
        return ot

    def obtener_por_id(self, ot_id: int) -> OrdenTrabajo | None:
        """Obtiene una OT por ID."""
        return self._session.get(OrdenTrabajo, ot_id)

    def obtener_por_equipo(self, equipo_id: int) -> list[OrdenTrabajo]:
        """Obtiene todas las OTs de un equipo, ordenadas por fecha (descendente)."""
        stmt = (
            select(OrdenTrabajo)
            .where(OrdenTrabajo.equipo_id == equipo_id)
            .order_by(OrdenTrabajo.created_at.desc())
        )
        return list(self._session.scalars(stmt))

    def obtener_por_estado(self, estado: EstadoOT) -> list[OrdenTrabajo]:
        """Obtiene todas las OTs en un estado específico."""
        stmt = (
            select(OrdenTrabajo)
            .where(OrdenTrabajo.estado == estado)
            .order_by(OrdenTrabajo.created_at.desc())
        )
        return list(self._session.scalars(stmt))

    def actualizar(self, ot_id: int, ot_actualizada: OrdenTrabajo) -> OrdenTrabajo:
        """Actualiza una OT existente."""
        ot = self._session.get(OrdenTrabajo, ot_id)
        if ot is None:
            raise RecursoNoEncontrado(f"La OT {ot_id} no existe.")

        for campo, valor in ot_actualizada.__dict__.items():
            if not campo.startswith('_'):
                setattr(ot, campo, valor)

        self._session.commit()
        self._session.refresh(ot)
        return ot

    def cambiar_estado(self, ot_id: int, nuevo_estado: EstadoOT) -> OrdenTrabajo:
        """Cambia el estado de una OT."""
        ot = self._session.get(OrdenTrabajo, ot_id)
        if ot is None:
            raise RecursoNoEncontrado(f"La OT {ot_id} no existe.")
        ot.estado = nuevo_estado
        self._session.commit()
        self._session.refresh(ot)
        return ot

    def eliminar(self, ot_id: int) -> None:
        """Elimina una OT."""
        ot = self._session.get(OrdenTrabajo, ot_id)
        if ot is None:
            raise RecursoNoEncontrado(f"La OT {ot_id} no existe.")
        self._session.delete(ot)
        self._session.commit()

    def listar_todas(self) -> list[OrdenTrabajo]:
        """Obtiene todas las OTs del sistema."""
        stmt = select(OrdenTrabajo).order_by(OrdenTrabajo.created_at.desc())
        return list(self._session.scalars(stmt))
