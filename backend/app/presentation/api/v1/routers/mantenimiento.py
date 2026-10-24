"""Router de gestión de mantenimiento y órdenes de trabajo (RF-013..017)."""
import os
from datetime import datetime
from pathlib import Path
from typing import Annotated

from sqlalchemy import delete as sa_delete
from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.core.config import settings
from app.domain.enums.estado_ot import EstadoOT
from app.domain.enums.tipo_mantenimiento import TipoMantenimiento
from app.infrastructure.models.orden_trabajo import OrdenTrabajo
from app.infrastructure.models.checklist_equipo import ChecklistEquipo, ChecklistPaso
from app.infrastructure.models.ejecucion_checklist import EjecucionChecklistPaso
from app.infrastructure.models.plantilla_rutina import PlantillaRutina
from app.presentation.api.deps import (
    DbSession,
    DocumentoEquipoRepo,
    EquipoRepo,
    UsuarioRepo,
    OrdenTrabajoRepo,
    ChecklistEquipoRepo,
    CurrentUser,
    require_permiso,
)
from app.presentation.schemas.orden_trabajo import (
    CambioEstadoLote,
    CambioEstadoLoteResultado,
    OTCreate,
    OTLoteCreate,
    OTLoteResultado,
    OTRead,
    OTUpdate,
    PlantillaRutinaCreate,
    PlantillaRutinaRead,
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
        repuestos=datos.repuestos,
    )
    ot_creada = ordenes.crear(ot)
    return OTRead.model_validate(ot_creada)


@router.post(
    "/ordenes-trabajo/lote",
    response_model=OTLoteResultado,
    status_code=status.HTTP_201_CREATED,
    summary="Crear órdenes de trabajo en lote (una por equipo)",
    dependencies=[Depends(require_permiso("mantenimiento:crear"))],
)
def crear_ordenes_lote(
    datos: OTLoteCreate,
    equipos: EquipoRepo,
    ordenes: OrdenTrabajoRepo,
) -> OTLoteResultado:
    """Crea una OT por cada equipo del lote. Devuelve cuántas se crearon y los errores."""
    creadas = 0
    errores: list[dict] = []
    for equipo_id in datos.equipo_ids:
        if equipos.obtener_por_id(equipo_id) is None:
            errores.append({"equipo_id": equipo_id, "error": "El equipo no existe."})
            continue
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
            repuestos=datos.repuestos,
        )
        ordenes.crear(ot)
        creadas += 1
    return OTLoteResultado(creadas=creadas, errores=errores)


# ==================== PLANTILLAS DE RUTINA ====================


@router.get(
    "/plantillas-rutina",
    response_model=list[PlantillaRutinaRead],
    summary="Listar plantillas de rutina guardadas",
    dependencies=[Depends(require_permiso("mantenimiento:ver"))],
)
def listar_plantillas_rutina(db: DbSession) -> list[PlantillaRutina]:
    from sqlalchemy import select

    return list(db.scalars(select(PlantillaRutina).order_by(PlantillaRutina.nombre)).all())


@router.post(
    "/plantillas-rutina",
    response_model=PlantillaRutinaRead,
    status_code=status.HTTP_201_CREATED,
    summary="Guardar una rutina como plantilla reutilizable",
    dependencies=[Depends(require_permiso("mantenimiento:crear"))],
)
def crear_plantilla_rutina(datos: PlantillaRutinaCreate, db: DbSession) -> PlantillaRutina:
    from sqlalchemy import select

    nombre = datos.nombre.strip()
    existe = db.scalar(select(PlantillaRutina).where(PlantillaRutina.nombre == nombre))
    if existe is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una plantilla con el nombre '{nombre}'.",
        )
    plantilla = PlantillaRutina(
        nombre=nombre,
        pasos=[p.model_dump() for p in datos.pasos],
    )
    db.add(plantilla)
    db.commit()
    db.refresh(plantilla)
    return plantilla


@router.delete(
    "/plantillas-rutina/{plantilla_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una plantilla de rutina",
    dependencies=[Depends(require_permiso("mantenimiento:editar"))],
)
def eliminar_plantilla_rutina(plantilla_id: int, db: DbSession) -> None:
    plantilla = db.get(PlantillaRutina, plantilla_id)
    if plantilla is not None:
        db.delete(plantilla)
        db.commit()


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
        ot_read.equipo_codigo = equipo.codigo_interno if equipo else None
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
        ot_read.equipo_codigo = equipo.codigo_interno
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
    db: DbSession,
) -> OTRead:
    """Cambia el estado de una orden de trabajo (y registra inicio/cierre)."""
    ot = db.get(OrdenTrabajo, ot_id)
    if ot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"La OT {ot_id} no existe."
        )

    ot.estado = cambio.nuevo_estado
    # Registrar inicio al pasar a "en progreso".
    if cambio.nuevo_estado == EstadoOT.EN_PROGRESO and ot.fecha_inicio is None:
        ot.fecha_inicio = datetime.utcnow()
    # Registrar cierre al pasar a "completada".
    if cambio.nuevo_estado == EstadoOT.COMPLETADA:
        ot.fecha_cierre = datetime.utcnow()

    db.commit()
    db.refresh(ot)
    return OTRead.model_validate(ot)


