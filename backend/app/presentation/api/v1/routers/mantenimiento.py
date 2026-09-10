"""Router de gestión de mantenimiento y órdenes de trabajo (RF-013..017)."""
from datetime import datetime
from typing import Annotated

from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.domain.enums.estado_ot import EstadoOT
from app.domain.enums.tipo_mantenimiento import TipoMantenimiento
from app.infrastructure.models.orden_trabajo import OrdenTrabajo
from app.infrastructure.models.checklist_equipo import ChecklistEquipo, ChecklistPaso
from app.infrastructure.models.ejecucion_checklist import EjecucionChecklistPaso
from app.presentation.api.deps import (
    EquipoRepo,
    UsuarioRepo,
    OrdenTrabajoRepo,
    ChecklistEquipoRepo,
    CurrentUser,
    require_permiso,
)
from app.presentation.schemas.orden_trabajo import (
    OTCreate,
    OTRead,
    OTUpdate,
    ChecklistEquipoCreate,
    ChecklistEquipoRead,
    ChecklistPasoCreate,
    ChecklistPasoRead,
    EjecucionPasoCreate,
    EjecucionPasoRead,
    CambioEstadoOT,
)

router = APIRouter(prefix="/mantenimiento", tags=["Mantenimiento"])


@router.post(
    "/equipos/{equipo_id}/ordenes-trabajo",
    response_model=OTRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva orden de trabajo",
    dependencies=[Depends(require_permiso("mantenimiento:crear"))],
)
def crear_orden_trabajo(
    equipo_id: int,
    datos: OTCreate,
    equipos: EquipoRepo,
    ordenes: OrdenTrabajoRepo,
) -> OTRead:
    """Crea una nueva orden de trabajo para un equipo.

    Solo Admin y Coordinador pueden crear OTs (RF-013).
    """
    if equipos.obtener_por_id(equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo {equipo_id} no existe.",
        )

    ot = OrdenTrabajo(
        equipo_id=equipo_id,
        tipo=datos.tipo,
        descripcion=datos.descripcion,
        observaciones=datos.observaciones,
        tecnico_id=datos.tecnico_id,
        tecnico_nombre=datos.tecnico_nombre,
        fecha_programada=datos.fecha_programada,
        tiempo_empleado_minutos=datos.tiempo_empleado_minutos,
        costo_total=datos.costo_total,
    )
    ot_creada = ordenes.crear(ot)
    return OTRead.model_validate(ot_creada)


@router.get(
    "/ordenes-trabajo",
    response_model=list[OTRead],
    summary="Obtener todas las órdenes de trabajo",
    dependencies=[Depends(require_permiso("mantenimiento:ver"))],
)
def obtener_todas_ordenes(
    ordenes: OrdenTrabajoRepo,
    equipos: EquipoRepo,
    estado: EstadoOT | None = Query(None),
) -> list[OTRead]:
    """Obtiene todas las órdenes de trabajo del sistema, opcionalmente filtradas por estado."""
    todas = ordenes.listar_todas()

    if estado:
        todas = [ot for ot in todas if ot.estado == estado]

    resultado = []
    for ot in todas:
        ot_read = OTRead.model_validate(ot)
        equipo = equipos.obtener_por_id(ot.equipo_id)
        ot_read.equipo_nombre = equipo.nombre if equipo else None
        resultado.append(ot_read)

    return resultado


@router.get(
    "/equipos/{equipo_id}/ordenes-trabajo",
    response_model=list[OTRead],
    summary="Obtener órdenes de trabajo de un equipo",
    dependencies=[Depends(require_permiso("mantenimiento:ver"))],
)
def obtener_ordenes_equipo(
    equipo_id: int,
    equipos: EquipoRepo,
    ordenes: OrdenTrabajoRepo,
    estado: EstadoOT | None = Query(None),
) -> list[OTRead]:
    """Obtiene todas las órdenes de trabajo de un equipo, opcionalmente filtradas por estado."""
    equipo = equipos.obtener_por_id(equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo {equipo_id} no existe.",
        )

    todas = ordenes.obtener_por_equipo(equipo_id)

    if estado:
        todas = [ot for ot in todas if ot.estado == estado]

    resultado = []
    for ot in todas:
        ot_read = OTRead.model_validate(ot)
        ot_read.equipo_nombre = equipo.nombre
        resultado.append(ot_read)

    return resultado


@router.get(
    "/ordenes-trabajo/{ot_id}",
    response_model=OTRead,
    summary="Obtener detalle de una orden de trabajo",
    dependencies=[Depends(require_permiso("mantenimiento:ver"))],
)
def obtener_orden_trabajo(
    ot_id: int,
    ordenes: OrdenTrabajoRepo,
) -> OTRead:
    """Obtiene el detalle de una orden de trabajo específica."""
    ot = ordenes.obtener_por_id(ot_id)
    if ot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La OT {ot_id} no existe.",
        )
    return OTRead.model_validate(ot)


