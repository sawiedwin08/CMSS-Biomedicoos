"""Casos de uso del inventario de activos de TI (módulo Sistemas)."""
from dataclasses import asdict

from app.application.dto.activos import DatosActivo, DatosBaja, FiltroActivos
from app.domain.entities.activo import Activo
from app.domain.exceptions import (
    NombreDuplicado,
    OperacionNoPermitida,
    RecursoNoEncontrado,
)
from app.domain.repositories.activo_repository import ActivoRepository
from app.domain.repositories.proveedor_repository import ProveedorRepository
from app.domain.repositories.sede_repository import SedeRepository
from app.domain.repositories.servicio_repository import ServicioRepository
from app.domain.repositories.usuario_repository import UsuarioRepository


def _a_entidad(datos: DatosActivo) -> Activo:
    campos = asdict(datos)
    campos["codigo_interno"] = (datos.codigo_interno or "").strip()
    campos["nombre"] = datos.nombre.strip()
    return Activo(**campos)


class _ValidadorReferencias:
    """Valida que sede/área/proveedor/usuario existan y sean coherentes."""

    def __init__(
        self,
        sedes: SedeRepository,
        areas: ServicioRepository,
        proveedores: ProveedorRepository,
        usuarios: UsuarioRepository,
    ) -> None:
        self._sedes = sedes
        self._areas = areas
        self._proveedores = proveedores
        self._usuarios = usuarios

    def validar(self, datos: DatosActivo) -> None:
        if datos.sede_id is not None and self._sedes.obtener_por_id(datos.sede_id) is None:
            raise RecursoNoEncontrado(f"La sede {datos.sede_id} no existe.")

        if datos.area_id is not None:
            area = self._areas.obtener_por_id(datos.area_id)
            if area is None:
                raise RecursoNoEncontrado(f"El área {datos.area_id} no existe.")
            if datos.sede_id is not None and area.sede_id != datos.sede_id:
                raise OperacionNoPermitida("El área no pertenece a la sede indicada.")

        if (
            datos.proveedor_id is not None
            and self._proveedores.obtener_por_id(datos.proveedor_id) is None
        ):
            raise RecursoNoEncontrado(f"El proveedor {datos.proveedor_id} no existe.")

        if (
            datos.asignado_a_usuario_id is not None
            and self._usuarios.obtener_por_id(datos.asignado_a_usuario_id) is None
        ):
            raise RecursoNoEncontrado(
                f"El usuario {datos.asignado_a_usuario_id} no existe."
            )


class ListarActivos:
    def __init__(self, activos: ActivoRepository) -> None:
        self._activos = activos

    def ejecutar(self, filtro: FiltroActivos) -> list[Activo]:
        return self._activos.listar(filtro)


class ObtenerActivo:
    def __init__(self, activos: ActivoRepository) -> None:
        self._activos = activos

    def ejecutar(self, activo_id: int) -> Activo:
        activo = self._activos.obtener_por_id(activo_id)
        if activo is None:
            raise RecursoNoEncontrado(f"El activo {activo_id} no existe.")
        return activo


class CrearActivo:
    def __init__(
        self,
        activos: ActivoRepository,
        sedes: SedeRepository,
        areas: ServicioRepository,
        proveedores: ProveedorRepository,
        usuarios: UsuarioRepository,
    ) -> None:
        self._activos = activos
        self._validador = _ValidadorReferencias(sedes, areas, proveedores, usuarios)

    def ejecutar(self, datos: DatosActivo) -> Activo:
        self._validador.validar(datos)
        codigo = (datos.codigo_interno or "").strip()
        if codigo:
            if self._activos.existe_codigo(codigo):
                raise NombreDuplicado(f"Ya existe un activo con el código '{codigo}'.")
        else:
            codigo = self._activos.siguiente_codigo()
        activo = _a_entidad(datos)
        activo.codigo_interno = codigo
        return self._activos.crear(activo)


class ActualizarActivo:
    def __init__(
        self,
        activos: ActivoRepository,
        sedes: SedeRepository,
        areas: ServicioRepository,
        proveedores: ProveedorRepository,
        usuarios: UsuarioRepository,
    ) -> None:
        self._activos = activos
        self._validador = _ValidadorReferencias(sedes, areas, proveedores, usuarios)

    def ejecutar(self, activo_id: int, datos: DatosActivo) -> Activo:
        if self._activos.obtener_por_id(activo_id) is None:
            raise RecursoNoEncontrado(f"El activo {activo_id} no existe.")
        self._validador.validar(datos)
        codigo = (datos.codigo_interno or "").strip()
        if codigo and self._activos.existe_codigo(codigo, excluir_id=activo_id):
            raise NombreDuplicado(f"Ya existe un activo con el código '{codigo}'.")
        return self._activos.actualizar(activo_id, _a_entidad(datos))


class DarDeBajaActivo:
    def __init__(self, activos: ActivoRepository) -> None:
        self._activos = activos

    def ejecutar(self, activo_id: int, datos: DatosBaja) -> Activo:
        if self._activos.obtener_por_id(activo_id) is None:
            raise RecursoNoEncontrado(f"El activo {activo_id} no existe.")
        return self._activos.dar_de_baja(activo_id, datos)


class EliminarActivo:
    def __init__(self, activos: ActivoRepository) -> None:
        self._activos = activos

    def ejecutar(self, activo_id: int) -> None:
        if self._activos.obtener_por_id(activo_id) is None:
            raise RecursoNoEncontrado(f"El activo {activo_id} no existe.")
        self._activos.eliminar(activo_id)
