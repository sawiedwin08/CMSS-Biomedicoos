"""Casos de uso de gestión de proveedores (RF-005)."""
from app.application.dto.proveedores import DatosProveedor
from app.domain.entities.proveedor import Proveedor
from app.domain.exceptions import (
    NombreDuplicado,
    OperacionNoPermitida,
    RecursoNoEncontrado,
)
from app.domain.repositories.proveedor_repository import ProveedorRepository


def _a_entidad(datos: DatosProveedor) -> Proveedor:
    return Proveedor(
        nombre=datos.nombre.strip(),
        nit=datos.nit,
        contacto=datos.contacto,
        telefono=datos.telefono,
        email=datos.email,
        activo=datos.activo,
    )


class ListarProveedores:
    def __init__(self, proveedores: ProveedorRepository) -> None:
        self._proveedores = proveedores

    def ejecutar(self) -> list[Proveedor]:
        return self._proveedores.listar()


class CrearProveedor:
    def __init__(self, proveedores: ProveedorRepository) -> None:
        self._proveedores = proveedores

    def ejecutar(self, datos: DatosProveedor) -> Proveedor:
        nombre = datos.nombre.strip()
        if self._proveedores.existe_nombre(nombre):
            raise NombreDuplicado(f"Ya existe un proveedor llamado '{nombre}'.")
        return self._proveedores.crear(_a_entidad(datos))


class ActualizarProveedor:
    def __init__(self, proveedores: ProveedorRepository) -> None:
        self._proveedores = proveedores

    def ejecutar(self, proveedor_id: int, datos: DatosProveedor) -> Proveedor:
        if self._proveedores.obtener_por_id(proveedor_id) is None:
            raise RecursoNoEncontrado(f"El proveedor {proveedor_id} no existe.")
        nombre = datos.nombre.strip()
        if self._proveedores.existe_nombre(nombre, excluir_id=proveedor_id):
            raise NombreDuplicado(f"Ya existe un proveedor llamado '{nombre}'.")
        return self._proveedores.actualizar(proveedor_id, _a_entidad(datos))


class EliminarProveedor:
    def __init__(self, proveedores: ProveedorRepository) -> None:
        self._proveedores = proveedores

    def ejecutar(self, proveedor_id: int) -> None:
        if self._proveedores.obtener_por_id(proveedor_id) is None:
            raise RecursoNoEncontrado(f"El proveedor {proveedor_id} no existe.")
        if self._proveedores.contar_equipos(proveedor_id) > 0:
            raise OperacionNoPermitida(
                "No se puede eliminar un proveedor asociado a equipos."
            )
        self._proveedores.eliminar(proveedor_id)
