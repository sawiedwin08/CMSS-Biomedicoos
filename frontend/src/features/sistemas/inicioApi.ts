import { api } from '../../shared/api/client'

export interface EstadoConteo {
  estado: string
  cantidad: number
}

export interface Resumen {
  activos_total: number
  activos_operativo: number
  activos_en_reparacion: number
  activos_en_bodega: number
  activos_baja: number
  tickets_abiertos: number
  tickets_nuevos_hoy: number
  cuentas_activas: number
  tickets_por_estado: EstadoConteo[]
}

export async function obtenerResumen(): Promise<Resumen> {
  const { data } = await api.get<Resumen>('/sistemas/resumen')
  return data
}
