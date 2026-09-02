"""Router de gestión de sedes (RF-004 — Módulo Inventario)."""
from fastapi import APIRouter, Depends, status

from app.application.dto.sedes import DatosSede
from app.application.use_cases.inventario.gestionar_sedes import (
    ActualizarSede,
    CrearSede,
    EliminarSede,
    ListarSedes,
)
from app.presentation.api.deps import SedeRepo, require_permiso
from app.presentation.schemas.sedes import SedeCreate, SedeRead, SedeUpdate

router = APIRouter(prefix="/sedes", tags=["Inventario · Sedes"])


@router.get(
    "",
    response_model=list[SedeRead],
    summary="Listar sedes",
    dependencies=[Depends(require_permiso("inventario:ver"))],
)
def listar_sedes(sedes: SedeRepo) -> list[SedeRead]:
    return [SedeRead.model_validate(s) for s in ListarSedes(sedes).ejecutar()]


@router.post(
    "",
    response_model=SedeRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear sede",
    dependencies=[Depends(require_permiso("inventario:crear"))],
)
def crear_sede(datos: SedeCreate, sedes: SedeRepo) -> SedeRead:
    creada = CrearSede(sedes).ejecutar(
        DatosSede(
            nombre=datos.nombre,
            direccion=datos.direccion,
            ciudad=datos.ciudad,
            activo=datos.activo,
        )
    )
    return SedeRead.model_validate(creada)


@router.put(
    "/{sede_id}",
    response_model=SedeRead,
    summary="Editar sede",
    dependencies=[Depends(require_permiso("inventario:editar"))],
)
def actualizar_sede(sede_id: int, datos: SedeUpdate, sedes: SedeRepo) -> SedeRead:
    actualizada = ActualizarSede(sedes).ejecutar(
        sede_id,
        DatosSede(
            nombre=datos.nombre,
            direccion=datos.direccion,
            ciudad=datos.ciudad,
            activo=datos.activo,
        ),
    )
    return SedeRead.model_validate(actualizada)


@router.delete(
    "/{sede_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar sede (sin servicios ni equipos asociados)",
    dependencies=[Depends(require_permiso("inventario:eliminar"))],
)
def eliminar_sede(sede_id: int, sedes: SedeRepo) -> None:
    EliminarSede(sedes).ejecutar(sede_id)
