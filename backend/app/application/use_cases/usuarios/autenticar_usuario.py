"""Caso de uso: autenticar un usuario y emitir un token de acceso (RF-028)."""
from app.application.dto.auth import Credenciales, TokenData
from app.application.interfaces.security import PasswordHasher, TokenService
from app.domain.exceptions import CredencialesInvalidas
from app.domain.repositories.usuario_repository import UsuarioRepository


class AutenticarUsuario:
    def __init__(
        self,
        usuarios: UsuarioRepository,
        hasher: PasswordHasher,
        tokens: TokenService,
    ) -> None:
        self._usuarios = usuarios
        self._hasher = hasher
        self._tokens = tokens

    def ejecutar(self, credenciales: Credenciales) -> TokenData:
        usuario = self._usuarios.obtener_por_email(credenciales.email)
        if (
            usuario is None
            or not usuario.activo
            or not self._hasher.verify(credenciales.password, usuario.hashed_password)
        ):
            raise CredencialesInvalidas("Email o contraseña incorrectos.")

        assert usuario.id is not None  # persistido
        token = self._tokens.crear_token_acceso(
            subject=str(usuario.id), rol=usuario.rol_nombre or ""
        )
        return TokenData(access_token=token)
