"""Casos de uso de gestión de representantes (maestro de equipos biomédicos)."""
from app.application.dto.representantes import DatosRepresentante
from app.domain.entities.representante import Representante
from app.domain.exceptions import NombreDuplicado, RecursoNoEncontrado
from app.domain.repositories.representante_repository import RepresentanteRepository


def _a_entidad(datos: DatosRepresentante) -> Representante:
    return Representante(
        nombre=datos.nombre.strip(),
        pais=datos.pais,
        ciudad=datos.ciudad,
        direccion=datos.direccion,
        telefono=datos.telefono,
        correo=datos.correo,
        activo=datos.activo,
    )


class ListarRepresentantes:
    def __init__(self, representantes: RepresentanteRepository) -> None:
        self._representantes = representantes

    def ejecutar(self) -> list[Representante]:
        return self._representantes.listar()


class CrearRepresentante:
    def __init__(self, representantes: RepresentanteRepository) -> None:
        self._representantes = representantes

    def ejecutar(self, datos: DatosRepresentante) -> Representante:
        nombre = datos.nombre.strip()
        if self._representantes.existe_nombre(nombre):
            raise NombreDuplicado(f"Ya existe un representante llamado '{nombre}'.")
        return self._representantes.crear(_a_entidad(datos))


class ActualizarRepresentante:
    def __init__(self, representantes: RepresentanteRepository) -> None:
        self._representantes = representantes

    def ejecutar(
        self, representante_id: int, datos: DatosRepresentante
    ) -> Representante:
        if self._representantes.obtener_por_id(representante_id) is None:
            raise RecursoNoEncontrado(
                f"El representante {representante_id} no existe."
            )
        nombre = datos.nombre.strip()
        if self._representantes.existe_nombre(nombre, excluir_id=representante_id):
            raise NombreDuplicado(f"Ya existe un representante llamado '{nombre}'.")
        return self._representantes.actualizar(representante_id, _a_entidad(datos))


class EliminarRepresentante:
    def __init__(self, representantes: RepresentanteRepository) -> None:
        self._representantes = representantes

    def ejecutar(self, representante_id: int) -> None:
        if self._representantes.obtener_por_id(representante_id) is None:
            raise RecursoNoEncontrado(
                f"El representante {representante_id} no existe."
            )
        # Los equipos guardan una copia de los datos, así que eliminar un
        # representante no afecta a los equipos ya registrados.
        self._representantes.eliminar(representante_id)
