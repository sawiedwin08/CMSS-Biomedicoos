"""Router del módulo Sistemas — Inventario de activos de TI."""
import os
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response

from app.core.config import settings

from app.application.dto.activos import DatosActivo, DatosBaja, FiltroActivos
from app.application.use_cases.sistemas.gestionar_activos import (
    ActualizarActivo,
    CrearActivo,
    DarDeBajaActivo,
    EliminarActivo,
    ListarActivos,
    ObtenerActivo,
)
from app.application.use_cases.sistemas.importar_activos import (
    ImportarActivos,
    filas_para_export,
)
from app.domain.enums.activos import CategoriaActivo, EstadoActivo
from app.infrastructure.services.excel_activos import (
    generar_export,
    generar_plantilla,
    parse_activos,
)
from app.infrastructure.services.pdf_actas import generar_acta_asignacion, generar_hoja_vida
from app.presentation.api.deps import (
    ActivoRepo,
    CurrentUser,
    DocumentoActivoRepo,
    MantenimientoActivoRepo,
    MovimientoActivoRepo,
    ProveedorRepo,
    SedeRepo,
    ServicioRepo,
    UsuarioRepo,
    require_permiso,
)
from app.presentation.schemas.acta_asignacion import ActaAsignacionDatos
from app.presentation.schemas.activos import (
    ActivoBaja,
    ActivoCreate,
    ActivoRead,
    ActivoUpdate,
)
from app.presentation.schemas.documento_activo import ActaListItem, DocumentoActivoRead
from app.presentation.schemas.equipos import ImportacionResultado
from app.presentation.schemas.mantenimiento_activo import (
    MantenimientoCreate,
    MantenimientoListItem,
    MantenimientoRead,
)
from app.presentation.schemas.movimiento_activo import (
    MovimientoActivoCreate,
    MovimientoActivoRead,
)

_EXCEL_MEDIA = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
_DOCS_DIR = Path(settings.STORAGE_DIR) / "sistemas"
_DOCS_MAX_BYTES = 20 * 1024 * 1024
_TIPOS_DOC = {"factura", "garantia", "acta", "manual", "otro"}

router = APIRouter(prefix="/sistemas/activos", tags=["Sistemas · Inventario de activos"])


