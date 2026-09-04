"""Registro central de modelos de persistencia.

Importar este paquete asegura que todas las tablas queden registradas en
``Base.metadata`` (necesario para Alembic autogenerate y para ``create_all``).
"""
from app.infrastructure.models.app_setting import AppSetting
from app.infrastructure.models.associations import rol_modulo, rol_permiso
from app.infrastructure.models.attendance_record import AttendanceRecord
from app.infrastructure.models.department import Department
from app.infrastructure.models.equipo import Equipo
from app.infrastructure.models.modulo import ModuloModel
from app.infrastructure.models.movimiento_equipo import MovimientoEquipo
from app.infrastructure.models.permiso import PermisoModel
from app.infrastructure.models.processing_history import ProcessingHistory
from app.infrastructure.models.proveedor import Proveedor
from app.infrastructure.models.rol import RolModel
from app.infrastructure.models.schedule import Schedule
from app.infrastructure.models.schedule_block import ScheduleBlock
from app.infrastructure.models.sede import Sede
from app.infrastructure.models.servicio import Servicio
from app.infrastructure.models.usuario import UsuarioModel

__all__ = [
    "AppSetting",
    "AttendanceRecord",
    "Department",
    "Equipo",
    "ModuloModel",
    "MovimientoEquipo",
    "PermisoModel",
    "ProcessingHistory",
    "Proveedor",
    "RolModel",
    "Schedule",
    "ScheduleBlock",
    "Sede",
    "Servicio",
    "UsuarioModel",
    "rol_modulo",
    "rol_permiso",
]
