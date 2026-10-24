export type CategoriaActivo = 'computo' | 'red' | 'periferico'

export type EstadoActivo =
  | 'operativo'
  | 'asignado'
  | 'en_bodega'
  | 'en_reparacion'
  | 'baja'

export type TipoComputo = 'escritorio' | 'portatil' | 'servidor' | 'aio'

export type TipoRed = 'router' | 'switch' | 'access_point' | 'firewall' | 'modem'

export type TipoPeriferico =
  | 'monitor'
  | 'impresora'
  | 'escaner'
  | 'ups'
  | 'diadema'
  | 'camara'
  | 'docking'
  | 'proyector'
  | 'lector'
  | 'otro'

export type MotivoBaja =
  | 'obsolescencia'
  | 'danio'
  | 'perdida'
  | 'robo'
  | 'donacion'
  | 'venta'

export interface Activo {
  id: number
  // Comunes
  codigo_interno: string
  categoria: CategoriaActivo
  nombre: string
  estado: EstadoActivo
  marca: string | null
  modelo: string | null
  serial: string | null
  placa_inventario: string | null
  sede_id: number | null
  area_id: number | null
  piso: string | null
  asignado_a_usuario_id: number | null
  fecha_asignacion: string | null
  fecha_adquisicion: string | null
  proveedor_id: number | null
  costo: string | null
  orden_compra: string | null
  factura: string | null
  garantia_inicio: string | null
  garantia_fin: string | null
  observaciones: string | null
  ip: string | null
  mac: string | null
  // Cómputo
  tipo_computo: TipoComputo | null
  hostname: string | null
  cpu: string | null
  ram_capacidad: string | null
  ram_tipo: string | null
  disco_tipo: string | null
  disco_capacidad: string | null
  sistema_operativo: string | null
  dominio: string | null
  inc_teclado: boolean
  inc_mouse: boolean
  inc_cable_poder: boolean
  inc_cable_video: boolean
  accesorios_otro: string | null
  // Red
  tipo_red: TipoRed | null
  num_puertos: number | null
  poe: boolean
  firmware: string | null
  ubicacion_fisica: string | null
  config_notas: string | null
  // Periférico
  tipo_periferico: TipoPeriferico | null
  asociado_a_activo_id: number | null
  monitor_pulgadas: string | null
  monitor_resolucion: string | null
  impresora_tecnologia: string | null
  impresora_conexion: string | null
  // Baja
  fecha_baja: string | null
  motivo_baja: MotivoBaja | null
  baja_autorizado_por: string | null
  acta_baja: string | null
}

export const ETIQUETA_CATEGORIA: Record<CategoriaActivo, string> = {
  computo: 'Equipo de cómputo',
  red: 'Equipo de red',
  periferico: 'Periférico',
}

export const ETIQUETA_ESTADO: Record<EstadoActivo, string> = {
  operativo: 'Operativo',
  asignado: 'Asignado',
  en_bodega: 'En bodega',
  en_reparacion: 'En reparación',
  baja: 'Dado de baja',
}

export const ETIQUETA_MOTIVO_BAJA: Record<MotivoBaja, string> = {
  obsolescencia: 'Obsolescencia',
  danio: 'Daño irreparable',
  perdida: 'Pérdida',
  robo: 'Robo',
  donacion: 'Donación',
  venta: 'Venta',
}
