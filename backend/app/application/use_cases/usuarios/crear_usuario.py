"""Caso de uso: crear un usuario (RF-028)."""
from app.application.dto.usuarios import DatosNuevoUsuario
from app.application.interfaces.security import PasswordHasher
from app.domain.entities.usuario import Usuario
from app.domain.exceptions import EmailYaRegistrado, RecursoNoEncontrado
from app.domain.repositories.rol_repository import RolRepository
from app.domain.repositories.usuario_repository import UsuarioRepository


class CrearUsuario:
    def __init__(
        self,
        usuarios: UsuarioRepository,
        roles: RolRepository,
        hasher: PasswordHasher,
    ) -> None:
        self._usuarios = usuarios
        self._roles = roles
        self._hasher = hasher

    def ejecutar(self, datos: DatosNuevoUsuario) -> Usuario:
        if self._usuarios.existe_email(datos.email):
            raise EmailYaRegistrado(f"Ya existe un usuario con el correo {datos.email}.")

        if self._roles.obtener_por_id(datos.rol_id) is None:
            raise RecursoNoEncontrado(f"El rol {datos.rol_id} no existe.")

        usuario = Usuario(
            nombre=datos.nombre,
            email=datos.email,
            hashed_password=self._hasher.hash(datos.password),
            rol_id=datos.rol_id,
            activo=True,
        )
        return self._usuarios.crear(usuario)
