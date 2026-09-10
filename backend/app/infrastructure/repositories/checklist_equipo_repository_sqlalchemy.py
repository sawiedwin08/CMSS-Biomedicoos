"""Repositorio SQLAlchemy para ChecklistEquipo (RF-013)."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.checklist_equipo import ChecklistEquipo, ChecklistPaso
from app.infrastructure.models.ejecucion_checklist import EjecucionChecklistPaso


class ChecklistEquipoRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def crear(self, checklist: ChecklistEquipo) -> ChecklistEquipo:
        """Crea un nuevo checklist para un equipo."""
        self._session.add(checklist)
        self._session.commit()
        self._session.refresh(checklist)
        return checklist

    def obtener_por_equipo(self, equipo_id: int) -> ChecklistEquipo | None:
        """Obtiene el checklist activo de un equipo."""
        stmt = (
            select(ChecklistEquipo)
            .where(ChecklistEquipo.equipo_id == equipo_id)
            .where(ChecklistEquipo.activo == True)
        )
        return self._session.scalar(stmt)

    def obtener_por_id(self, checklist_id: int) -> ChecklistEquipo | None:
        """Obtiene un checklist por ID."""
        return self._session.get(ChecklistEquipo, checklist_id)

    def actualizar(self, checklist_id: int, checklist_actualizado: ChecklistEquipo) -> ChecklistEquipo:
        """Actualiza un checklist."""
        checklist = self._session.get(ChecklistEquipo, checklist_id)
        if checklist is None:
            raise RecursoNoEncontrado(f"El checklist {checklist_id} no existe.")

        checklist.nombre = checklist_actualizado.nombre
        checklist.descripcion = checklist_actualizado.descripcion
        checklist.activo = checklist_actualizado.activo

        self._session.commit()
        self._session.refresh(checklist)
        return checklist

    def agregar_paso(self, checklist_id: int, paso: ChecklistPaso) -> ChecklistPaso:
        """Agrega un paso a un checklist."""
        paso.checklist_id = checklist_id
        self._session.add(paso)
        self._session.commit()
        self._session.refresh(paso)
        return paso

    def eliminar_paso(self, paso_id: int) -> None:
        """Elimina un paso del checklist."""
        paso = self._session.get(ChecklistPaso, paso_id)
        if paso is None:
            raise RecursoNoEncontrado(f"El paso {paso_id} no existe.")
        self._session.delete(paso)
        self._session.commit()

    def guardar_ejecucion_paso(self, ejecucion: EjecucionChecklistPaso) -> EjecucionChecklistPaso:
        """Guarda la ejecución de un paso en una OT."""
        self._session.add(ejecucion)
        self._session.commit()
        self._session.refresh(ejecucion)
        return ejecucion

    def obtener_ejecucion_ot(self, ot_id: int) -> list[EjecucionChecklistPaso]:
        """Obtiene todos los pasos ejecutados en una OT."""
        stmt = (
            select(EjecucionChecklistPaso)
            .where(EjecucionChecklistPaso.ot_id == ot_id)
            .order_by(EjecucionChecklistPaso.paso_id)
        )
        return list(self._session.scalars(stmt))

    def eliminar(self, checklist_id: int) -> None:
        """Elimina un checklist y todos sus pasos."""
        checklist = self._session.get(ChecklistEquipo, checklist_id)
        if checklist is None:
            raise RecursoNoEncontrado(f"El checklist {checklist_id} no existe.")
        self._session.delete(checklist)
        self._session.commit()
