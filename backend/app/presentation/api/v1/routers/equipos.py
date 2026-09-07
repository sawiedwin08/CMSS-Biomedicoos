"""Router de gestión de equipos — núcleo del Inventario (RF-001..007)."""
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response

from app.core.config import settings
from app.application.dto.equipos import DatosEquipo, FiltroEquipos
from app.application.use_cases.inventario.gestionar_equipos import (
    ActualizarEquipo,
    CrearEquipo,
    EliminarEquipo,
    ListarEquipos,
    ObtenerEquipo,
)
from app.application.use_cases.inventario.importar_equipos import ImportarEquipos
from app.domain.enums.clasificacion_riesgo import ClasificacionRiesgo
from app.domain.enums.estado_equipo import EstadoEquipo
from app.domain.enums.propiedad import Propiedad
from app.infrastructure.services.excel_equipos import generar_plantilla, parse_equipos
from app.presentation.api.deps import (
    EquipoRepo,
    ProveedorRepo,
    SedeRepo,
    ServicioRepo,
    require_permiso,
)
from app.presentation.schemas.equipos import (
    EquipoCreate,
    EquipoRead,
    EquipoUpdate,
    ImportacionResultado,
)
from app.presentation.schemas.documento_equipo import (
    DocumentoEquipoRead,
    DocumentoEquipoCreate,
)
from app.presentation.schemas.movimiento_equipo import (
    MovimientoEquipoCreate,
    MovimientoEquipoRead,
)
from app.presentation.api.deps import DocumentoEquipoRepo, CurrentUser, MovimientoEquipoRepo

_EXCEL_MEDIA = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

router = APIRouter(prefix="/equipos", tags=["Inventario · Equipos"])


def _dto(datos: EquipoCreate) -> DatosEquipo:
    return DatosEquipo(**datos.model_dump())


@router.get(
    "",
    response_model=list[EquipoRead],
    summary="Listar equipos (con búsqueda y filtros)",
    dependencies=[Depends(require_permiso("inventario:ver"))],
)
def listar_equipos(
    equipos: EquipoRepo,
    texto: Annotated[str | None, Query(description="Busca en nombre, código, serial o marca")] = None,
    sede_id: int | None = None,
    servicio_id: int | None = None,
    estado: EstadoEquipo | None = None,
    propiedad: Propiedad | None = None,
    clasificacion_riesgo: ClasificacionRiesgo | None = None,
) -> list[EquipoRead]:
    filtro = FiltroEquipos(
        texto=texto,
        sede_id=sede_id,
        servicio_id=servicio_id,
        estado=estado,
        propiedad=propiedad,
        clasificacion_riesgo=clasificacion_riesgo,
    )
    return [EquipoRead.model_validate(e) for e in ListarEquipos(equipos).ejecutar(filtro)]


@router.get(
    "/plantilla",
    summary="Descargar plantilla Excel para carga masiva",
    dependencies=[Depends(require_permiso("inventario:crear"))],
)
def descargar_plantilla() -> Response:
    return Response(
        content=generar_plantilla(),
        media_type=_EXCEL_MEDIA,
        headers={
            "Content-Disposition": "attachment; filename=plantilla_equipos.xlsx"
        },
    )


@router.post(
    "/importar",
    response_model=ImportacionResultado,
    summary="Carga masiva de equipos desde Excel (RF-008)",
    dependencies=[Depends(require_permiso("inventario:crear"))],
)
def importar_equipos(
    equipos: EquipoRepo,
    sedes: SedeRepo,
    servicios: ServicioRepo,
    proveedores: ProveedorRepo,
    archivo: Annotated[UploadFile, File(description="Archivo .xlsx")],
) -> ImportacionResultado:
    contenido = archivo.file.read()
    filas = parse_equipos(contenido)
    resultado = ImportarEquipos(equipos, sedes, servicios, proveedores).ejecutar(filas)
    return ImportacionResultado.model_validate(resultado)


@router.get(
    "/{equipo_id}",
    response_model=EquipoRead,
    summary="Obtener un equipo",
    dependencies=[Depends(require_permiso("inventario:ver"))],
)
def obtener_equipo(equipo_id: int, equipos: EquipoRepo) -> EquipoRead:
    return EquipoRead.model_validate(ObtenerEquipo(equipos).ejecutar(equipo_id))


