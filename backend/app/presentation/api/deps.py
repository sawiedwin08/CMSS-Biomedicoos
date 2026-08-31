"""Inyección de dependencias de la API (composición de la app).

Aquí se conectan (wiring) los puertos con sus implementaciones concretas,
respetando la inversión de dependencias.
"""
from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.application.interfaces.security import PasswordHasher, TokenService
from app.core.config import settings
from app.domain.entities.usuario import Usuario
from app.domain.exceptions import CredencialesInvalidas
from app.domain.repositories.permiso_repository import PermisoRepository
from app.domain.repositories.rol_repository import RolRepository
from app.domain.repositories.usuario_repository import UsuarioRepository
from app.infrastructure.db.session import get_db
from app.infrastructure.repositories.permiso_repository_sqlalchemy import (
    PermisoRepositorySQLAlchemy,
)
from app.infrastructure.repositories.rol_repository_sqlalchemy import (
    RolRepositorySQLAlchemy,
)
from app.infrastructure.repositories.usuario_repository_sqlalchemy import (
    UsuarioRepositorySQLAlchemy,
)
from app.infrastructure.services.security import BcryptPasswordHasher, JwtTokenService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

DbSession = Annotated[Session, Depends(get_db)]


# --- Repositorios (puertos -> implementaciones concretas) ---
def get_usuario_repository(db: DbSession) -> UsuarioRepository:
    return UsuarioRepositorySQLAlchemy(db)


def get_rol_repository(db: DbSession) -> RolRepository:
    return RolRepositorySQLAlchemy(db)


def get_permiso_repository(db: DbSession) -> PermisoRepository:
    return PermisoRepositorySQLAlchemy(db)


# --- Servicios de seguridad ---
def get_password_hasher() -> PasswordHasher:
    return BcryptPasswordHasher()


def get_token_service() -> TokenService:
    return JwtTokenService()


UsuarioRepo = Annotated[UsuarioRepository, Depends(get_usuario_repository)]
RolRepo = Annotated[RolRepository, Depends(get_rol_repository)]
PermisoRepo = Annotated[PermisoRepository, Depends(get_permiso_repository)]
Hasher = Annotated[PasswordHasher, Depends(get_password_hasher)]
Tokens = Annotated[TokenService, Depends(get_token_service)]


# --- Usuario autenticado ---
def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    usuarios: UsuarioRepo,
    tokens: Tokens,
) -> Usuario:
    credenciales_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = tokens.decodificar(token)
    except CredencialesInvalidas as exc:
        raise credenciales_error from exc

    sub = payload.get("sub")
    if sub is None:
        raise credenciales_error

    usuario = usuarios.obtener_por_id(int(sub))
    if usuario is None or not usuario.activo:
        raise credenciales_error
    return usuario


CurrentUser = Annotated[Usuario, Depends(get_current_user)]


def require_permiso(codigo: str) -> Callable[[Usuario], Usuario]:
    """Fábrica de dependencia: exige que el usuario tenga el permiso indicado (RF-029)."""

    def checker(usuario: CurrentUser) -> Usuario:
        if not usuario.tiene_permiso(codigo):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tiene el permiso requerido: '{codigo}'.",
            )
        return usuario

    return checker
