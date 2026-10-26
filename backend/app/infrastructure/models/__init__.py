"""Registro central de modelos de persistencia.

Importar este paquete asegura que todas las tablas queden registradas en
``Base.metadata`` (necesario para Alembic autogenerate y para ``create_all``).
"""
from app.infrastructure.models.activo import Activo
from app.infrastructure.models.app_setting import AppSetting
from app.infrastructure.models.associations import rol_modulo, rol_permiso
from app.infrastructure.models.cuenta_correo import CuentaCorreo
from app.infrastructure.models.documento_activo import DocumentoActivo
from app.infrastructure.models.enlace_internet import EnlaceInternet
from app.infrastructure.models.mantenimiento_activo import MantenimientoActivo
from app.infrastructure.models.movimiento_activo import MovimientoActivo
from app.infrastructure.models.checklist_equipo import ChecklistEquipo, ChecklistPaso
from app.infrastructure.models.documento_equipo import DocumentoEquipo
from app.infrastructure.models.ejecucion_checklist import EjecucionChecklistPaso
from app.infrastructure.models.equipo import Equipo
from app.infrastructure.models.modulo import ModuloModel
from app.infrastructure.models.movimiento_equipo import MovimientoEquipo
from app.infrastructure.models.orden_trabajo import OrdenTrabajo
from app.infrastructure.models.permiso import PermisoModel
from app.infrastructure.models.plantilla_rutina import PlantillaRutina
from app.infrastructure.models.ticket import Ticket
from app.infrastructure.models.ticket_adjunto import TicketAdjunto
from app.infrastructure.models.ticket_comentario import TicketComentario
from app.infrastructure.models.proveedor import Proveedor
from app.infrastructure.models.representante import Representante
from app.infrastructure.models.rol import RolModel
from app.infrastructure.models.sede import Sede
from app.infrastructure.models.servicio import Servicio
from app.infrastructure.models.usuario import UsuarioModel

__all__ = [
    "Activo",
    "AppSetting",
    "CuentaCorreo",
    "DocumentoActivo",
    "EnlaceInternet",
    "MantenimientoActivo",
    "MovimientoActivo",
    "ChecklistEquipo",
    "ChecklistPaso",
    "DocumentoEquipo",
    "EjecucionChecklistPaso",
    "Equipo",
    "ModuloModel",
    "MovimientoEquipo",
    "OrdenTrabajo",
    "PermisoModel",
    "PlantillaRutina",
    "Ticket",
    "TicketAdjunto",
    "TicketComentario",
    "Proveedor",
    "Representante",
    "RolModel",
    "Sede",
    "Servicio",
    "UsuarioModel",
    "rol_modulo",
    "rol_permiso",
]