@router.post(
    "",
    response_model=EquipoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar equipo",
    dependencies=[Depends(require_permiso("inventario:crear"))],
)
def crear_equipo(
    datos: EquipoCreate,
    equipos: EquipoRepo,
    sedes: SedeRepo,
    servicios: ServicioRepo,
    proveedores: ProveedorRepo,
) -> EquipoRead:
    creado = CrearEquipo(equipos, sedes, servicios, proveedores).ejecutar(_dto(datos))
    return EquipoRead.model_validate(creado)


@router.put(
    "/{equipo_id}",
    response_model=EquipoRead,
    summary="Editar equipo",
    dependencies=[Depends(require_permiso("inventario:editar"))],
)
def actualizar_equipo(
    equipo_id: int,
    datos: EquipoUpdate,
    equipos: EquipoRepo,
    sedes: SedeRepo,
    servicios: ServicioRepo,
    proveedores: ProveedorRepo,
) -> EquipoRead:
    actualizado = ActualizarEquipo(equipos, sedes, servicios, proveedores).ejecutar(
        equipo_id, _dto(datos)
    )
    return EquipoRead.model_validate(actualizado)


@router.delete(
    "/{equipo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar equipo",
    dependencies=[Depends(require_permiso("inventario:eliminar"))],
)
def eliminar_equipo(equipo_id: int, equipos: EquipoRepo) -> None:
    EliminarEquipo(equipos).ejecutar(equipo_id)


_IMAGENES_OK = {"image/jpeg", "image/png", "image/webp"}
_FOTO_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post(
    "/{equipo_id}/foto",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Subir/actualizar la foto del equipo",
    dependencies=[Depends(require_permiso("inventario:editar"))],
)
def subir_foto(
    equipo_id: int,
    equipos: EquipoRepo,
    archivo: Annotated[UploadFile, File(description="Imagen JPG, PNG o WEBP")],
) -> None:
    if archivo.content_type not in _IMAGENES_OK:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato no válido. Usa JPG, PNG o WEBP.",
        )
    contenido = archivo.file.read()
    if len(contenido) > _FOTO_MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen supera el máximo de 5 MB.",
        )
    equipos.guardar_foto(equipo_id, contenido, archivo.content_type)


@router.get(
    "/{equipo_id}/foto",
    summary="Obtener la foto del equipo",
    dependencies=[Depends(require_permiso("inventario:ver"))],
)
def obtener_foto(equipo_id: int, equipos: EquipoRepo) -> Response:
    resultado = equipos.obtener_foto(equipo_id)
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="El equipo no tiene foto."
        )
    contenido, mime = resultado
    return Response(content=contenido, media_type=mime)


@router.delete(
    "/{equipo_id}/foto",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar la foto del equipo",
    dependencies=[Depends(require_permiso("inventario:editar"))],
)
def eliminar_foto(equipo_id: int, equipos: EquipoRepo) -> None:
    equipos.eliminar_foto(equipo_id)


# ==================== DOCUMENTOS DEL EQUIPO ====================

from pathlib import Path
import os
import zipfile
import io

_DOCS_MAX_BYTES = 50 * 1024 * 1024  # 50 MB
_TIPOS_PERMITIDOS = {
    "manual", "plano", "calibracion", "hoja_de_vida",
    "mantenimientos_preventivos", "correctivo", "reportes",
    "invima", "factura", "importacion", "ficha_tecnica", "guia_rapida", "otros"
}
_DOCS_DIR = Path(settings.STORAGE_DIR) / "documentos"


def _asegurar_directorio_equipo(equipo_id: int, tipo: str, year: int | None = None) -> Path:
    """Crear el directorio para documentos del equipo si no existe."""
    print(f"_asegurar_directorio: equipo_id={equipo_id}, tipo={tipo}, year={year}")
    if year:
        # Documentos de mantenimiento: equipo_{id}/mantenimiento/{año}/{tipo}
        directorio = _DOCS_DIR / f"equipo_{equipo_id}" / "mantenimiento" / str(year) / tipo
    else:
        # Documentación general: equipo_{id}/documentacion/{tipo}
        directorio = _DOCS_DIR / f"equipo_{equipo_id}" / "documentacion" / tipo
    print(f"Directorio creado: {directorio}")
    directorio.mkdir(parents=True, exist_ok=True)
    return directorio


