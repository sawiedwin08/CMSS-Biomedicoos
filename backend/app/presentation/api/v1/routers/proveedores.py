"""Router de gestión de proveedores (RF-005 — Módulo Inventario)."""
from fastapi import APIRouter, Depends, status

from app.application.dto.proveedores import DatosProveedor
from app.application.use_cases.inventario.gestionar_proveedores import (
    ActualizarProveedor,
    CrearProveedor,
    EliminarProveedor,
    ListarProveedores,
)
from app.presentation.api.deps import ProveedorRepo, require_permiso
from app.presentation.schemas.proveedores import (
    ProveedorCreate,
    ProveedorRead,
    ProveedorUpdate,
)

router = APIRouter(prefix="/proveedores", tags=["Inventario · Proveedores"])


def _dto(datos: ProveedorCreate) -> DatosProveedor:
    return DatosProveedor(
        nombre=datos.nombre,
        nit=datos.nit,
        contacto=datos.contacto,
        telefono=datos.telefono,
        email=datos.email,
        activo=datos.activo,
    )


@router.get(
    "",
    response_model=list[ProveedorRead],
    summary="Listar proveedores",
    dependencies=[Depends(require_permiso("inventario:ver"))],
)
def listar_proveedores(proveedores: ProveedorRepo) -> list[ProveedorRead]:
    return [
        ProveedorRead.model_validate(p)
        for p in ListarProveedores(proveedores).ejecutar()
    ]


@router.post(
    "",
    response_model=ProveedorRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear proveedor",
    dependencies=[Depends(require_permiso("inventario:crear"))],
)
def crear_proveedor(
    datos: ProveedorCreate, proveedores: ProveedorRepo
) -> ProveedorRead:
    creado = CrearProveedor(proveedores).ejecutar(_dto(datos))
    return ProveedorRead.model_validate(creado)


@router.put(
    "/{proveedor_id}",
    response_model=ProveedorRead,
    summary="Editar proveedor",
    dependencies=[Depends(require_permiso("inventario:editar"))],
)
def actualizar_proveedor(
    proveedor_id: int, datos: ProveedorUpdate, proveedores: ProveedorRepo
) -> ProveedorRead:
    actualizado = ActualizarProveedor(proveedores).ejecutar(proveedor_id, _dto(datos))
    return ProveedorRead.model_validate(actualizado)


@router.delete(
    "/{proveedor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar proveedor (sin equipos asociados)",
    dependencies=[Depends(require_permiso("inventario:eliminar"))],
)
def eliminar_proveedor(proveedor_id: int, proveedores: ProveedorRepo) -> None:
    EliminarProveedor(proveedores).ejecutar(proveedor_id)
