"""Catálogo de permisos y roles base del sistema (RF-028, RF-029).

Es idempotente: puede ejecutarse en cada arranque/despliegue. Crea los permisos
y los roles de sistema que falten, y asigna los permisos por defecto a un rol de
sistema solo si aún no tiene ninguno (para no pisar ajustes manuales del admin).
"""
from sqlalchemy.orm import Session

from app.infrastructure.models.permiso import PermisoModel
from app.infrastructure.models.rol import RolModel

# --- Catálogo de permisos: (modulo, accion, descripción) ---
CATALOGO: list[tuple[str, str, str]] = [
    ("inventario", "ver", "Ver equipos del inventario"),
    ("inventario", "crear", "Registrar equipos"),
    ("inventario", "editar", "Editar equipos"),
    ("inventario", "eliminar", "Dar de baja / eliminar equipos"),
    ("hojas_vida", "ver", "Ver hojas de vida"),
    ("hojas_vida", "crear", "Agregar intervenciones / documentos"),
    ("hojas_vida", "editar", "Editar hojas de vida"),
    ("mantenimiento", "ver", "Ver órdenes de trabajo"),
    ("mantenimiento", "crear", "Crear órdenes de trabajo"),
    ("mantenimiento", "editar", "Editar órdenes de trabajo"),
    ("mantenimiento", "eliminar", "Eliminar órdenes de trabajo"),
    ("kpis", "ver", "Ver tableros de indicadores"),
    ("kpis", "exportar", "Exportar reportes"),
    ("fichas", "ver", "Ver fichas técnicas y de manejo"),
    ("fichas", "crear", "Crear fichas"),
    ("fichas", "editar", "Editar fichas"),
    ("capacitaciones", "ver", "Ver capacitaciones"),
    ("capacitaciones", "crear", "Registrar capacitaciones"),
    ("capacitaciones", "editar", "Editar capacitaciones"),
    ("alertas", "ver", "Ver alertas y notificaciones"),
    ("usuarios", "ver", "Ver usuarios"),
    ("usuarios", "crear", "Crear usuarios"),
    ("usuarios", "editar", "Editar / asignar rol a usuarios"),
    ("usuarios", "eliminar", "Eliminar usuarios"),
    ("usuarios", "proteger", "Marcar/quitar la protección de un usuario"),
    ("roles", "ver", "Ver roles y permisos"),
    ("roles", "crear", "Crear roles"),
    ("roles", "editar", "Editar roles y sus permisos"),
    ("roles", "eliminar", "Eliminar roles"),
    ("modulos", "ver", "Ver módulos de la plataforma"),
    ("modulos", "asignar", "Asignar módulos de acceso a los roles"),
    ("tardanzas", "ver", "Ver reportes de tardanzas"),
    ("tardanzas", "crear", "Crear departamentos y horarios"),
    ("tardanzas", "editar", "Editar departamentos y horarios"),
    ("tardanzas", "eliminar", "Eliminar departamentos y horarios"),
]

# --- Roles de sistema: (nombre, descripción) ---
ROLES_SISTEMA: list[tuple[str, str]] = [
    ("admin", "Acceso total al sistema"),
    ("coordinador", "Coordinación biomédica: gestión operativa y usuarios"),
    ("ingeniero_biomedico", "Gestión técnica de equipos y mantenimiento"),
    ("tecnico", "Ejecución de mantenimientos y registro en campo"),
    ("consulta", "Solo lectura"),
]

# --- Módulos de la plataforma: (slug, nombre, descripción, icono, orden) ---
MODULOS_SISTEMA: list[tuple[str, str, str, str, int]] = [
    (
        "biomedicos",
        "Equipos Biomédicos",
        "Gestión de activos biomédicos: inventario, hojas de vida, mantenimiento y más.",
        "🩺",
        1,
    ),
    (
        "tardanzas",
        "Reporte de Tardanzas",
        "Gestión de llegadas tarde: departamentos, horarios y análisis de tardanzas.",
        "⏰",
        2,
    ),
    (
        "admin",
        "Administración",
        "Usuarios, roles y módulos de la plataforma.",
        "⚙️",
        99,
    ),
]

# --- Acceso por defecto a módulos según el rol ---
MODULOS_POR_ROL: dict[str, set[str]] = {
    "admin": {"biomedicos", "tardanzas", "admin"},
    "coordinador": {"biomedicos", "tardanzas", "admin"},
    "ingeniero_biomedico": {"biomedicos", "tardanzas"},
    "tecnico": {"biomedicos", "tardanzas"},
    "consulta": {"biomedicos", "tardanzas"},
}


