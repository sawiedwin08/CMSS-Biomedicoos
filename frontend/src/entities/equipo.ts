export type EstadoEquipo =
  | 'operativo'
  | 'mantenimiento'
  | 'fuera_de_servicio'
  | 'baja'

export type ClasificacionRiesgo = 'I' | 'IIa' | 'IIb' | 'III' | 'NR'

export type Propiedad = 'propio' | 'alquilado' | 'leasing' | 'prestamo'

export interface Equipo {
  id: number
  // Identificación
  codigo_interno: string
  serial_fabricante: string
  nombre: string
  estado: EstadoEquipo
  marca: string | null
  modelo: string | null
  numero_activo: string | null
  // Ubicación
  sede_id: number | null
  servicio_id: number | null
  piso: string | null
  // Clasificación
  clase_biomedica: string | null
  clase_uso: string | null
  clasificacion_riesgo: ClasificacionRiesgo | null
  tecnologia_predominante: string | null
  // Fabricante
  fabricante: string | null
  anio_fabricacion: number | null
  pais_fabricante: string | null
  ciudad_fabricante: string | null
  direccion_fabricante: string | null
  telefono_fabricante: string | null
  correo_fabricante: string | null
  // Representante
  representante: string | null
  pais_representante: string | null
  ciudad_representante: string | null
  direccion_representante: string | null
  telefono_representante: string | null
  correo_representante: string | null
  // Especificaciones técnicas
  voltaje_operacion: string | null
  voltaje_maximo: string | null
  corriente_maxima: string | null
  corriente_minima: string | null
  potencia_consumida: string | null
  frecuencia: string | null
  presion: string | null
  velocidad: string | null
  temperatura: string | null
  peso: string | null
  capacidad: string | null
  fuentes_alimentacion: string[]
  // Documentación
  manuales: string[]
  planos: string[]
  recomendaciones_fabricante: string[]
  // Adquisición y garantía
  modo_adquisicion: string | null
  propiedad: Propiedad | null
  proveedor_id: number | null
  fecha_adquisicion: string | null
  costo_adquisicion: string | null
  orden_compra: string | null
  fecha_inicial_garantia: string | null
  fecha_final_garantia: string | null
  // Instalación
  fecha_instalacion: string | null
  fecha_funcionamiento: string | null
  // Registro sanitario
  registro_invima: string | null
  fecha_vencimiento_invima: string | null
  // Mantenimiento / operación
  periodicidad_mantenimiento: string | null
  calibracion_si: boolean
  calibracion_no: boolean
  equipo_movil: boolean
  equipo_fijo: boolean
  accesorios: string | null
  descripcion_funcional: string | null
  // Nombres resueltos (lectura)
  sede_nombre: string | null
  servicio_nombre: string | null
  proveedor_nombre: string | null
}

export const ESTADOS: { value: EstadoEquipo; label: string }[] = [
  { value: 'operativo', label: 'Operativo' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
  { value: 'fuera_de_servicio', label: 'Fuera de servicio' },
  { value: 'baja', label: 'Dado de baja' },
]

export const RIESGOS: { value: ClasificacionRiesgo; label: string }[] = [
  { value: 'I', label: 'I' },
  { value: 'IIa', label: 'IIa' },
  { value: 'IIb', label: 'IIb' },
  { value: 'III', label: 'III' },
  { value: 'NR', label: 'NR' },
]

export const PROPIEDADES: { value: Propiedad; label: string }[] = [
  { value: 'propio', label: 'Propio' },
  { value: 'alquilado', label: 'Alquilado' },
  { value: 'leasing', label: 'Leasing' },
  { value: 'prestamo', label: 'Préstamo' },
]

// Vocabularios fijos (los valores coinciden exactamente con el backend).
export const CLASES_BIOMEDICAS: string[] = [
  'Descripcion',
  'Diagnostico',
  'Tratamiento y Mantenimiento de la Vida',
  'Prevencion',
  'Rehabilitacion',
  'Analisis de Laboratorio',
  'No Aplica',
]

export const CLASES_USO: string[] = ['Medico', 'Basico', 'Apoyo', 'Uso', 'No Aplica']

export const TECNOLOGIAS: string[] = [
  'Eléctrico',
  'Mecanico',
  'Neumático',
  'Electrónica',
  'Electromecánico',
  'A vapor',
  'Hidráulico',
  'Otro',
]

export const MODOS_ADQUISICION: string[] = ['Compra Directa', 'Comodato']

export const FUENTES_ALIMENTACION: string[] = [
  'Agua',
  'Derivados de petroleo',
  'O2',
  'Vapor',
  'Ninguno',
  'Aire',
  'Gas',
  'Electricidad',
  'Nitrogeno',
  'Energia solar',
  'CO2',
  'Gasolina',
]

export const MANUALES_OPCIONES: string[] = [
  'Operación',
  'Mantenimiento',
  'Partes',
  'Despieces',
  'Ninguno',
]

export const PLANOS_OPCIONES: string[] = [
  'Eléctrico',
  'Electrónicos',
  'Hidraulicos',
  'Neumaticos',
  'Ninguno',
]

export function etiquetaPropiedad(v: Propiedad | null): string {
  if (!v) return '—'
  return PROPIEDADES.find((p) => p.value === v)?.label ?? v
}

export function etiquetaEstado(v: EstadoEquipo): string {
  return ESTADOS.find((e) => e.value === v)?.label ?? v
}
