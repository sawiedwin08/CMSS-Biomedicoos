"""Caso de uso: asignar un rol a un usuario (RF-028)."""
from app.domain.entities.usuario import Usuario
from app.domain.exceptions import OperacionNoPermitida, RecursoNoEncontrado
from app.domain.repositories.rol_repository import RolRepository
from app.domain.repositories.usuario_repository import UsuarioRepository


class AsignarRolUsuario:
    def __init__(self, usuarios: UsuarioRepository, roles: RolRepository) -> None:
        self._usuarios = usuarios
        self._roles = roles

    def ejecutar(self, actor: Usuario, usuario_id: int, rol_id: int) -> Usuario:
        objetivo = self._usuarios.obtener_por_id(usuario_id)
        if objetivo is None:
            raise RecursoNoEncontrado(f"El usuario {usuario_id} no existe.")
        if objetivo.es_protegido and actor.id != objetivo.id:
            raise OperacionNoPermitida(
                "Este usuario está protegido y solo puede editarlo él mismo."
            )
        if self._roles.obtener_por_id(rol_id) is None:
            raise RecursoNoEncontrado(f"El rol {rol_id} no existe.")
        return self._usuarios.asignar_rol(usuario_id, rol_id)
