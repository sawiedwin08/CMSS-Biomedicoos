/**
 * Cliente HTTP para gestionar movimientos de equipos (RF-004).
 * Endpoints: POST|GET|DELETE /equipos/{id}/movimientos
 */
import { api } from '../../shared/api/client'

export interface Movimiento {
  id: number
  equipo_id: number
  sede_origen_id: number | null
  servicio_origen_id: number | null
  sede_origen_nombre: string | null
  servicio_origen_nombre: string | null
  sede_destino_id: number | null
  servicio_destino_id: number | null
  sede_destino_nombre: string | null
  servicio_destino_nombre: string | null
  motivo: string | null
  responsable: string | null
  fecha_movimiento: string
}

export interface RegistroMovimiento {
  sede_origen_id: number | null
  servicio_origen_id: number | null
  sede_destino_id: number | null
  servicio_destino_id: number | null
  motivo?: string
  responsable?: string
}

/**
 * Registrar un nuevo movimiento de ubicación para un equipo.
 */
export async function registrarMovimiento(
  equipoId: number,
  datos: RegistroMovimiento
): Promise<Movimiento> {
  const { data } = await api.post<Movimiento>(
    `/equipos/${equipoId}/movimientos`,
    datos
  )
  return data
}

/**
 * Obtener el historial de movimientos de un equipo.
 */
export async function obtenerHistorial(
  equipoId: number
): Promise<Movimiento[]> {
  const { data } = await api.get<Movimiento[]>(
    `/equipos/${equipoId}/movimientos`
  )
  return data
}

/**
 * Eliminar un movimiento del historial.
 */
export async function eliminarMovimiento(
  equipoId: number,
  movimientoId: number
): Promise<void> {
  await api.delete(`/equipos/${equipoId}/movimientos/${movimientoId}`)
}
