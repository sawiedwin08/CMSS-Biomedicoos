export type CategoriaTicket =
  | 'hardware'
  | 'software'
  | 'red'
  | 'correo'
  | 'accesos'
  | 'impresion'
  | 'otro'

export type PrioridadTicket = 'baja' | 'media' | 'alta' | 'critica'

export type CausaTicket =
  | 'hardware'
  | 'software'
  | 'configuracion'
  | 'usuario'
  | 'red'
  | 'proveedor'
  | 'otro'

export type EstadoTicket =
  | 'nuevo'
  | 'asignado'
  | 'en_proceso'
  | 'en_espera'
  | 'resuelto'
  | 'cerrado'
  | 'reabierto'

export const ETIQUETA_CATEGORIA_T: Record<CategoriaTicket, string> = {
  hardware: 'Hardware',
  software: 'Software',
  red: 'Redes / Internet',
  correo: 'Correo',
  accesos: 'Accesos / Usuarios',
  impresion: 'Impresión',
  otro: 'Otro',
}

export const ETIQUETA_PRIORIDAD: Record<PrioridadTicket, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
}

export const ETIQUETA_ESTADO_T: Record<EstadoTicket, string> = {
  nuevo: 'Nuevo',
  asignado: 'Asignado',
  en_proceso: 'En proceso',
  en_espera: 'En espera',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
  reabierto: 'Reabierto',
}

export const CATEGORIAS_T: CategoriaTicket[] = [
  'hardware',
  'software',
  'red',
  'correo',
  'accesos',
  'impresion',
  'otro',
]
export const ETIQUETA_CAUSA: Record<CausaTicket, string> = {
  hardware: 'Hardware',
  software: 'Software',
  configuracion: 'Configuración',
  usuario: 'Usuario / capacitación',
  red: 'Red',
  proveedor: 'Proveedor',
  otro: 'Otro',
}

export const CAUSAS_T: CausaTicket[] = [
  'hardware',
  'software',
  'configuracion',
  'usuario',
  'red',
  'proveedor',
  'otro',
]

export const PRIORIDADES_T: PrioridadTicket[] = ['baja', 'media', 'alta', 'critica']
export const ESTADOS_T: EstadoTicket[] = [
  'nuevo',
  'asignado',
  'en_proceso',
  'en_espera',
  'resuelto',
  'cerrado',
  'reabierto',
]