@router.post(
    "/{equipo_id}/documentos",
    response_model=DocumentoEquipoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Subir un documento para el equipo",
    dependencies=[Depends(require_permiso("inventario:editar"))],
)
def subir_documento(
    equipo_id: int,
    equipos: EquipoRepo,
    documentos: DocumentoEquipoRepo,
    usuario: CurrentUser,
    tipo: Annotated[str, Query(description="manual | plano | calibracion | recomendacion")],
    archivo: Annotated[UploadFile, File()],
    descripcion: Annotated[str | None, Query(max_length=500)] = None,
    year: Annotated[int | None, Query(description="Año del documento", ge=1900, le=2100)] = None,
) -> DocumentoEquipoRead:
    """Subir un documento (manual, plano, calibración, recomendación)."""
    print(f"POST /documentos: equipo_id={equipo_id}, tipo={tipo}, archivo={archivo.filename}, usuario={usuario.id}, year={year}")
    # Validar equipo existe
    if equipos.obtener_por_id(equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo {equipo_id} no existe.",
        )

    # Validar tipo
    if tipo not in _TIPOS_PERMITIDOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de documento no válido. Usa uno de: {', '.join(_TIPOS_PERMITIDOS)}",
        )

    # Validar tamaño
    contenido = archivo.file.read()
    if len(contenido) > _DOCS_MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El archivo supera el máximo de {_DOCS_MAX_BYTES / 1024 / 1024:.0f} MB.",
        )

    # Guardar archivo
    directorio = _asegurar_directorio_equipo(equipo_id, tipo, year)
    nombre_seguro = f"{archivo.filename}"
    ruta_archivo = directorio / nombre_seguro

    # Evitar sobrescrituras: agregar sufijo si existe
    if ruta_archivo.exists():
        base, ext = os.path.splitext(nombre_seguro)
        contador = 1
        while True:
            nombre_seguro = f"{base}_{contador}{ext}"
            ruta_archivo = directorio / nombre_seguro
            if not ruta_archivo.exists():
                break
            contador += 1

    with open(ruta_archivo, "wb") as f:
        f.write(contenido)

    # Guardar metadatos en BD
    documento = documentos.crear(
        equipo_id=equipo_id,
        tipo=tipo,
        nombre_archivo=archivo.filename or "documento",
        ruta_archivo=str(ruta_archivo),
        tamaño_bytes=len(contenido),
        mime_type=archivo.content_type or "application/octet-stream",
        usuario_id=usuario.id,
        descripcion=descripcion,
        año_documento=year,
    )

    return DocumentoEquipoRead.model_validate(documento)


@router.get(
    "/{equipo_id}/documentos",
    response_model=list[DocumentoEquipoRead],
    summary="Listar documentos del equipo",
    dependencies=[Depends(require_permiso("inventario:ver"))],
)
def listar_documentos(
    equipo_id: int,
    equipos: EquipoRepo,
    documentos: DocumentoEquipoRepo,
    tipo: Annotated[str | None, Query(description="Filtrar por tipo (opcional)")] = None,
) -> list[DocumentoEquipoRead]:
    """Listar documentos de un equipo, opcionalmente filtrados por tipo."""
    # Validar equipo existe
    if equipos.obtener_por_id(equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo {equipo_id} no existe.",
        )

    if tipo:
        modelos = documentos.listar_por_equipo_y_tipo(equipo_id, tipo)
    else:
        modelos = documentos.listar_por_equipo(equipo_id)

    return [DocumentoEquipoRead.model_validate(m) for m in modelos]


