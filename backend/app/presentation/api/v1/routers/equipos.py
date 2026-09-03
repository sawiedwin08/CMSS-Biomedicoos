"""Router de gestión de equipos — núcleo del Inventario (RF-001..007)."""
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response

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
