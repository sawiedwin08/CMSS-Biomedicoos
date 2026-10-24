"""Repositorio SQLAlchemy para cuentas de correo (contraseña cifrada)."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.exceptions import NombreDuplicado, RecursoNoEncontrado
from app.infrastructure.models.cuenta_correo import CuentaCorreo
from app.infrastructure.services.cifrado import cifrar, descifrar


class CuentaCorreoRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def listar(self) -> list[CuentaCorreo]:
        return list(
            self._session.scalars(select(CuentaCorreo).order_by(CuentaCorreo.correo))
        )

    def obtener_por_id(self, cuenta_id: int) -> CuentaCorreo | None:
        return self._session.get(CuentaCorreo, cuenta_id)

    def _existe_correo(self, correo: str, excluir_id: int | None = None) -> bool:
        stmt = select(CuentaCorreo.id).where(CuentaCorreo.correo == correo)
        if excluir_id is not None:
            stmt = stmt.where(CuentaCorreo.id != excluir_id)
        return self._session.scalar(stmt) is not None

    def descifrar_password(self, cuenta: CuentaCorreo) -> str:
        return descifrar(cuenta.contrasena_cifrada)

    def crear(self, datos: dict, contrasena: str) -> CuentaCorreo:
        correo = datos["correo"].strip()
        if self._existe_correo(correo):
            raise NombreDuplicado(f"Ya existe la cuenta '{correo}'.")
        cuenta = CuentaCorreo(**datos, contrasena_cifrada=cifrar(contrasena))
        self._session.add(cuenta)
        self._session.commit()
        self._session.refresh(cuenta)
        return cuenta

    def actualizar(
        self, cuenta_id: int, datos: dict, contrasena: str | None
    ) -> CuentaCorreo:
        cuenta = self._session.get(CuentaCorreo, cuenta_id)
        if cuenta is None:
            raise RecursoNoEncontrado(f"La cuenta {cuenta_id} no existe.")
        correo = datos["correo"].strip()
        if self._existe_correo(correo, excluir_id=cuenta_id):
            raise NombreDuplicado(f"Ya existe la cuenta '{correo}'.")
        for campo, valor in datos.items():
            setattr(cuenta, campo, valor)
        # Solo cambia la contraseña si se envió una nueva (no vacía).
        if contrasena:
            cuenta.contrasena_cifrada = cifrar(contrasena)
        self._session.commit()
        self._session.refresh(cuenta)
        return cuenta

    def eliminar(self, cuenta_id: int) -> None:
        cuenta = self._session.get(CuentaCorreo, cuenta_id)
        if cuenta is None:
            raise RecursoNoEncontrado(f"La cuenta {cuenta_id} no existe.")
        self._session.delete(cuenta)
        self._session.commit()
