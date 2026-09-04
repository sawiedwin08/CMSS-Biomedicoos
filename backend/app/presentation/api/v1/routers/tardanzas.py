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
from app.presentation.api.deps import DepartmentRepo, require_permiso
from app.presentation.schemas.tardanzas import (
    DepartamentoCreate,
    DepartamentoRead,
    DepartamentoUpdate,
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
