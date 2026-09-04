"""Router de Tardanzas - Gestión de Departamentos y Horarios (RF-031)."""
from fastapi import APIRouter, Depends, status

from app.application.dto.tardanzas import DatosDepartamento
from app.application.use_cases.tardanzas.gestionar_departamentos import (
    ActualizarDepartamento,
    CambiarEstadoDepartamento,
    CrearDepartamento,
    EliminarDepartamento,
    ListarDepartamentos,
    ObtenerDepartamento,
    RestaurarDepartamento,
)
from app.application.use_cases.tardanzas.gestionar_schedules import (
    ActualizarSchedule,
    CambiarEstadoSchedule,
    CrearSchedule,
    EliminarSchedule,
    ListarSchedules,
    ListarSchedulesPorDepartamento,
    ObtenerSchedule,
    RestaurarSchedule,
)
from app.presentation.api.deps import DepartmentRepo, ScheduleRepo, require_permiso
from app.presentation.schemas.tardanzas import (
    DepartamentoCreate,
    DepartamentoRead,
    DepartamentoUpdate,
    ScheduleCreate,
    ScheduleRead,
    ScheduleUpdate,
)

router = APIRouter(prefix="/tardanzas", tags=["Tardanzas · Gestión"])


@router.get(
    "/departamentos",
    response_model=list[DepartamentoRead],
    summary="Listar departamentos activos",
    dependencies=[Depends(require_permiso("tardanzas:ver"))],
)
def listar_departamentos(departamentos: DepartmentRepo) -> list[DepartamentoRead]:
    listado = ListarDepartamentos(departamentos).ejecutar()
    return [DepartamentoRead.model_validate({
        **d.__dict__,
        "es_eliminado": d.is_deleted,
        "creado_en": d.created_at,
        "actualizado_en": d.updated_at,
    }) for d in listado]


@router.post(
    "/departamentos",
    response_model=DepartamentoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear departamento",
    dependencies=[Depends(require_permiso("tardanzas:crear"))],
)
def crear_departamento(
    datos: DepartamentoCreate, departamentos: DepartmentRepo
) -> DepartamentoRead:
    dto = DatosDepartamento(
        nombre=datos.nombre,
        notas=datos.notas,
        activo=datos.activo,
    )
    creado = CrearDepartamento(departamentos).ejecutar(dto)
    return DepartamentoRead.model_validate({
        **creado.__dict__,
        "es_eliminado": creado.is_deleted,
        "creado_en": creado.created_at,
        "actualizado_en": creado.updated_at,
    })


@router.get(
    "/departamentos/{department_id}",
    response_model=DepartamentoRead,
    summary="Obtener departamento por ID",
    dependencies=[Depends(require_permiso("tardanzas:ver"))],
)
def obtener_departamento(
    department_id: int, departamentos: DepartmentRepo
) -> DepartamentoRead:
    dept = ObtenerDepartamento(departamentos).ejecutar(department_id)
    return DepartamentoRead.model_validate({
        **dept.__dict__,
        "es_eliminado": dept.is_deleted,
        "creado_en": dept.created_at,
        "actualizado_en": dept.updated_at,
    })


@router.put(
    "/departamentos/{department_id}",
    response_model=DepartamentoRead,
    summary="Actualizar departamento",
    dependencies=[Depends(require_permiso("tardanzas:editar"))],
)
def actualizar_departamento(
    department_id: int,
    datos: DepartamentoUpdate,
    departamentos: DepartmentRepo,
) -> DepartamentoRead:
    actualizado = ActualizarDepartamento(departamentos).ejecutar(
        department_id,
        DatosDepartamento(
            nombre=datos.nombre or "",
            notas=datos.notas,
            activo=True,
        ),
    )
    return DepartamentoRead.model_validate({
        **actualizado.__dict__,
        "es_eliminado": actualizado.is_deleted,
        "creado_en": actualizado.created_at,
        "actualizado_en": actualizado.updated_at,
    })


