"""Router de gestión de servicios (RF-004 — Módulo Inventario)."""
from fastapi import APIRouter, Depends, status

from app.application.dto.servicios import DatosServicio
from app.application.use_cases.inventario.gestionar_servicios import (
    ActualizarServicio,
    CrearServicio,
    EliminarServicio,
    ListarServicios,
)
from app.presentation.api.deps import SedeRepo, ServicioRepo, require_permiso
from app.presentation.schemas.servicios import (
    ServicioCreate,
    ServicioRead,
    ServicioUpdate,
)

router = APIRouter(prefix="/servicios", tags=["Inventario · Servicios"])


@router.get(
    "",
    response_model=list[ServicioRead],
    summary="Listar servicios",
    dependencies=[Depends(require_permiso("inventario:ver"))],
)
def listar_servicios(servicios: ServicioRepo) -> list[ServicioRead]:
    return [
        ServicioRead.model_validate(s) for s in ListarServicios(servicios).ejecutar()
    ]


@router.post(
    "",
    response_model=ServicioRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear servicio",
    dependencies=[Depends(require_permiso("inventario:crear"))],
)
def crear_servicio(
    datos: ServicioCreate, servicios: ServicioRepo, sedes: SedeRepo
) -> ServicioRead:
    creado = CrearServicio(servicios, sedes).ejecutar(
        DatosServicio(nombre=datos.nombre, sede_id=datos.sede_id, activo=datos.activo)
    )
    return ServicioRead.model_validate(creado)


@router.put(
    "/{servicio_id}",
    response_model=ServicioRead,
    summary="Editar servicio",
    dependencies=[Depends(require_permiso("inventario:editar"))],
)
def actualizar_servicio(
    servicio_id: int, datos: ServicioUpdate, servicios: ServicioRepo, sedes: SedeRepo
) -> ServicioRead:
    actualizado = ActualizarServicio(servicios, sedes).ejecutar(
        servicio_id,
        DatosServicio(nombre=datos.nombre, sede_id=datos.sede_id, activo=datos.activo),
    )
    return ServicioRead.model_validate(actualizado)


@router.delete(
    "/{servicio_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar servicio (sin equipos asociados)",
    dependencies=[Depends(require_permiso("inventario:eliminar"))],
)
def eliminar_servicio(servicio_id: int, servicios: ServicioRepo) -> None:
    EliminarServicio(servicios).ejecutar(servicio_id)