@router.get(
    "",
    response_model=list[ActivoRead],
    summary="Listar activos (oculta los dados de baja)",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def listar_activos(
    activos: ActivoRepo,
    texto: Annotated[str | None, Query()] = None,
    categoria: Annotated[CategoriaActivo | None, Query()] = None,
    estado: Annotated[EstadoActivo | None, Query()] = None,
    sede_id: Annotated[int | None, Query()] = None,
    asignado_a_usuario_id: Annotated[int | None, Query()] = None,
) -> list[ActivoRead]:
    filtro = FiltroActivos(
        texto=texto,
        categoria=categoria,
        estado=estado,
        sede_id=sede_id,
        asignado_a_usuario_id=asignado_a_usuario_id,
    )
    return [ActivoRead.model_validate(a) for a in ListarActivos(activos).ejecutar(filtro)]


@router.get(
    "/bajas",
    response_model=list[ActivoRead],
    summary="Listar activos dados de baja (vista Bajas y retiros)",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def listar_bajas(activos: ActivoRepo) -> list[ActivoRead]:
    filtro = FiltroActivos(estado=EstadoActivo.DADO_DE_BAJA)
    return [ActivoRead.model_validate(a) for a in ListarActivos(activos).ejecutar(filtro)]


@router.get(
    "/plantilla",
    summary="Descargar plantilla Excel para carga masiva",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def descargar_plantilla() -> Response:
    return Response(
        content=generar_plantilla(),
        media_type=_EXCEL_MEDIA,
        headers={"Content-Disposition": "attachment; filename=plantilla_activos.xlsx"},
    )


@router.get(
    "/exportar",
    summary="Exportar el inventario a Excel",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def exportar_activos(
    activos: ActivoRepo,
    sedes: SedeRepo,
    areas: ServicioRepo,
    proveedores: ProveedorRepo,
) -> Response:
    datos = ListarActivos(activos).ejecutar(FiltroActivos())
    filas = filas_para_export(datos, sedes, areas, proveedores)
    return Response(
        content=generar_export(filas),
        media_type=_EXCEL_MEDIA,
        headers={"Content-Disposition": "attachment; filename=inventario_activos.xlsx"},
    )


@router.post(
    "/importar",
    response_model=ImportacionResultado,
    summary="Carga masiva de activos desde Excel",
    dependencies=[Depends(require_permiso("sistemas:crear"))],
)
def importar_activos(
    activos: ActivoRepo,
    sedes: SedeRepo,
    areas: ServicioRepo,
    proveedores: ProveedorRepo,
    usuarios: UsuarioRepo,
    archivo: Annotated[UploadFile, File(description="Archivo .xlsx")],
) -> ImportacionResultado:
    contenido = archivo.file.read()
    filas = parse_activos(contenido)
    resultado = ImportarActivos(activos, sedes, areas, proveedores, usuarios).ejecutar(filas)
    return ImportacionResultado.model_validate(resultado)


@router.get(
    "/actas",
    response_model=list[ActaListItem],
    summary="Listar todas las actas generadas",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def listar_actas(documentos: DocumentoActivoRepo) -> list[ActaListItem]:
    return [
        ActaListItem(
            id=doc.id,
            activo_id=doc.activo_id,
            activo_codigo=codigo,
            activo_nombre=nombre,
            tipo=doc.tipo,
            nombre_archivo=doc.nombre_archivo,
            descripcion=doc.descripcion,
            usuario=doc.usuario,
            created_at=doc.created_at,
        )
        for doc, codigo, nombre in documentos.listar_actas()
    ]


@router.get(
    "/mantenimientos",
    response_model=list[MantenimientoListItem],
    summary="Listar todos los mantenimientos (bitácora global)",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def listar_mantenimientos_global(
    mantenimientos: MantenimientoActivoRepo,
) -> list[MantenimientoListItem]:
    return [
        MantenimientoListItem(
            id=m.id,
            activo_id=m.activo_id,
            tipo=m.tipo,
            fecha=m.fecha,
            responsable=m.responsable,
            descripcion=m.descripcion,
            created_at=m.created_at,
            activo_codigo=codigo,
            activo_nombre=nombre,
        )
        for m, codigo, nombre in mantenimientos.listar_todos()
    ]


@router.get(
    "/{activo_id}",
    response_model=ActivoRead,
    summary="Ver un activo",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def obtener_activo(activo_id: int, activos: ActivoRepo) -> ActivoRead:
    return ActivoRead.model_validate(ObtenerActivo(activos).ejecutar(activo_id))


@router.post(
    "",
    response_model=ActivoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar activo",
    dependencies=[Depends(require_permiso("sistemas:crear"))],
)
def crear_activo(
    datos: ActivoCreate,
    activos: ActivoRepo,
    sedes: SedeRepo,
    areas: ServicioRepo,
    proveedores: ProveedorRepo,
    usuarios: UsuarioRepo,
) -> ActivoRead:
    creado = CrearActivo(activos, sedes, areas, proveedores, usuarios).ejecutar(
        DatosActivo(**datos.model_dump())
    )
    return ActivoRead.model_validate(creado)


@router.put(
    "/{activo_id}",
    response_model=ActivoRead,
    summary="Editar activo",
    dependencies=[Depends(require_permiso("sistemas:editar"))],
)
def actualizar_activo(
    activo_id: int,
    datos: ActivoUpdate,
    activos: ActivoRepo,
    sedes: SedeRepo,
    areas: ServicioRepo,
    proveedores: ProveedorRepo,
    usuarios: UsuarioRepo,
) -> ActivoRead:
    actualizado = ActualizarActivo(
        activos, sedes, areas, proveedores, usuarios
    ).ejecutar(activo_id, DatosActivo(**datos.model_dump()))
    return ActivoRead.model_validate(actualizado)


@router.post(
    "/{activo_id}/baja",
    response_model=ActivoRead,
    summary="Dar de baja un activo",
    dependencies=[Depends(require_permiso("sistemas:editar"))],
)
def dar_de_baja(activo_id: int, datos: ActivoBaja, activos: ActivoRepo) -> ActivoRead:
    actualizado = DarDeBajaActivo(activos).ejecutar(
        activo_id, DatosBaja(**datos.model_dump())
    )
    return ActivoRead.model_validate(actualizado)


@router.delete(
    "/{activo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar activo (definitivo)",
    dependencies=[Depends(require_permiso("sistemas:eliminar"))],
)
def eliminar_activo(activo_id: int, activos: ActivoRepo) -> None:
    EliminarActivo(activos).ejecutar(activo_id)


# ============================================================================
# DOCUMENTOS ADJUNTOS
# ============================================================================


def _dir_activo(activo_id: int, tipo: str) -> Path:
    directorio = _DOCS_DIR / f"activo_{activo_id}" / tipo
    directorio.mkdir(parents=True, exist_ok=True)
    return directorio


@router.post(
    "/{activo_id}/documentos",
    response_model=DocumentoActivoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Subir un documento del activo",
    dependencies=[Depends(require_permiso("sistemas:editar"))],
)
def subir_documento(
    activo_id: int,
    activos: ActivoRepo,
    documentos: DocumentoActivoRepo,
    usuario: CurrentUser,
    tipo: Annotated[str, Query(description="factura | garantia | acta | manual | otro")],
    archivo: Annotated[UploadFile, File()],
    descripcion: Annotated[str | None, Query(max_length=500)] = None,
) -> DocumentoActivoRead:
    if activos.obtener_por_id(activo_id) is None:
        raise HTTPException(status_code=404, detail=f"El activo {activo_id} no existe.")
    if tipo not in _TIPOS_DOC:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo no válido. Usa uno de: {', '.join(sorted(_TIPOS_DOC))}.",
        )
    contenido = archivo.file.read()
    if len(contenido) > _DOCS_MAX_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"El archivo supera el máximo de {_DOCS_MAX_BYTES // 1024 // 1024} MB.",
        )
    directorio = _dir_activo(activo_id, tipo)
    nombre = archivo.filename or "documento"
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
    doc = documentos.crear(
        activo_id=activo_id,
        tipo=tipo,
        nombre_archivo=nombre,
        ruta_archivo=str(ruta),
        tamano_bytes=len(contenido),
        mime_type=archivo.content_type or "application/octet-stream",
        usuario_id=usuario.id,
        descripcion=descripcion,
    )
    return DocumentoActivoRead.model_validate(doc)


@router.get(
    "/{activo_id}/documentos",
    response_model=list[DocumentoActivoRead],
    summary="Listar documentos del activo",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def listar_documentos(
    activo_id: int, activos: ActivoRepo, documentos: DocumentoActivoRepo
) -> list[DocumentoActivoRead]:
    if activos.obtener_por_id(activo_id) is None:
        raise HTTPException(status_code=404, detail=f"El activo {activo_id} no existe.")
    return [
        DocumentoActivoRead.model_validate(d)
        for d in documentos.listar_por_activo(activo_id)
    ]


@router.get(
    "/{activo_id}/documentos/{documento_id}",
    summary="Descargar un documento",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def descargar_documento(
    activo_id: int, documento_id: int, documentos: DocumentoActivoRepo
) -> Response:
    doc = documentos.obtener_por_id_y_activo(documento_id, activo_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="El documento no existe.")
    ruta = Path(doc.ruta_archivo)
    if not ruta.exists():
        raise HTTPException(status_code=404, detail="El archivo no está en el servidor.")
    with open(ruta, "rb") as f:
        contenido = f.read()
    return Response(
        content=contenido,
        media_type=doc.mime_type,
        headers={"Content-Disposition": f"attachment; filename={doc.nombre_archivo}"},
    )


@router.delete(
    "/{activo_id}/documentos/{documento_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un documento",
    dependencies=[Depends(require_permiso("sistemas:editar"))],
)
def eliminar_documento(
    activo_id: int, documento_id: int, documentos: DocumentoActivoRepo
) -> None:
    doc = documentos.obtener_por_id_y_activo(documento_id, activo_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="El documento no existe.")
    ruta = Path(doc.ruta_archivo)
    if ruta.exists():
        try:
            ruta.unlink()
        except OSError:
            pass
    documentos.eliminar(documento_id, activo_id)


# ============================================================================
# MOVIMIENTOS / HISTORIAL (traslados y reasignaciones)
# ============================================================================


def _mapas_nombres(sedes: SedeRepo, areas: ServicioRepo, usuarios: UsuarioRepo):
    return (
        {s.id: s.nombre for s in sedes.listar()},
        {a.id: a.nombre for a in areas.listar()},
        {u.id: u.nombre for u in usuarios.listar()},
    )


def _enriquecer_mov(mov, sede_map, area_map, user_map) -> MovimientoActivoRead:
    r = MovimientoActivoRead.model_validate(mov)
    r.sede_origen_nombre = sede_map.get(mov.sede_origen_id)
    r.area_origen_nombre = area_map.get(mov.area_origen_id)
    r.sede_destino_nombre = sede_map.get(mov.sede_destino_id)
    r.area_destino_nombre = area_map.get(mov.area_destino_id)
    # El responsable se guarda como texto; para registros antiguos se resuelve por id.
    r.usuario_origen_nombre = mov.usuario_origen_nombre or user_map.get(mov.usuario_origen_id)
    r.usuario_destino_nombre = mov.usuario_destino_nombre or user_map.get(mov.usuario_destino_id)
    return r


@router.post(
    "/{activo_id}/movimientos",
    response_model=MovimientoActivoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar traslado / reasignación del activo",
    dependencies=[Depends(require_permiso("sistemas:editar"))],
)
def registrar_movimiento(
    activo_id: int,
    datos: MovimientoActivoCreate,
    activos: ActivoRepo,
    movimientos: MovimientoActivoRepo,
    sedes: SedeRepo,
    areas: ServicioRepo,
    usuarios: UsuarioRepo,
) -> MovimientoActivoRead:
    activo = activos.obtener_por_id(activo_id)
    if activo is None:
        raise HTTPException(status_code=404, detail=f"El activo {activo_id} no existe.")
    if datos.sede_destino_id and sedes.obtener_por_id(datos.sede_destino_id) is None:
        raise HTTPException(status_code=400, detail="La sede destino no existe.")
    if datos.area_destino_id and areas.obtener_por_id(datos.area_destino_id) is None:
        raise HTTPException(status_code=400, detail="El área destino no existe.")

    destino_nombre = (datos.usuario_destino_nombre or "").strip() or None
    mov = movimientos.registrar_movimiento(
        activo_id=activo_id,
        sede_origen_id=activo.sede_id,
        area_origen_id=activo.area_id,
        sede_destino_id=datos.sede_destino_id,
        area_destino_id=datos.area_destino_id,
        usuario_origen_nombre=activo.asignado_a_nombre,
        usuario_destino_nombre=destino_nombre,
        motivo=datos.motivo,
        responsable=datos.responsable,
    )
    # Actualiza la ubicación/asignación actual del activo.
    activo.sede_id = datos.sede_destino_id
    activo.area_id = datos.area_destino_id
    activo.asignado_a_nombre = destino_nombre
    activos.actualizar(activo_id, activo)

    sede_map, area_map, user_map = _mapas_nombres(sedes, areas, usuarios)
    return _enriquecer_mov(mov, sede_map, area_map, user_map)


@router.post(
    "/{activo_id}/acta-asignacion/preview",
    summary="Previsualizar el acta de asignación (PDF, sin guardar)",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def preview_acta_asignacion(
    activo_id: int, datos: ActaAsignacionDatos, activos: ActivoRepo
) -> Response:
    activo = activos.obtener_por_id(activo_id)
    if activo is None:
        raise HTTPException(status_code=404, detail=f"El activo {activo_id} no existe.")
    pdf = generar_acta_asignacion(activo, datos)
    return Response(content=pdf, media_type="application/pdf")


@router.post(
    "/{activo_id}/acta-asignacion",
    response_model=DocumentoActivoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Generar y guardar el acta de asignación en los documentos del activo",
    dependencies=[Depends(require_permiso("sistemas:editar"))],
)
def guardar_acta_asignacion(
    activo_id: int,
    datos: ActaAsignacionDatos,
    activos: ActivoRepo,
    documentos: DocumentoActivoRepo,
    usuario: CurrentUser,
) -> DocumentoActivoRead:
    activo = activos.obtener_por_id(activo_id)
    if activo is None:
        raise HTTPException(status_code=404, detail=f"El activo {activo_id} no existe.")
    pdf = generar_acta_asignacion(activo, datos)
    directorio = _dir_activo(activo_id, "acta")
    nombre = f"acta_asignacion_{activo.codigo_interno}.pdf"
    ruta = directorio / nombre
    if ruta.exists():
        base, ext = os.path.splitext(nombre)
        contador = 1
        while ruta.exists():
            nombre = f"{base}_{contador}{ext}"
            ruta = directorio / nombre
            contador += 1
    with open(ruta, "wb") as f:
        f.write(pdf)
    doc = documentos.crear(
        activo_id=activo_id,
        tipo="acta",
        nombre_archivo=nombre,
        ruta_archivo=str(ruta),
        tamano_bytes=len(pdf),
        mime_type="application/pdf",
        usuario_id=usuario.id,
        descripcion="Acta de asignación",
    )
    return DocumentoActivoRead.model_validate(doc)


@router.get(
    "/{activo_id}/movimientos",
    response_model=list[MovimientoActivoRead],
    summary="Historial de movimientos del activo",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def historial_movimientos(
    activo_id: int,
    activos: ActivoRepo,
    movimientos: MovimientoActivoRepo,
    sedes: SedeRepo,
    areas: ServicioRepo,
    usuarios: UsuarioRepo,
) -> list[MovimientoActivoRead]:
    if activos.obtener_por_id(activo_id) is None:
        raise HTTPException(status_code=404, detail=f"El activo {activo_id} no existe.")
    sede_map, area_map, user_map = _mapas_nombres(sedes, areas, usuarios)
    return [
        _enriquecer_mov(m, sede_map, area_map, user_map)
        for m in movimientos.obtener_historial(activo_id)
    ]


# ============================================================================
# MANTENIMIENTOS (bitácora por activo) + HOJA DE VIDA
# ============================================================================


@router.get(
    "/{activo_id}/mantenimientos",
    response_model=list[MantenimientoRead],
    summary="Bitácora de mantenimientos del activo",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def listar_mantenimientos(
    activo_id: int, activos: ActivoRepo, mantenimientos: MantenimientoActivoRepo
) -> list[MantenimientoRead]:
    if activos.obtener_por_id(activo_id) is None:
        raise HTTPException(status_code=404, detail=f"El activo {activo_id} no existe.")
    return [
        MantenimientoRead.model_validate(m)
        for m in mantenimientos.listar_por_activo(activo_id)
    ]


@router.post(
    "/{activo_id}/mantenimientos",
    response_model=MantenimientoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un mantenimiento en la bitácora del activo",
    dependencies=[Depends(require_permiso("sistemas:editar"))],
)
def registrar_mantenimiento(
    activo_id: int,
    datos: MantenimientoCreate,
    activos: ActivoRepo,
    mantenimientos: MantenimientoActivoRepo,
) -> MantenimientoRead:
    if activos.obtener_por_id(activo_id) is None:
        raise HTTPException(status_code=404, detail=f"El activo {activo_id} no existe.")
    m = mantenimientos.crear(
        activo_id=activo_id,
        tipo=datos.tipo.value,
        fecha=datos.fecha,
        responsable=datos.responsable,
        descripcion=datos.descripcion,
    )
    return MantenimientoRead.model_validate(m)


@router.delete(
    "/{activo_id}/mantenimientos/{mantenimiento_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un mantenimiento",
    dependencies=[Depends(require_permiso("sistemas:editar"))],
)
def eliminar_mantenimiento(
    activo_id: int, mantenimiento_id: int, mantenimientos: MantenimientoActivoRepo
) -> None:
    mantenimientos.eliminar(mantenimiento_id, activo_id)


def _nombre_opt(repo, oid: int | None) -> str | None:
    if not oid:
        return None
    x = repo.obtener_por_id(oid)
    return x.nombre if x else None


def _construir_hoja_vida(activo, mants, sedes, areas, proveedores, usuarios) -> bytes:
    return generar_hoja_vida(
        activo,
        mants,
        sede_nombre=_nombre_opt(sedes, activo.sede_id),
        area_nombre=_nombre_opt(areas, activo.area_id),
        proveedor_nombre=_nombre_opt(proveedores, activo.proveedor_id),
        responsable_nombre=_nombre_opt(usuarios, activo.asignado_a_usuario_id),
    )


@router.get(
    "/{activo_id}/hoja-vida/preview",
    summary="Previsualizar la Hoja de Vida del equipo (PDF)",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def preview_hoja_vida(
    activo_id: int,
    activos: ActivoRepo,
    mantenimientos: MantenimientoActivoRepo,
    sedes: SedeRepo,
    areas: ServicioRepo,
    proveedores: ProveedorRepo,
    usuarios: UsuarioRepo,
) -> Response:
    activo = activos.obtener_por_id(activo_id)
    if activo is None:
        raise HTTPException(status_code=404, detail=f"El activo {activo_id} no existe.")
    mants = mantenimientos.listar_por_activo(activo_id)
    pdf = _construir_hoja_vida(activo, mants, sedes, areas, proveedores, usuarios)
    return Response(content=pdf, media_type="application/pdf")


@router.post(
    "/{activo_id}/hoja-vida",
    response_model=DocumentoActivoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Generar y guardar la Hoja de Vida en los documentos del activo",
    dependencies=[Depends(require_permiso("sistemas:editar"))],
)
def guardar_hoja_vida(
    activo_id: int,
    activos: ActivoRepo,
    mantenimientos: MantenimientoActivoRepo,
    documentos: DocumentoActivoRepo,
    usuario: CurrentUser,
    sedes: SedeRepo,
    areas: ServicioRepo,
    proveedores: ProveedorRepo,
    usuarios: UsuarioRepo,
) -> DocumentoActivoRead:
    activo = activos.obtener_por_id(activo_id)
    if activo is None:
        raise HTTPException(status_code=404, detail=f"El activo {activo_id} no existe.")
    mants = mantenimientos.listar_por_activo(activo_id)
    pdf = _construir_hoja_vida(activo, mants, sedes, areas, proveedores, usuarios)
    directorio = _dir_activo(activo_id, "hoja_vida")
    nombre = f"hoja_vida_{activo.codigo_interno}.pdf"
    ruta = directorio / nombre
    if ruta.exists():
        base, ext = os.path.splitext(nombre)
        contador = 1
        while ruta.exists():
            nombre = f"{base}_{contador}{ext}"
            ruta = directorio / nombre
            contador += 1
    with open(ruta, "wb") as f:
        f.write(pdf)
    doc = documentos.crear(
        activo_id=activo_id,
        tipo="hoja_vida",
        nombre_archivo=nombre,
        ruta_archivo=str(ruta),
        tamano_bytes=len(pdf),
        mime_type="application/pdf",
        usuario_id=usuario.id,
        descripcion="Hoja de vida",
    )
    return DocumentoActivoRead.model_validate(doc)