@router.get(
    "/{equipo_id}/documentos/descargar-todos",
    summary="Descargar todos los documentos en ZIP",
    dependencies=[Depends(require_permiso("inventario:ver"))],
)
def descargar_todos_documentos(
    equipo_id: int,
    equipos: EquipoRepo,
    documentos: DocumentoEquipoRepo,
) -> Response:
    """Descargar todos los documentos de un equipo en un archivo ZIP."""
    # Validar equipo existe
    equipo = equipos.obtener_por_id(equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo {equipo_id} no existe.",
        )

    # Obtener todos los documentos
    docs = documentos.listar_por_equipo(equipo_id)

    if not docs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El equipo no tiene documentos para descargar.",
        )

    # Crear ZIP en memoria
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for doc in docs:
            ruta = Path(doc.ruta_archivo)
            if ruta.exists():
                # Determinar la ruta dentro del ZIP
                if doc.año_documento:
                    ruta_zip = f"equipo_{equipo_id}/mantenimiento/{doc.año_documento}/{doc.tipo}/{doc.nombre_archivo}"
                else:
                    ruta_zip = f"equipo_{equipo_id}/documentacion/{doc.tipo}/{doc.nombre_archivo}"

                zip_file.write(ruta, ruta_zip)

    zip_buffer.seek(0)
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=equipo_{equipo_id}_documentos.zip"}
    )


@router.get(
    "/{equipo_id}/documentos/{documento_id}",
    summary="Descargar un documento",
    dependencies=[Depends(require_permiso("inventario:ver"))],
)
def descargar_documento(
    equipo_id: int,
    documento_id: int,
    equipos: EquipoRepo,
    documentos: DocumentoEquipoRepo,
) -> Response:
    """Descargar un documento específico."""
    # Validar equipo existe
    if equipos.obtener_por_id(equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo {equipo_id} no existe.",
        )

    # Obtener documento
    documento = documentos.obtener_por_id_y_equipo(documento_id, equipo_id)
    if documento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El documento no existe o no pertenece a este equipo.",
        )

    # Verificar archivo existe
    ruta = Path(documento.ruta_archivo)
    if not ruta.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El archivo no se encuentra en el servidor.",
        )

    # Retornar archivo
    with open(ruta, "rb") as f:
        contenido = f.read()

    return Response(
        content=contenido,
        media_type=documento.mime_type,
        headers={
            "Content-Disposition": f"attachment; filename={documento.nombre_archivo}"
        },
    )


@router.delete(
    "/{equipo_id}/documentos/{documento_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un documento",
    dependencies=[Depends(require_permiso("inventario:editar"))],
)
def eliminar_documento(
    equipo_id: int,
    documento_id: int,
    equipos: EquipoRepo,
    documentos: DocumentoEquipoRepo,
) -> None:
    """Eliminar un documento específico."""
    # Validar equipo existe
    if equipos.obtener_por_id(equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo {equipo_id} no existe.",
        )

    # Obtener documento
    documento = documentos.obtener_por_id_y_equipo(documento_id, equipo_id)
    if documento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El documento no existe o no pertenece a este equipo.",
        )

    # Eliminar archivo físico
    ruta = Path(documento.ruta_archivo)
    if ruta.exists():
        try:
            ruta.unlink()
        except OSError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo eliminar el archivo: {str(e)}",
            )

    # Eliminar registro de BD
    documentos.eliminar(documento_id, equipo_id)


# ============================================================================
# MOVIMIENTOS / TRAZABILIDAD DE UBICACIONES (RF-004)
# ============================================================================


