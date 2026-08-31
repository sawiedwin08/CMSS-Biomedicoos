"""Caso de uso: actualizar un usuario (nombre, correo, rol, estado) — RF-028.

Regla de negocio: un usuario **protegido** solo puede ser modificado por sí
mismo. La marca de protección solo puede cambiarla un actor con el permiso
'usuarios:proteger'.
"""
from app.application.dto.usuarios import DatosActualizarUsuario
from app.domain.entities.usuario import Usuario
from app.domain.exceptions import (
    EmailYaRegistrado,
    OperacionNoPermitida,
    RecursoNoEncontrado,
)
from app.domain.repositories.rol_repository import RolRepository
from app.domain.repositories.usuario_repository import UsuarioRepository

PERMISO_PROTEGER = "usuarios:proteger"


class ActualizarUsuario:
    def __init__(self, usuarios: UsuarioRepository, roles: RolRepository) -> None:
        self._usuarios = usuarios
        self._roles = roles

    def ejecutar(
        self, actor: Usuario, usuario_id: int, datos: DatosActualizarUsuario
    ) -> Usuario:
        objetivo = self._usuarios.obtener_por_id(usuario_id)
        if objetivo is None:
            raise RecursoNoEncontrado(f"El usuario {usuario_id} no existe.")

        # Un usuario protegido solo puede ser editado por sí mismo.
        if objetivo.es_protegido and actor.id != objetivo.id:
            raise OperacionNoPermitida(
                "Este usuario está protegido y solo puede editarlo él mismo."
            )

        if self._roles.obtener_por_id(datos.rol_id) is None:
            raise RecursoNoEncontrado(f"El rol {datos.rol_id} no existe.")

        # Correo único (si cambió).
        email = datos.email.strip()
        if email != objetivo.email and self._usuarios.existe_email(email):
            raise EmailYaRegistrado(f"Ya existe un usuario con el correo {email}.")

        # Solo un actor con permiso puede cambiar la marca de protección;
        # de lo contrario se conserva la que ya tenía el usuario.
        es_protegido = objetivo.es_protegido
        if datos.es_protegido is not None and PERMISO_PROTEGER in actor.permisos:
            es_protegido = datos.es_protegido

        return self._usuarios.actualizar(
            usuario_id=usuario_id,
            nombre=datos.nombre.strip(),
            email=email,
            rol_id=datos.rol_id,
            activo=datos.activo,
            es_protegido=es_protegido,
        )
