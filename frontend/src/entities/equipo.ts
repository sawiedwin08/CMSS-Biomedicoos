export type EstadoEquipo =
  | 'operativo'
  | 'mantenimiento'
  | 'fuera_de_servicio'
  | 'baja'

export type Criticidad = 'alta' | 'media' | 'baja'

export type ClasificacionRiesgo = 'I' | 'IIa' | 'IIb' | 'III'

export type Propiedad = 'propio' | 'alquilado' | 'leasing' | 'prestamo'

export interface Equipo {
  id: number
  codigo_interno: string
  serial_fabricante: string
  nombre: string
  estado: EstadoEquipo
  marca: string | null
  modelo: string | null
  criticidad: Criticidad | null
  registro_invima: string | null
  clasificacion_riesgo: ClasificacionRiesgo | null
  propiedad: Propiedad | null
  sede_id: number | null
  servicio_id: number | null
  proveedor_id: number | null
  fecha_adquisicion: string | null
  costo_adquisicion: string | null
  fin_garantia: string | null
  orden_compra: string | null
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

export const CRITICIDADES: { value: Criticidad; label: string }[] = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
]

export const RIESGOS: { value: ClasificacionRiesgo; label: string }[] = [
  { value: 'I', label: 'I' },
  { value: 'IIa', label: 'IIa' },
  { value: 'IIb', label: 'IIb' },
  { value: 'III', label: 'III' },
]

export const PROPIEDADES: { value: Propiedad; label: string }[] = [
  { value: 'propio', label: 'Propio' },
  { value: 'alquilado', label: 'Alquilado' },
  { value: 'leasing', label: 'Leasing' },
  { value: 'prestamo', label: 'Préstamo' },
]

export function etiquetaPropiedad(v: Propiedad | null): string {
  if (!v) return '—'
  return PROPIEDADES.find((p) => p.value === v)?.label ?? v
}

export function etiquetaEstado(v: EstadoEquipo): string {
  return ESTADOS.find((e) => e.value === v)?.label ?? v
}