@router.put(
    "/ordenes-trabajo/{ot_id}",
    response_model=OTRead,
    summary="Actualizar orden de trabajo",
    dependencies=[Depends(require_permiso("mantenimiento:editar"))],
)
def actualizar_orden_trabajo(
    ot_id: int,
    datos: OTUpdate,
    ordenes: OrdenTrabajoRepo,
) -> OTRead:
    """Actualiza los datos de una orden de trabajo."""
    ot_actual = ordenes.obtener_por_id(ot_id)
    if ot_actual is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La OT {ot_id} no existe.",
        )

    if datos.tipo:
        ot_actual.tipo = datos.tipo
    if datos.descripcion:
        ot_actual.descripcion = datos.descripcion
    if datos.observaciones:
        ot_actual.observaciones = datos.observaciones
    if datos.tecnico_id:
        ot_actual.tecnico_id = datos.tecnico_id
    if datos.fecha_programada:
        ot_actual.fecha_programada = datos.fecha_programada
    if datos.tiempo_empleado_minutos:
        ot_actual.tiempo_empleado_minutos = datos.tiempo_empleado_minutos
    if datos.costo_total:
        ot_actual.costo_total = datos.costo_total
    if datos.repuestos:
        ot_actual.repuestos = datos.repuestos
    if datos.estado:
        ot_actual.estado = datos.estado

    ot_actualizada = ordenes.actualizar(ot_id, ot_actual)
    return OTRead.model_validate(ot_actualizada)


@router.patch(
    "/ordenes-trabajo/{ot_id}/estado",
    response_model=OTRead,
    summary="Cambiar estado de orden de trabajo",
    dependencies=[Depends(require_permiso("mantenimiento:editar"))],
)
def cambiar_estado_ot(
    ot_id: int,
    cambio: CambioEstadoOT,
    ordenes: OrdenTrabajoRepo,
) -> OTRead:
    """Cambia el estado de una orden de trabajo."""
    ot = ordenes.cambiar_estado(ot_id, cambio.nuevo_estado)

    # Si cambia a "en progreso", registrar inicio
    if cambio.nuevo_estado == EstadoOT.EN_PROGRESO:
        ot.fecha_inicio = datetime.utcnow()

    # Si cambia a "completada", registrar cierre
    if cambio.nuevo_estado == EstadoOT.COMPLETADA:
        ot.fecha_cierre = datetime.utcnow()

    return OTRead.model_validate(ot)


@router.delete(
    "/ordenes-trabajo/{ot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar orden de trabajo",
    dependencies=[Depends(require_permiso("mantenimiento:eliminar"))],
)
def eliminar_orden_trabajo(
    ot_id: int,
    ordenes: OrdenTrabajoRepo,
) -> None:
    """Elimina una orden de trabajo."""
    ordenes.eliminar(ot_id)




@router.post(
    "/equipos/{equipo_id}/checklist",
    response_model=ChecklistEquipoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear checklist para equipo",
    dependencies=[Depends(require_permiso("mantenimiento:crear"))],
)
def crear_checklist(
    equipo_id: int,
    datos: ChecklistEquipoCreate,
    equipos: EquipoRepo,
    checklists: ChecklistEquipoRepo,
) -> ChecklistEquipoRead:
    """Crea un nuevo checklist de mantenimiento para un equipo.

    Solo Admin y Coordinador pueden crear checklists.
    """
    if equipos.obtener_por_id(equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo {equipo_id} no existe.",
        )

    checklist = ChecklistEquipo(
        equipo_id=equipo_id,
        nombre=datos.nombre,
        descripcion=datos.descripcion,
    )

    for paso_data in datos.pasos:
        paso = ChecklistPaso(
            orden=paso_data.orden,
            descripcion=paso_data.descripcion,
            instrucciones=paso_data.instrucciones,
        )
        checklist.pasos.append(paso)

    try:
        checklist_creado = checklists.crear(checklist)
        return ChecklistEquipoRead.model_validate(checklist_creado)
    except IntegrityError:
        # Si el checklist ya existe para este equipo, obtenerlo en lugar de crear uno nuevo
        checklist_existente = checklists.obtener_por_equipo(equipo_id)
        if checklist_existente:
            return ChecklistEquipoRead.model_validate(checklist_existente)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un checklist para el equipo {equipo_id}.",
        )


@router.get(
    "/equipos/{equipo_id}/checklist",
    response_model=ChecklistEquipoRead | None,
    summary="Obtener checklist de equipo",
    dependencies=[Depends(require_permiso("mantenimiento:ver"))],
)
def obtener_checklist(
    equipo_id: int,
    equipos: EquipoRepo,
    checklists: ChecklistEquipoRepo,
) -> ChecklistEquipoRead | None:
    """Obtiene el checklist activo de un equipo."""
    if equipos.obtener_por_id(equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo {equipo_id} no existe.",
        )

    checklist = checklists.obtener_por_equipo(equipo_id)
    return ChecklistEquipoRead.model_validate(checklist) if checklist else None