@router.patch(
    "/departamentos/{department_id}/estado",
    response_model=DepartamentoRead,
    summary="Cambiar estado del departamento",
    dependencies=[Depends(require_permiso("tardanzas:editar"))],
)
def cambiar_estado_departamento(
    department_id: int,
    es_activo: bool,
    departamentos: DepartmentRepo,
) -> DepartamentoRead:
    actualizado = CambiarEstadoDepartamento(departamentos).ejecutar(department_id, es_activo)
    return DepartamentoRead.model_validate({
        **actualizado.__dict__,
        "es_eliminado": actualizado.is_deleted,
        "creado_en": actualizado.created_at,
        "actualizado_en": actualizado.updated_at,
    })


@router.delete(
    "/departamentos/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar departamento",
    dependencies=[Depends(require_permiso("tardanzas:eliminar"))],
)
def eliminar_departamento(
    department_id: int, departamentos: DepartmentRepo
) -> None:
    EliminarDepartamento(departamentos).ejecutar(department_id)


@router.patch(
    "/departamentos/{department_id}/restaurar",
    response_model=DepartamentoRead,
    summary="Restaurar departamento eliminado",
    dependencies=[Depends(require_permiso("tardanzas:editar"))],
)
def restaurar_departamento(
    department_id: int, departamentos: DepartmentRepo
) -> DepartamentoRead:
    restaurado = RestaurarDepartamento(departamentos).ejecutar(department_id)
    return DepartamentoRead.model_validate({
        **restaurado.__dict__,
        "es_eliminado": restaurado.is_deleted,
        "creado_en": restaurado.created_at,
        "actualizado_en": restaurado.updated_at,
    })


# =============== HORARIOS ===============


@router.get(
    "/horarios",
    response_model=list[ScheduleRead],
    summary="Listar horarios activos",
    dependencies=[Depends(require_permiso("tardanzas:ver"))],
)
def listar_horarios(schedules: ScheduleRepo) -> list[ScheduleRead]:
    listado = ListarSchedules(schedules).ejecutar()
    return [ScheduleRead.model_validate({
        **s.__dict__,
        "es_eliminado": s.is_deleted,
        "creado_en": s.created_at,
        "actualizado_en": s.updated_at,
    }) for s in listado]


@router.get(
    "/departamentos/{department_id}/horarios",
    response_model=list[ScheduleRead],
    summary="Listar horarios de un departamento",
    dependencies=[Depends(require_permiso("tardanzas:ver"))],
)
def listar_horarios_departamento(
    department_id: int, schedules: ScheduleRepo
) -> list[ScheduleRead]:
    listado = ListarSchedulesPorDepartamento(schedules).ejecutar(department_id)
    return [ScheduleRead.model_validate({
        **s.__dict__,
        "es_eliminado": s.is_deleted,
        "creado_en": s.created_at,
        "actualizado_en": s.updated_at,
    }) for s in listado]


@router.post(
    "/horarios",
    response_model=ScheduleRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear horario",
    dependencies=[Depends(require_permiso("tardanzas:crear"))],
)
def crear_horario(
    datos: ScheduleCreate, schedules: ScheduleRepo
) -> ScheduleRead:
    from app.application.dto.tardanzas import DatosSchedule, DatosScheduleBlock

    bloques = [
        DatosScheduleBlock(
            nombre=b.nombre,
            hora_inicio=b.hora_inicio,
            hora_fin=b.hora_fin,
            orden=b.orden,
            cruza_medianoche=b.cruza_medianoche,
            es_entrada=b.es_entrada,
        )
        for b in datos.bloques
    ]

    dto = DatosSchedule(
        department_id=datos.department_id,
        nombre=datos.nombre,
        tipo_horario=datos.tipo_horario,
        dias_semana=datos.dias_semana,
        tolerancia_min=datos.tolerancia_min,
        entradas_esperadas=datos.entradas_esperadas,
        salidas_esperadas=datos.salidas_esperadas,
        activo=datos.activo,
        notas=datos.notas,
        bloques=bloques,
    )
    creado = CrearSchedule(schedules).ejecutar(dto)
    return ScheduleRead.model_validate({
        **creado.__dict__,
        "es_eliminado": creado.is_deleted,
        "creado_en": creado.created_at,
        "actualizado_en": creado.updated_at,
    })


