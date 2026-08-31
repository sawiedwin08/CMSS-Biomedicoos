"""Implementación SQLAlchemy del puerto UsuarioRepository."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.entities.usuario import Usuario
from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.usuario import UsuarioModel


class UsuarioRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _a_entidad(model: UsuarioModel) -> Usuario:
        return Usuario(
            id=model.id,
            nombre=model.nombre,
            email=model.email,
            hashed_password=model.hashed_password,
            rol_id=model.rol_id,
            activo=model.activo,
            es_protegido=model.es_protegido,
            rol_nombre=model.rol.nombre if model.rol else None,
            permisos=frozenset(p.codigo for p in model.rol.permisos)
            if model.rol
            else frozenset(),
        )

    def obtener_por_id(self, usuario_id: int) -> Usuario | None:
        model = self._session.get(UsuarioModel, usuario_id)
        return self._a_entidad(model) if model else None

    def obtener_por_email(self, email: str) -> Usuario | None:
        model = self._session.scalar(
            select(UsuarioModel).where(UsuarioModel.email == email)
        )
        return self._a_entidad(model) if model else None

    def existe_email(self, email: str) -> bool:
        return (
            self._session.scalar(
                select(UsuarioModel.id).where(UsuarioModel.email == email)
            )
            is not None
        )

    def crear(self, usuario: Usuario) -> Usuario:
        model = UsuarioModel(
            nombre=usuario.nombre,
            email=usuario.email,
            hashed_password=usuario.hashed_password,
            rol_id=usuario.rol_id,
            activo=usuario.activo,
        )
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def asignar_rol(self, usuario_id: int, rol_id: int) -> Usuario:
        model = self._session.get(UsuarioModel, usuario_id)
        if model is None:
            raise RecursoNoEncontrado(f"El usuario {usuario_id} no existe.")
        model.rol_id = rol_id
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def actualizar(
        self,
        usuario_id: int,
        nombre: str,
        email: str,
        rol_id: int,
        activo: bool,
        es_protegido: bool,
    ) -> Usuario:
        model = self._session.get(UsuarioModel, usuario_id)
        if model is None:
            raise RecursoNoEncontrado(f"El usuario {usuario_id} no existe.")
        model.nombre = nombre
        model.email = email
        model.rol_id = rol_id
        model.activo = activo
        model.es_protegido = es_protegido
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def listar(self) -> list[Usuario]:
        models = self._session.scalars(select(UsuarioModel).order_by(UsuarioModel.id))
        return [self._a_entidad(m) for m in models]
