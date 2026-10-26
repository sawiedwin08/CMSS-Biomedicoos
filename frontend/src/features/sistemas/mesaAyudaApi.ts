import type {
  CategoriaTicket,
  CausaTicket,
  EstadoTicket,
  PrioridadTicket,
} from '../../entities/ticket'
import { api } from '../../shared/api/client'

export interface TicketListItem {
  id: number
  numero: string
  asunto: string
  solicitante_nombre: string
  categoria: CategoriaTicket
  prioridad: PrioridadTicket
  estado: EstadoTicket
  tecnico_nombre: string | null
  created_at: string
}

export interface Ticket {
  id: number
  numero: string
  solicitante_nombre: string
  solicitante_correo: string
  area: string | null
  categoria: CategoriaTicket
  asunto: string
  descripcion: string
  prioridad: PrioridadTicket
  estado: EstadoTicket
  tecnico_id: number | null
  causa: CausaTicket | null
  solucion: string | null
  fecha_primera_respuesta: string | null
  fecha_cierre: string | null
  created_at: string
  updated_at: string
}

export interface Comentario {
  id: number
  autor: string
  texto: string
  es_publico: boolean
  created_at: string
}

export interface TicketUpdate {
  estado: EstadoTicket
  prioridad: PrioridadTicket
  categoria: CategoriaTicket
  causa: CausaTicket | null
  solucion: string | null
}

export interface FiltroReporte {
  desde?: string
  hasta?: string
  estado?: EstadoTicket
  categoria?: CategoriaTicket
  prioridad?: PrioridadTicket
  tecnico_id?: number
}

export async function descargarReporteTickets(filtro: FiltroReporte = {}): Promise<void> {
  const params: Record<string, string> = {}
  if (filtro.desde) params.desde = filtro.desde
  if (filtro.hasta) params.hasta = filtro.hasta
  if (filtro.estado) params.estado = filtro.estado
  if (filtro.categoria) params.categoria = filtro.categoria
  if (filtro.prioridad) params.prioridad = filtro.prioridad
  if (filtro.tecnico_id) params.tecnico_id = String(filtro.tecnico_id)
  const res = await api.get('/sistemas/mesa-ayuda/tickets/reporte', {
    params,
    responseType: 'blob',
  })
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte_tickets_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export interface FiltroTickets {
  estado?: EstadoTicket
  categoria?: CategoriaTicket
  texto?: string
}

export async function listarTickets(filtro: FiltroTickets = {}): Promise<TicketListItem[]> {
  const params: Record<string, string> = {}
  if (filtro.estado) params.estado = filtro.estado
  if (filtro.categoria) params.categoria = filtro.categoria
  if (filtro.texto) params.texto = filtro.texto
  const { data } = await api.get<TicketListItem[]>('/sistemas/mesa-ayuda/tickets', { params })
  return data
}

export async function contarNuevos(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/sistemas/mesa-ayuda/tickets/nuevos')
  return data.count
}

export async function obtenerTicket(id: number): Promise<Ticket> {
  const { data } = await api.get<Ticket>(`/sistemas/mesa-ayuda/tickets/${id}`)
  return data
}

export async function actualizarTicket(id: number, datos: TicketUpdate): Promise<Ticket> {
  const { data } = await api.put<Ticket>(`/sistemas/mesa-ayuda/tickets/${id}`, datos)
  return data
}

export async function asignarTicket(id: number, tecnicoId: number | null): Promise<Ticket> {
  const { data } = await api.put<Ticket>(`/sistemas/mesa-ayuda/tickets/${id}/asignar`, {
    tecnico_id: tecnicoId,
  })
  return data
}

export async function listarComentarios(id: number): Promise<Comentario[]> {
  const { data } = await api.get<Comentario[]>(`/sistemas/mesa-ayuda/tickets/${id}/comentarios`)
  return data
}

export async function agregarComentario(
  id: number,
  texto: string,
  es_publico: boolean,
): Promise<Comentario> {
  const { data } = await api.post<Comentario>(`/sistemas/mesa-ayuda/tickets/${id}/comentarios`, {
    texto,
    es_publico,
  })
  return data
}

export interface Adjunto {
  id: number
  nombre_archivo: string
  tamano_bytes: number
  mime_type: string
  origen: string
  created_at: string
}

export async function listarAdjuntos(id: number): Promise<Adjunto[]> {
  const { data } = await api.get<Adjunto[]>(`/sistemas/mesa-ayuda/tickets/${id}/adjuntos`)
  return data
}

export async function urlAdjunto(ticketId: number, adjuntoId: number): Promise<string> {
  const res = await api.get(`/sistemas/mesa-ayuda/tickets/${ticketId}/adjuntos/${adjuntoId}`, {
    responseType: 'blob',
  })
  return URL.createObjectURL(res.data as Blob)
}

export async function subirAdjunto(id: number, archivo: File): Promise<Adjunto> {
  const fd = new FormData()
  fd.append('archivo', archivo)
  const { data } = await api.post<Adjunto>(`/sistemas/mesa-ayuda/tickets/${id}/adjuntos`, fd)
  return data
}
