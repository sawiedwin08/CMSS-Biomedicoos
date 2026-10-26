"""Router de gestión de representantes (maestro del Módulo Biomédico)."""
from fastapi import APIRouter, Depends, status

from app.application.dto.representantes import DatosRepresentante
from app.application.use_cases.inventario.gestionar_representantes import (
    ActualizarRepresentante,
    CrearRepresentante,
    EliminarRepresentante,
    ListarRepresentantes,
)
from app.presentation.api.deps import RepresentanteRepo, require_permiso
from app.presentation.schemas.representantes import (
    RepresentanteCreate,
    RepresentanteRead,
    RepresentanteUpdate,
)

router = APIRouter(prefix="/representantes", tags=["Inventario · Representantes"])


def _dto(datos: RepresentanteCreate) -> DatosRepresentante:
    return DatosRepresentante(
        nombre=datos.nombre,
        pais=datos.pais,
        ciudad=datos.ciudad,
        direccion=datos.direccion,
        telefono=datos.telefono,
        correo=datos.correo,
        activo=datos.activo,
    )


@router.get(
    "",
    response_model=list[RepresentanteRead],
    summary="Listar representantes",
    dependencies=[Depends(require_permiso("inventario:ver"))],
)
def listar_representantes(
    representantes: RepresentanteRepo,
) -> list[RepresentanteRead]:
    return [
        RepresentanteRead.model_validate(r)
        for r in ListarRepresentantes(representantes).ejecutar()
    ]


@router.post(
    "",
    response_model=RepresentanteRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear representante",
    dependencies=[Depends(require_permiso("inventario:crear"))],
)
def crear_representante(
    datos: RepresentanteCreate, representantes: RepresentanteRepo
) -> RepresentanteRead:
    creado = CrearRepresentante(representantes).ejecutar(_dto(datos))
    return RepresentanteRead.model_validate(creado)


@router.put(
    "/{representante_id}",
    response_model=RepresentanteRead,
    summary="Editar representante",
    dependencies=[Depends(require_permiso("inventario:editar"))],
)
def actualizar_representante(
    representante_id: int, datos: RepresentanteUpdate, representantes: RepresentanteRepo
) -> RepresentanteRead:
    actualizado = ActualizarRepresentante(representantes).ejecutar(
        representante_id, _dto(datos)
    )
    return RepresentanteRead.model_validate(actualizado)


@router.delete(
    "/{representante_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar representante",
    dependencies=[Depends(require_permiso("inventario:eliminar"))],
)
def eliminar_representante(
    representante_id: int, representantes: RepresentanteRepo
) -> None:
    EliminarRepresentante(representantes).ejecutar(representante_id)
