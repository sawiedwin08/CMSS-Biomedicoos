"""Caso de uso: un administrador restablece la contraseña de un usuario (RF-028).

Regla de negocio: un usuario **protegido** solo puede cambiar su propia
contraseña; nadie más puede restablecérsela.
"""
from app.application.interfaces.security import PasswordHasher
from app.domain.entities.usuario import Usuario
from app.domain.exceptions import OperacionNoPermitida, RecursoNoEncontrado
from app.domain.repositories.usuario_repository import UsuarioRepository


class RestablecerPassword:
    def __init__(self, usuarios: UsuarioRepository, hasher: PasswordHasher) -> None:
        self._usuarios = usuarios
        self._hasher = hasher

    def ejecutar(self, actor: Usuario, usuario_id: int, nueva_password: str) -> None:
        objetivo = self._usuarios.obtener_por_id(usuario_id)
        if objetivo is None:
            raise RecursoNoEncontrado(f"El usuario {usuario_id} no existe.")

        if objetivo.es_protegido and actor.id != objetivo.id:
            raise OperacionNoPermitida(
                "Este usuario está protegido y solo él puede cambiar su contraseña."
            )

        self._usuarios.actualizar_password(
            usuario_id, self._hasher.hash(nueva_password)
        )
