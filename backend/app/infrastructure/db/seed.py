"""Siembra de datos inicial: catálogo RBAC + usuario administrador.

Uso:
    python -m app.infrastructure.db.seed

Idempotente: crea permisos, roles de sistema y el admin si no existen.
Cambia la contraseña del admin tras el primer inicio.
"""
import os

from sqlalchemy import select

from app.infrastructure.db.rbac import seed_rbac
from app.infrastructure.db.session import SessionLocal
from app.infrastructure.models.rol import RolModel
from app.infrastructure.models.usuario import UsuarioModel
from app.infrastructure.services.security import BcryptPasswordHasher

ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@cmss.com")
ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "Admin1234*")
ADMIN_NOMBRE = os.getenv("SEED_ADMIN_NOMBRE", "Administrador")


def seed() -> None:
    session = SessionLocal()
    try:
        # 1) Roles y permisos base
        seed_rbac(session)
        print("[seed] RBAC (permisos y roles de sistema) verificado.")

        # 2) Usuario administrador
        rol_admin = session.scalar(
            select(RolModel).where(RolModel.nombre == "admin")
        )
        if rol_admin is None:
            raise RuntimeError("No se encontró el rol 'admin' tras seed_rbac().")

        admin = session.scalar(
            select(UsuarioModel).where(UsuarioModel.email == ADMIN_EMAIL)
        )
        if admin is not None:
            # Asegura que el admin sembrado quede protegido.
            if not admin.es_protegido:
                admin.es_protegido = True
                session.commit()
                print(f"[seed] Admin '{ADMIN_EMAIL}' marcado como protegido.")
            else:
                print(f"[seed] El admin '{ADMIN_EMAIL}' ya existe. Nada que hacer.")
            return

        usuario = UsuarioModel(
            nombre=ADMIN_NOMBRE,
            email=ADMIN_EMAIL,
            hashed_password=BcryptPasswordHasher().hash(ADMIN_PASSWORD),
            rol_id=rol_admin.id,
            activo=True,
            es_protegido=True,
        )
        session.add(usuario)
        session.commit()
        print(f"[seed] Admin creado y protegido: {ADMIN_EMAIL} (rol=admin)")
    finally:
        session.close()


if __name__ == "__main__":
    seed()