def _codigo(modulo: str, accion: str) -> str:
    return f"{modulo}:{accion}"


# --- Permisos por defecto de cada rol de sistema ---
def _permisos_por_defecto(rol: str, todos: list[str]) -> set[str]:
    if rol == "admin":
        return set(todos)
    if rol == "consulta":
        # Solo lectura de módulos operativos (no administra usuarios ni roles).
        return {
            c
            for c in todos
            if c.endswith(":ver") and c.split(":")[0] not in {"roles", "usuarios"}
        }
    if rol == "coordinador":
        # Todo, salvo administrar roles (puede *verlos* para asignarlos) y
        # eliminar usuarios.
        excluidos = {
            "roles:crear",
            "roles:editar",
            "roles:eliminar",
            "usuarios:eliminar",
            "usuarios:proteger",
        }
        return {c for c in todos if c not in excluidos}
    if rol == "ingeniero_biomedico":
        modulos = {"inventario", "hojas_vida", "mantenimiento", "fichas"}
        base = {c for c in todos if c.split(":")[0] in modulos}
        return base | {"kpis:ver", "kpis:exportar", "capacitaciones:ver", "alertas:ver"}
    if rol == "tecnico":
        return {
            "inventario:ver",
            "mantenimiento:ver",
            "mantenimiento:crear",
            "mantenimiento:editar",
            "hojas_vida:ver",
            "hojas_vida:crear",
            "fichas:ver",
            "alertas:ver",
        }
    return set()


def seed_rbac(session: Session) -> None:
    # 1) Permisos (crear los que falten)
    existentes = {
        p.codigo: p for p in session.scalars(select_all_permisos()).all()
    }
    for modulo, accion, descripcion in CATALOGO:
        codigo = _codigo(modulo, accion)
        if codigo not in existentes:
            permiso = PermisoModel(
                modulo=modulo, accion=accion, codigo=codigo, descripcion=descripcion
            )
            session.add(permiso)
            existentes[codigo] = permiso
    session.flush()

    todos_codigos = [_codigo(m, a) for m, a, _ in CATALOGO]

    # 2) Roles de sistema (crear los que falten) + permisos por defecto si están vacíos
    for nombre, descripcion in ROLES_SISTEMA:
        rol = session.scalar(select_rol_por_nombre(nombre))
        if rol is None:
            rol = RolModel(nombre=nombre, descripcion=descripcion, es_sistema=True)
            session.add(rol)
            session.flush()
        if nombre == "admin":
            # El admin SIEMPRE tiene todos los permisos (aunque el catálogo crezca).
            rol.permisos = list(existentes.values())
        elif not rol.permisos:
            codigos = _permisos_por_defecto(nombre, todos_codigos)
            rol.permisos = [existentes[c] for c in codigos if c in existentes]

    # 3) Módulos de la plataforma (crear los que falten)
    from sqlalchemy import select

    from app.infrastructure.models.modulo import ModuloModel

    modulos_existentes = {
        m.slug: m for m in session.scalars(select(ModuloModel)).all()
    }
    for slug, nombre_mod, descripcion_mod, icono, orden in MODULOS_SISTEMA:
        if slug not in modulos_existentes:
            modulo = ModuloModel(
                slug=slug,
                nombre=nombre_mod,
                descripcion=descripcion_mod,
                icono=icono,
                orden=orden,
            )
            session.add(modulo)
            modulos_existentes[slug] = modulo
    session.flush()

    # 4) Acceso a módulos por rol (admin siempre todos; otros solo si están vacíos)
    for nombre, _descripcion in ROLES_SISTEMA:
        rol = session.scalar(select_rol_por_nombre(nombre))
        if rol is None:
            continue
        if nombre == "admin":
            rol.modulos = list(modulos_existentes.values())
        elif not rol.modulos:
            slugs = MODULOS_POR_ROL.get(nombre, set())
            rol.modulos = [
                modulos_existentes[s] for s in slugs if s in modulos_existentes
            ]

    session.commit()


# --- Selectores auxiliares (import local para evitar dependencias circulares) ---
def select_all_permisos():
    from sqlalchemy import select

    return select(PermisoModel)


def select_rol_por_nombre(nombre: str):
    from sqlalchemy import select

    return select(RolModel).where(RolModel.nombre == nombre)
