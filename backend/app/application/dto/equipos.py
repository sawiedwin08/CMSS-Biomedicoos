"""DTOs de gestión de equipos (RF-001..007)."""
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.domain.enums.clasificacion_riesgo import ClasificacionRiesgo
from app.domain.enums.estado_equipo import EstadoEquipo
from app.domain.enums.propiedad import Propiedad


@dataclass
class DatosEquipo:
    # --- Identificación ---
    codigo_interno: str
    serial_fabricante: str
    nombre: str
    estado: EstadoEquipo = EstadoEquipo.OPERATIVO
    marca: str | None = None
    modelo: str | None = None
    numero_activo: str | None = None

    # --- Ubicación ---
    sede_id: int | None = None
    servicio_id: int | None = None
    piso: str | None = None

    # --- Clasificación ---
    clase_biomedica: str | None = None
    clase_uso: str | None = None
    clasificacion_riesgo: ClasificacionRiesgo | None = None
    tecnologia_predominante: str | None = None

    # --- Fabricante ---
    fabricante: str | None = None
    anio_fabricacion: int | None = None
    pais_fabricante: str | None = None
    ciudad_fabricante: str | None = None
    direccion_fabricante: str | None = None
    telefono_fabricante: str | None = None
    correo_fabricante: str | None = None

    # --- Representante ---
    representante: str | None = None
    pais_representante: str | None = None
    ciudad_representante: str | None = None
    direccion_representante: str | None = None
    telefono_representante: str | None = None
    correo_representante: str | None = None

    # --- Especificaciones técnicas ---
    voltaje_operacion: str | None = None
    voltaje_maximo: str | None = None
    corriente_maxima: str | None = None
    corriente_minima: str | None = None
    potencia_consumida: str | None = None
    frecuencia: str | None = None
    presion: str | None = None
    velocidad: str | None = None
    temperatura: str | None = None
    peso: str | None = None
    capacidad: str | None = None
    fuentes_alimentacion: list[str] = field(default_factory=list)

    # --- Documentación ---
    manuales: list[str] = field(default_factory=list)
    planos: list[str] = field(default_factory=list)
    recomendaciones_fabricante: list[str] = field(default_factory=list)

    # --- Adquisición y garantía ---
    modo_adquisicion: str | None = None
    propiedad: Propiedad | None = None
    proveedor_id: int | None = None
    fecha_adquisicion: date | None = None
    costo_adquisicion: Decimal | None = None
    orden_compra: str | None = None
    fecha_inicial_garantia: date | None = None
    fecha_final_garantia: date | None = None

    # --- Instalación ---
    fecha_instalacion: date | None = None
    fecha_funcionamiento: date | None = None

    # --- Registro sanitario (INVIMA) ---
    registro_invima: str | None = None
    fecha_vencimiento_invima: date | None = None

    # --- Mantenimiento / operación ---
    periodicidad_mantenimiento: str | None = None
    calibracion_si: bool = False
    calibracion_no: bool = False
    equipo_movil: bool = False
    equipo_fijo: bool = False
    accesorios: str | None = None
    descripcion_funcional: str | None = None


@dataclass
class FiltroEquipos:
    texto: str | None = None
    sede_id: int | None = None
    servicio_id: int | None = None
    estado: EstadoEquipo | None = None
    propiedad: Propiedad | None = None
    clasificacion_riesgo: ClasificacionRiesgo | None = None
