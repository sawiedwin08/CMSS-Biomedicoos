"""Router — Cuentas de correo (contraseñas cifradas)."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.presentation.api.deps import CuentaCorreoRepo, require_permiso
from app.presentation.schemas.cuenta_correo import (
    CuentaCorreoCreate,
    CuentaCorreoRead,
    CuentaCorreoUpdate,
    PasswordRevelado,
)

router = APIRouter(prefix="/sistemas/cuentas-correo", tags=["Sistemas · Cuentas de correo"])


@router.get(
    "",
    response_model=list[CuentaCorreoRead],
    summary="Listar cuentas de correo (sin contraseña)",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def listar_cuentas(cuentas: CuentaCorreoRepo) -> list[CuentaCorreoRead]:
    return [CuentaCorreoRead.model_validate(c) for c in cuentas.listar()]


@router.post(
    "",
    response_model=CuentaCorreoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar cuenta de correo",
    dependencies=[Depends(require_permiso("sistemas:crear"))],
)
def crear_cuenta(datos: CuentaCorreoCreate, cuentas: CuentaCorreoRepo) -> CuentaCorreoRead:
    d = datos.model_dump()
    contrasena = d.pop("contrasena")
    return CuentaCorreoRead.model_validate(cuentas.crear(d, contrasena))


@router.put(
    "/{cuenta_id}",
    response_model=CuentaCorreoRead,
    summary="Editar cuenta de correo",
    dependencies=[Depends(require_permiso("sistemas:editar"))],
)
def actualizar_cuenta(
    cuenta_id: int, datos: CuentaCorreoUpdate, cuentas: CuentaCorreoRepo
) -> CuentaCorreoRead:
    d = datos.model_dump()
    contrasena = d.pop("contrasena")
    return CuentaCorreoRead.model_validate(cuentas.actualizar(cuenta_id, d, contrasena))


@router.delete(
    "/{cuenta_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar cuenta de correo",
    dependencies=[Depends(require_permiso("sistemas:eliminar"))],
)
def eliminar_cuenta(cuenta_id: int, cuentas: CuentaCorreoRepo) -> None:
    cuentas.eliminar(cuenta_id)


@router.get(
    "/{cuenta_id}/password",
    response_model=PasswordRevelado,
    summary="Revelar la contraseña de una cuenta (requiere permiso)",
    dependencies=[Depends(require_permiso("sistemas:credenciales"))],
)
def ver_password(cuenta_id: int, cuentas: CuentaCorreoRepo) -> PasswordRevelado:
    cuenta = cuentas.obtener_por_id(cuenta_id)
    if cuenta is None:
        raise HTTPException(status_code=404, detail="La cuenta no existe.")
    return PasswordRevelado(password=cuentas.descifrar_password(cuenta))