@router.patch(
    "/ordenes-trabajo/estado-lote",
    response_model=CambioEstadoLoteResultado,
    summary="Cambiar el estado de varias órdenes de trabajo a la vez",
    dependencies=[Depends(require_permiso("mantenimiento:editar"))],
)
def cambiar_estado_lote(
    datos: CambioEstadoLote,
    db: DbSession,
) -> CambioEstadoLoteResultado:
    """Cambia el estado de las OT indicadas. Las ya 'completada' quedan bloqueadas (se omiten)."""
    actualizadas = 0
    omitidas = 0
    for ot_id in datos.ot_ids:
        ot = db.get(OrdenTrabajo, ot_id)
        if ot is None or ot.estado == EstadoOT.COMPLETADA:
            omitidas += 1
            continue
        ot.estado = datos.nuevo_estado
        if datos.nuevo_estado == EstadoOT.EN_PROGRESO and ot.fecha_inicio is None:
            ot.fecha_inicio = datetime.utcnow()
        if datos.nuevo_estado == EstadoOT.COMPLETADA:
            ot.fecha_cierre = datetime.utcnow()
        actualizadas += 1
    db.commit()
    return CambioEstadoLoteResultado(actualizadas=actualizadas, omitidas=omitidas)


# Tipo de documento (carpeta) según el tipo de mantenimiento de la OT.
_TIPO_DOC_POR_OT = {
    TipoMantenimiento.PREVENTIVO: "mantenimientos_preventivos",
    TipoMantenimiento.CORRECTIVO: "correctivo",
    TipoMantenimiento.CALIBRACION: "calibracion",
    TipoMantenimiento.OTRA: "reportes",
}


@router.post(
    "/ordenes-trabajo/{ot_id}/pdf",
    summary="Guardar el PDF diligenciado de la hoja de rutina en la carpeta de mantenimiento",
    dependencies=[Depends(require_permiso("mantenimiento:editar"))],
)
def guardar_pdf_hoja_rutina(
    ot_id: int,
    ordenes: OrdenTrabajoRepo,
    documentos: DocumentoEquipoRepo,
    usuario: CurrentUser,
    archivo: Annotated[UploadFile, File(description="PDF generado de la hoja de rutina")],
) -> dict:
    """Guarda el PDF de la hoja de rutina en uploads/documentos/equipo_{id}/mantenimiento/{año}/{tipo}
    y lo registra en los documentos del equipo."""
    ot = ordenes.obtener_por_id(ot_id)
    if ot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"La OT {ot_id} no existe."
        )

    contenido = archivo.file.read()
    if not contenido:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="El PDF está vacío."
        )

    tipo_doc = _TIPO_DOC_POR_OT.get(ot.tipo, "reportes")
    anio = (ot.fecha_cierre or ot.fecha_programada or datetime.utcnow()).year
    directorio = (
        Path(settings.STORAGE_DIR)
        / "documentos"
        / f"equipo_{ot.equipo_id}"
        / "mantenimiento"
        / str(anio)
        / tipo_doc
    )
    directorio.mkdir(parents=True, exist_ok=True)

    nombre = f"OT-{ot_id}_{anio}.pdf"
    ruta = directorio / nombre
    if ruta.exists():
        base, ext = os.path.splitext(nombre)
        contador = 1
        while ruta.exists():
            nombre = f"{base}_{contador}{ext}"
            ruta = directorio / nombre
            contador += 1

    with open(ruta, "wb") as f:
        f.write(contenido)

    documento = documentos.crear(
        equipo_id=ot.equipo_id,
        tipo=tipo_doc,
        nombre_archivo=nombre,
        ruta_archivo=str(ruta),
        tamaño_bytes=len(contenido),
        mime_type="application/pdf",
        usuario_id=usuario.id,
        descripcion=f"Hoja de rutina OT-{ot_id}",
        año_documento=anio,
    )
    return {"ok": True, "documento_id": documento.id, "archivo": nombre, "anio": anio}


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

    db = checklists._session
    existente = checklists.obtener_por_equipo(equipo_id)

    if existente is not None:
        # El equipo ya tiene checklist: se REEMPLAZAN sus pasos por los nuevos
        # (así se aplica la rutina/plantilla cargada). Se limpian las ejecuciones
        # que referenciaban los pasos anteriores.
        viejos_ids = [p.id for p in existente.pasos]
        if viejos_ids:
            db.execute(
                sa_delete(EjecucionChecklistPaso).where(
                    EjecucionChecklistPaso.paso_id.in_(viejos_ids)
                )
            )
        existente.nombre = datos.nombre
        existente.descripcion = datos.descripcion
        existente.pasos.clear()
        db.flush()
        for paso_data in datos.pasos:
            existente.pasos.append(
                ChecklistPaso(
                    orden=paso_data.orden,
                    descripcion=paso_data.descripcion,
                    instrucciones=paso_data.instrucciones,
                )
            )
        db.commit()
        db.refresh(existente)
        return ChecklistEquipoRead.model_validate(existente)

    checklist = ChecklistEquipo(
        equipo_id=equipo_id,
        nombre=datos.nombre,
        descripcion=datos.descripcion,
    )
    for paso_data in datos.pasos:
        checklist.pasos.append(
            ChecklistPaso(
                orden=paso_data.orden,
                descripcion=paso_data.descripcion,
                instrucciones=paso_data.instrucciones,
            )
        )
    try:
        checklist_creado = checklists.crear(checklist)
        return ChecklistEquipoRead.model_validate(checklist_creado)
    except IntegrityError:
        db.rollback()
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
