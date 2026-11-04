import { api } from '../../shared/api/client'

export interface EstadoConteo {
  estado: string
  cantidad: number
}

export interface PrioridadConteo {
  prioridad: string
  cantidad: number
}

export interface DiaConteo {
  fecha: string
  cantidad: number
}

export interface AreaConteo {
  area: string
  cantidad: number
}

export interface Resumen {
  activos_total: number
  activos_operativo: number
  activos_en_reparacion: number
  activos_en_bodega: number
  activos_baja: number
  tickets_abiertos: number
  tickets_recibidos_periodo: number
  periodo_desde: string
  periodo_hasta: string
  tickets_por_dia: DiaConteo[]
  tickets_por_estado: EstadoConteo[]
  tickets_por_prioridad: PrioridadConteo[]
  tickets_por_area: AreaConteo[]
}

export async function obtenerResumen(desde?: string, hasta?: string): Promise<Resumen> {
  const params: Record<string, string> = {}
  if (desde) params.desde = desde
  if (hasta) params.hasta = hasta
  const { data } = await api.get<Resumen>('/sistemas/resumen', { params })
  return data
}
