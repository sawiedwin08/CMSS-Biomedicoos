"""Implementación SQLAlchemy del Repositorio de Schedules (Módulo Tardanzas - RF-031)."""
from sqlalchemy.orm import Session, joinedload

from app.domain.entities.schedule import Schedule, ScheduleBlock
from app.domain.repositories.schedule_repository import ScheduleRepository
from app.infrastructure.models.schedule import Schedule as ScheduleModel
from app.infrastructure.models.schedule_block import ScheduleBlock as ScheduleBlockModel


class ScheduleRepositorySQLAlchemy(ScheduleRepository):
    def __init__(self, session: Session):
        self.session = session

    def listar(self) -> list[Schedule]:
        rows = (
            self.session.query(ScheduleModel)
            .filter_by(is_active=True, is_deleted=False)
            .options(joinedload(ScheduleModel.blocks))
            .all()
        )
        return [self._to_domain(r) for r in rows]

    def listar_por_departamento(self, department_id: int) -> list[Schedule]:
        rows = (
            self.session.query(ScheduleModel)
            .filter_by(department_id=department_id, is_active=True, is_deleted=False)
            .options(joinedload(ScheduleModel.blocks))
            .all()
        )
        return [self._to_domain(r) for r in rows]

    def obtener_por_id(self, schedule_id: int) -> Schedule | None:
        row = (
            self.session.query(ScheduleModel)
            .filter_by(id=schedule_id)
            .options(joinedload(ScheduleModel.blocks))
            .first()
        )
        return self._to_domain(row) if row else None

    def crear(self, schedule: Schedule) -> Schedule:
        nuevo = ScheduleModel(
            department_id=schedule.department_id,
            name=schedule.name,
            schedule_type=schedule.schedule_type,
            days_of_week=schedule.days_of_week,
            tolerance_min=schedule.tolerance_min,
            expected_entries_per_day=schedule.expected_entries_per_day,
            expected_exits_per_day=schedule.expected_exits_per_day,
            is_active=schedule.is_active,
            notes=schedule.notes,
        )

        if schedule.blocks:
            for block in schedule.blocks:
                block_model = ScheduleBlockModel(
                    name=block.name,
                    start_time=block.start_time,
                    end_time=block.end_time,
                    block_order=block.block_order,
                    crosses_midnight=block.crosses_midnight,
                    is_entry_point=block.is_entry_point,
                )
                nuevo.blocks.append(block_model)

        self.session.add(nuevo)
        self.session.commit()
        return self._to_domain(nuevo)

    def actualizar(self, schedule_id: int, datos: Schedule) -> Schedule:
        row = self.session.query(ScheduleModel).filter_by(id=schedule_id).first()
        if row:
            row.name = datos.name
            row.schedule_type = datos.schedule_type
            row.days_of_week = datos.days_of_week
            row.tolerance_min = datos.tolerance_min
            row.expected_entries_per_day = datos.expected_entries_per_day
            row.expected_exits_per_day = datos.expected_exits_per_day
            row.notes = datos.notes
            self.session.commit()
        return self._to_domain(row) if row else None

    def cambiar_estado(self, schedule_id: int, es_activo: bool) -> Schedule:
        row = self.session.query(ScheduleModel).filter_by(id=schedule_id).first()
        if row:
            row.is_active = es_activo
            self.session.commit()
        return self._to_domain(row) if row else None

    def eliminar(self, schedule_id: int) -> None:
        row = self.session.query(ScheduleModel).filter_by(id=schedule_id).first()
        if row:
            row.is_deleted = True
            self.session.commit()

    def restaurar(self, schedule_id: int) -> Schedule:
        row = self.session.query(ScheduleModel).filter_by(id=schedule_id).first()
        if row:
            row.is_deleted = False
            self.session.commit()
        return self._to_domain(row) if row else None

    @staticmethod
    def _to_domain(row: ScheduleModel) -> Schedule:
        if not row:
            return None

        blocks = []
        if row.blocks:
            blocks = [
                ScheduleBlock(
                    id=b.id,
                    name=b.name,
                    start_time=b.start_time,
                    end_time=b.end_time,
                    block_order=b.block_order,
                    crosses_midnight=b.crosses_midnight,
                    is_entry_point=b.is_entry_point,
                    created_at=b.created_at,
                    updated_at=b.updated_at,
                )
                for b in row.blocks
            ]

        return Schedule(
            id=row.id,
            department_id=row.department_id,
            name=row.name,
            schedule_type=row.schedule_type,
            days_of_week=row.days_of_week,
            tolerance_min=row.tolerance_min,
            expected_entries_per_day=row.expected_entries_per_day,
            expected_exits_per_day=row.expected_exits_per_day,
            is_active=row.is_active,
            is_deleted=row.is_deleted,
            notes=row.notes,
            blocks=blocks,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