@router.put(
    "/checklists/{checklist_id}",
    response_model=ChecklistEquipoRead,
    summary="Actualizar checklist",
    dependencies=[Depends(require_permiso("mantenimiento:editar"))],
)
def actualizar_checklist(
    checklist_id: int,
    datos: ChecklistEquipoCreate,
    checklists: ChecklistEquipoRepo,
) -> ChecklistEquipoRead:
    """Actualiza un checklist y sus pasos."""
    checklist = checklists.obtener_por_id(checklist_id)
    if checklist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El checklist {checklist_id} no existe.",
        )

    checklist.nombre = datos.nombre
    checklist.descripcion = datos.descripcion

    checklist_actualizado = checklists.actualizar(checklist_id, checklist)
    return ChecklistEquipoRead.model_validate(checklist_actualizado)


@router.post(
    "/checklists/{checklist_id}/pasos",
    response_model=ChecklistPasoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Agregar paso al checklist",
    dependencies=[Depends(require_permiso("mantenimiento:editar"))],
)
def agregar_paso_checklist(
    checklist_id: int,
    paso_data: ChecklistPasoCreate,
    checklists: ChecklistEquipoRepo,
) -> ChecklistPasoRead:
    """Agrega un nuevo paso a un checklist."""
    checklist = checklists.obtener_por_id(checklist_id)
    if checklist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El checklist {checklist_id} no existe.",
        )

    paso = ChecklistPaso(
        orden=paso_data.orden,
        descripcion=paso_data.descripcion,
        instrucciones=paso_data.instrucciones,
    )
    paso_creado = checklists.agregar_paso(checklist_id, paso)
    return ChecklistPasoRead.model_validate(paso_creado)


@router.delete(
    "/checklist-pasos/{paso_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar paso del checklist",
    dependencies=[Depends(require_permiso("mantenimiento:editar"))],
)
def eliminar_paso_checklist(
    paso_id: int,
    checklists: ChecklistEquipoRepo,
) -> None:
    """Elimina un paso del checklist."""
    checklists.eliminar_paso(paso_id)




@router.post(
    "/ordenes-trabajo/{ot_id}/pasos",
    response_model=EjecucionPasoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar ejecución de paso",
    dependencies=[Depends(require_permiso("mantenimiento:editar"))],
)
def registrar_ejecucion_paso(
    ot_id: int,
    ejecucion_data: EjecucionPasoCreate,
    ordenes: OrdenTrabajoRepo,
    checklists: ChecklistEquipoRepo,
) -> EjecucionPasoRead:
    """Registra la ejecución de un paso del checklist en una OT."""
    ot = ordenes.obtener_por_id(ot_id)
    if ot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La OT {ot_id} no existe.",
        )

    ejecucion = EjecucionChecklistPaso(
        ot_id=ot_id,
        paso_id=ejecucion_data.paso_id,
        estado=ejecucion_data.estado,
        observacion=ejecucion_data.observacion,
    )
    ejecucion_guardada = checklists.guardar_ejecucion_paso(ejecucion)
    return EjecucionPasoRead.model_validate(ejecucion_guardada)


@router.get(
    "/ordenes-trabajo/{ot_id}/pasos",
    response_model=list[EjecucionPasoRead],
    summary="Obtener ejecución de checklist en OT",
    dependencies=[Depends(require_permiso("mantenimiento:ver"))],
)
def obtener_ejecucion_ot(
    ot_id: int,
    ordenes: OrdenTrabajoRepo,
    checklists: ChecklistEquipoRepo,
) -> list[EjecucionPasoRead]:
    """Obtiene todos los pasos ejecutados en una OT."""
    if ordenes.obtener_por_id(ot_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La OT {ot_id} no existe.",
        )

    ejecuciones = checklists.obtener_ejecucion_ot(ot_id)
    return [EjecucionPasoRead.model_validate(e) for e in ejecuciones]


@router.put(
    "/ejecuciones/{ejecucion_id}",
    response_model=EjecucionPasoRead,
    summary="Actualizar ejecución de paso",
    dependencies=[Depends(require_permiso("mantenimiento:editar"))],
)
def actualizar_ejecucion_paso(
    ejecucion_id: int,
    datos: EjecucionPasoCreate,
    checklists: ChecklistEquipoRepo,
) -> EjecucionPasoRead:
    """Actualiza el estado y observación de un paso ejecutado."""
    # Nota: Esta es una simplificación; en producción se usaría un repositorio dedicado
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint no implementado aún.",
    )
