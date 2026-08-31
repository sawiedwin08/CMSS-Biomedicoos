"""Router de gestión de usuarios (RF-028, RF-029)."""
from fastapi import APIRouter, Depends, status

from app.application.dto.usuarios import DatosActualizarUsuario, DatosNuevoUsuario
from app.application.use_cases.usuarios.actualizar_usuario import ActualizarUsuario
from app.application.use_cases.usuarios.asignar_rol import AsignarRolUsuario
from app.application.use_cases.usuarios.crear_usuario import CrearUsuario
from app.presentation.api.deps import (
    CurrentUser,
    Hasher,
    RolRepo,
    UsuarioRepo,
    require_permiso,
)
from app.presentation.schemas.usuarios import (
    AsignarRol,
    UsuarioCreate,
    UsuarioRead,
    UsuarioUpdate,
)

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/me", response_model=UsuarioRead, summary="Datos del usuario autenticado")
def usuario_actual(usuario: CurrentUser) -> UsuarioRead:
    return UsuarioRead.model_validate(usuario)


@router.get(
    "",
    response_model=list[UsuarioRead],
    summary="Listar usuarios",
    dependencies=[Depends(require_permiso("usuarios:ver"))],
)
def listar_usuarios(usuarios: UsuarioRepo) -> list[UsuarioRead]:
    return [UsuarioRead.model_validate(u) for u in usuarios.listar()]


@router.post(
    "",
    response_model=UsuarioRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear usuario",
    dependencies=[Depends(require_permiso("usuarios:crear"))],
)
def crear_usuario(
    datos: UsuarioCreate,
    usuarios: UsuarioRepo,
    roles: RolRepo,
    hasher: Hasher,
) -> UsuarioRead:
    caso_uso = CrearUsuario(usuarios, roles, hasher)
    creado = caso_uso.ejecutar(
        DatosNuevoUsuario(
            nombre=datos.nombre,
            email=datos.email,
            password=datos.password,
            rol_id=datos.rol_id,
        )
    )
    return UsuarioRead.model_validate(creado)


@router.put(
    "/{usuario_id}",
    response_model=UsuarioRead,
    summary="Editar un usuario (nombre, correo, rol, estado)",
    dependencies=[Depends(require_permiso("usuarios:editar"))],
)
def actualizar_usuario(
    usuario_id: int,
    datos: UsuarioUpdate,
    actor: CurrentUser,
    usuarios: UsuarioRepo,
    roles: RolRepo,
) -> UsuarioRead:
    caso_uso = ActualizarUsuario(usuarios, roles)
    actualizado = caso_uso.ejecutar(
        actor,
        usuario_id,
        DatosActualizarUsuario(
            nombre=datos.nombre,
            email=datos.email,
            rol_id=datos.rol_id,
            activo=datos.activo,
            es_protegido=datos.es_protegido,
        ),
    )
    return UsuarioRead.model_validate(actualizado)


@router.put(
    "/{usuario_id}/rol",
    response_model=UsuarioRead,
    summary="Asignar rol a un usuario",
    dependencies=[Depends(require_permiso("usuarios:editar"))],
)
def asignar_rol(
    usuario_id: int,
    datos: AsignarRol,
    actor: CurrentUser,
    usuarios: UsuarioRepo,
    roles: RolRepo,
) -> UsuarioRead:
    caso_uso = AsignarRolUsuario(usuarios, roles)
    actualizado = caso_uso.ejecutar(actor, usuario_id, datos.rol_id)
    return UsuarioRead.model_validate(actualizado)