@router.get(
    "/horarios/{schedule_id}",
    response_model=ScheduleRead,
    summary="Obtener horario por ID",
    dependencies=[Depends(require_permiso("tardanzas:ver"))],
)
def obtener_horario(
    schedule_id: int, schedules: ScheduleRepo
) -> ScheduleRead:
    schedule = ObtenerSchedule(schedules).ejecutar(schedule_id)
    return ScheduleRead.model_validate({
        **schedule.__dict__,
        "es_eliminado": schedule.is_deleted,
        "creado_en": schedule.created_at,
        "actualizado_en": schedule.updated_at,
    })


@router.put(
    "/horarios/{schedule_id}",
    response_model=ScheduleRead,
    summary="Actualizar horario",
    dependencies=[Depends(require_permiso("tardanzas:editar"))],
)
def actualizar_horario(
    schedule_id: int,
    datos: ScheduleUpdate,
    schedules: ScheduleRepo,
) -> ScheduleRead:
    from app.application.dto.tardanzas import DatosSchedule, DatosScheduleBlock

    bloques = []
    if datos.bloques:
        bloques = [
            DatosScheduleBlock(
                nombre=b.nombre,
                hora_inicio=b.hora_inicio,
                hora_fin=b.hora_fin,
                orden=b.orden,
                cruza_medianoche=b.cruza_medianoche,
                es_entrada=b.es_entrada,
            )
            for b in datos.bloques
        ]

    dto = DatosSchedule(
        department_id=0,
        nombre=datos.nombre or "",
        tipo_horario=datos.tipo_horario or "FIXED",
        dias_semana=datos.dias_semana or [],
        tolerancia_min=datos.tolerancia_min or 0,
        entradas_esperadas=datos.entradas_esperadas,
        salidas_esperadas=datos.salidas_esperadas,
        activo=True,
        notas=datos.notas,
        bloques=bloques,
    )
    actualizado = ActualizarSchedule(schedules).ejecutar(schedule_id, dto)
    return ScheduleRead.model_validate({
        **actualizado.__dict__,
        "es_eliminado": actualizado.is_deleted,
        "creado_en": actualizado.created_at,
        "actualizado_en": actualizado.updated_at,
    })


@router.patch(
    "/horarios/{schedule_id}/estado",
    response_model=ScheduleRead,
    summary="Cambiar estado del horario",
    dependencies=[Depends(require_permiso("tardanzas:editar"))],
)
def cambiar_estado_horario(
    schedule_id: int,
    es_activo: bool,
    schedules: ScheduleRepo,
) -> ScheduleRead:
    actualizado = CambiarEstadoSchedule(schedules).ejecutar(schedule_id, es_activo)
    return ScheduleRead.model_validate({
        **actualizado.__dict__,
        "es_eliminado": actualizado.is_deleted,
        "creado_en": actualizado.created_at,
        "actualizado_en": actualizado.updated_at,
    })


@router.delete(
    "/horarios/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar horario",
    dependencies=[Depends(require_permiso("tardanzas:eliminar"))],
)
def eliminar_horario(
    schedule_id: int, schedules: ScheduleRepo
) -> None:
    EliminarSchedule(schedules).ejecutar(schedule_id)


@router.patch(
    "/horarios/{schedule_id}/restaurar",
    response_model=ScheduleRead,
    summary="Restaurar horario eliminado",
    dependencies=[Depends(require_permiso("tardanzas:editar"))],
)
def restaurar_horario(
    schedule_id: int, schedules: ScheduleRepo
) -> ScheduleRead:
    restaurado = RestaurarSchedule(schedules).ejecutar(schedule_id)
    return ScheduleRead.model_validate({
        **restaurado.__dict__,
        "es_eliminado": restaurado.is_deleted,
        "creado_en": restaurado.created_at,
        "actualizado_en": restaurado.updated_at,
    })
