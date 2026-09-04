"""Casos de uso de gestión de horarios (Módulo Tardanzas - RF-031)."""
from app.application.dto.tardanzas import DatosSchedule
from app.domain.entities.schedule import Schedule
from app.domain.exceptions import RecursoNoEncontrado
from app.domain.repositories.schedule_repository import ScheduleRepository
import json


def _a_entidad(datos: DatosSchedule) -> Schedule:
    return Schedule(
        id=None,
        department_id=datos.department_id,
        name=datos.nombre.strip(),
        schedule_type=datos.tipo_horario,
        days_of_week=json.dumps(datos.dias_semana),
        tolerance_min=datos.tolerancia_min,
        expected_entries_per_day=datos.entradas_esperadas,
        expected_exits_per_day=datos.salidas_esperadas,
        is_active=datos.activo,
        notes=datos.notas,
        blocks=datos.bloques,
    )


class ListarSchedules:
    def __init__(self, schedules: ScheduleRepository) -> None:
        self._schedules = schedules

    def ejecutar(self) -> list[Schedule]:
        return self._schedules.listar()


class ListarSchedulesPorDepartamento:
    def __init__(self, schedules: ScheduleRepository) -> None:
        self._schedules = schedules

    def ejecutar(self, department_id: int) -> list[Schedule]:
        return self._schedules.listar_por_departamento(department_id)


class ObtenerSchedule:
    def __init__(self, schedules: ScheduleRepository) -> None:
        self._schedules = schedules

    def ejecutar(self, schedule_id: int) -> Schedule:
        schedule = self._schedules.obtener_por_id(schedule_id)
        if not schedule:
            raise RecursoNoEncontrado(f"El horario {schedule_id} no existe.")
        return schedule


class CrearSchedule:
    def __init__(self, schedules: ScheduleRepository) -> None:
        self._schedules = schedules

    def ejecutar(self, datos: DatosSchedule) -> Schedule:
        return self._schedules.crear(_a_entidad(datos))


class ActualizarSchedule:
    def __init__(self, schedules: ScheduleRepository) -> None:
        self._schedules = schedules

    def ejecutar(self, schedule_id: int, datos: DatosSchedule) -> Schedule:
        schedule = self._schedules.obtener_por_id(schedule_id)
        if not schedule:
            raise RecursoNoEncontrado(f"El horario {schedule_id} no existe.")
        return self._schedules.actualizar(schedule_id, _a_entidad(datos))


class CambiarEstadoSchedule:
    def __init__(self, schedules: ScheduleRepository) -> None:
        self._schedules = schedules

    def ejecutar(self, schedule_id: int, es_activo: bool) -> Schedule:
        schedule = self._schedules.obtener_por_id(schedule_id)
        if not schedule:
            raise RecursoNoEncontrado(f"El horario {schedule_id} no existe.")
        return self._schedules.cambiar_estado(schedule_id, es_activo)


class EliminarSchedule:
    def __init__(self, schedules: ScheduleRepository) -> None:
        self._schedules = schedules

    def ejecutar(self, schedule_id: int) -> None:
        if self._schedules.obtener_por_id(schedule_id) is None:
            raise RecursoNoEncontrado(f"El horario {schedule_id} no existe.")
        self._schedules.eliminar(schedule_id)


class RestaurarSchedule:
    def __init__(self, schedules: ScheduleRepository) -> None:
        self._schedules = schedules

    def ejecutar(self, schedule_id: int) -> Schedule:
        schedule = self._schedules.obtener_por_id(schedule_id)
        if not schedule:
            raise RecursoNoEncontrado(f"El horario {schedule_id} no existe.")
        return self._schedules.restaurar(schedule_id)