@router.post(
    "/{equipo_id}/movimientos",
    response_model=MovimientoEquipoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar movimiento de ubicación",
    dependencies=[Depends(require_permiso("inventario:editar"))],
)
def registrar_movimiento(
    equipo_id: int,
    datos: MovimientoEquipoCreate,
    equipos: EquipoRepo,
    movimientos: MovimientoEquipoRepo,
    sedes: SedeRepo,
    servicios: ServicioRepo,
) -> MovimientoEquipoRead:
    """Registra un cambio de ubicación (sede/servicio) de un equipo.

    Cuando se actualiza sede_id o servicio_id en un equipo,
    se debe llamar a este endpoint para quedar registro en trazabilidad.
    """
    # Validar equipo existe
    equipo = equipos.obtener_por_id(equipo_id)
    if equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo {equipo_id} no existe.",
        )

    # Validar sedes/servicios si se proporcionan
    if datos.sede_destino_id and sedes.obtener_por_id(datos.sede_destino_id) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sede destino no existe.",
        )
    if datos.servicio_destino_id and servicios.obtener_por_id(datos.servicio_destino_id) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Servicio destino no existe.",
        )

    # Registrar movimiento
    movimiento = movimientos.registrar_movimiento(
        equipo_id=equipo_id,
        sede_origen_id=datos.sede_origen_id,
        servicio_origen_id=datos.servicio_origen_id,
        sede_destino_id=datos.sede_destino_id,
        servicio_destino_id=datos.servicio_destino_id,
        motivo=datos.motivo,
        responsable=datos.responsable,
    )

    # Enriquecer con nombres
    return _enriquecer_movimiento(movimiento, sedes, servicios)


@router.get(
    "/{equipo_id}/movimientos",
    response_model=list[MovimientoEquipoRead],
    summary="Obtener historial de movimientos",
    dependencies=[Depends(require_permiso("inventario:ver"))],
)
def obtener_historial_movimientos(
    equipo_id: int,
    equipos: EquipoRepo,
    movimientos: MovimientoEquipoRepo,
    sedes: SedeRepo,
    servicios: ServicioRepo,
) -> list[MovimientoEquipoRead]:
    """Obtiene el historial completo de cambios de ubicación de un equipo.

    Ordenado por fecha descendente (más reciente primero).
    """
    # Validar equipo existe
    if equipos.obtener_por_id(equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo {equipo_id} no existe.",
        )

    historial = movimientos.obtener_historial(equipo_id)
    return [_enriquecer_movimiento(m, sedes, servicios) for m in historial]


@router.delete(
    "/{equipo_id}/movimientos/{movimiento_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un movimiento",
    dependencies=[Depends(require_permiso("inventario:editar"))],
)
def eliminar_movimiento(
    equipo_id: int,
    movimiento_id: int,
    equipos: EquipoRepo,
    movimientos: MovimientoEquipoRepo,
) -> None:
    """Elimina un registro de movimiento (solo si no hay dependencias)."""
    # Validar equipo existe
    if equipos.obtener_por_id(equipo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo {equipo_id} no existe.",
        )

    # Validar movimiento existe y pertenece a este equipo
    movimiento = movimientos.obtener_movimiento_por_id(movimiento_id)
    if movimiento is None or movimiento.equipo_id != equipo_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El movimiento no existe o no pertenece a este equipo.",
        )

    movimientos.eliminar_movimiento(movimiento_id)


def _enriquecer_movimiento(
    movimiento,
    sedes: SedeRepo,
    servicios: ServicioRepo,
) -> MovimientoEquipoRead:
    """Enriquece un movimiento con los nombres de sedes/servicios."""
    sede_origen = sedes.obtener_por_id(movimiento.sede_origen_id) if movimiento.sede_origen_id else None
    servicio_origen = servicios.obtener_por_id(movimiento.servicio_origen_id) if movimiento.servicio_origen_id else None
    sede_destino = sedes.obtener_por_id(movimiento.sede_destino_id) if movimiento.sede_destino_id else None
    servicio_destino = servicios.obtener_por_id(movimiento.servicio_destino_id) if movimiento.servicio_destino_id else None

    return MovimientoEquipoRead(
        id=movimiento.id,
        equipo_id=movimiento.equipo_id,
        sede_origen_id=movimiento.sede_origen_id,
        servicio_origen_id=movimiento.servicio_origen_id,
        sede_destino_id=movimiento.sede_destino_id,
        servicio_destino_id=movimiento.servicio_destino_id,
        motivo=movimiento.motivo,
        responsable=movimiento.responsable,
        fecha_movimiento=movimiento.fecha_movimiento,
        sede_origen_nombre=sede_origen.nombre if sede_origen else None,
        servicio_origen_nombre=servicio_origen.nombre if servicio_origen else None,
        sede_destino_nombre=sede_destino.nombre if sede_destino else None,
        servicio_destino_nombre=servicio_destino.nombre if servicio_destino else None,
    )
