import { api } from '../../shared/api/client'

export interface Notificacion {
  id: number
  tipo: string
  titulo: string
  mensaje: string
  ticket_id: number | null
  ticket_numero: string | null
  leido: boolean
  created_at: string
}

export async function listarNotificaciones(): Promise<Notificacion[]> {
  const { data } = await api.get<Notificacion[]>('/sistemas/notificaciones')
  return data
}

export async function contarNotificaciones(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/sistemas/notificaciones/count')
  return data.count
}

export async function marcarNotificacionLeida(id: number): Promise<void> {
  await api.post(`/sistemas/notificaciones/${id}/leida`)
}

export async function marcarTodasLeidas(): Promise<void> {
  await api.post('/sistemas/notificaciones/leidas')
}
