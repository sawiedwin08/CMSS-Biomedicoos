"""Registro central de modelos de persistencia.

Importar este paquete asegura que todas las tablas queden registradas en
``Base.metadata`` (necesario para Alembic autogenerate y para ``create_all``).
"""
from app.infrastructure.models.associations import rol_permiso
from app.infrastructure.models.equipo import Equipo
from app.infrastructure.models.movimiento_equipo import MovimientoEquipo
from app.infrastructure.models.permiso import PermisoModel
from app.infrastructure.models.proveedor import Proveedor
from app.infrastructure.models.rol import RolModel
from app.infrastructure.models.sede import Sede
from app.infrastructure.models.servicio import Servicio
from app.infrastructure.models.usuario import UsuarioModel

__all__ = [
    "Equipo",
    "MovimientoEquipo",
    "PermisoModel",
    "Proveedor",
    "RolModel",
    "Sede",
    "Servicio",
    "UsuarioModel",
    "rol_permiso",
]
