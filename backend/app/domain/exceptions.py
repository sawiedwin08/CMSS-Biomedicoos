"""Excepciones de dominio. Se mapean a códigos HTTP en la capa de presentación."""


class DomainError(Exception):
    """Error base del dominio."""


class CredencialesInvalidas(DomainError):
    """Email o contraseña incorrectos, o usuario inactivo."""


class EmailYaRegistrado(DomainError):
    """Ya existe un usuario con ese correo."""


class NombreDuplicado(DomainError):
    """Ya existe un registro con ese nombre (p. ej. un rol)."""


class RecursoNoEncontrado(DomainError):
    """La entidad solicitada no existe."""


class NoAutorizado(DomainError):
    """El usuario autenticado no tiene permiso para la acción."""


class OperacionNoPermitida(DomainError):
    """La operación viola una regla de negocio (p. ej. borrar un rol en uso)."""
