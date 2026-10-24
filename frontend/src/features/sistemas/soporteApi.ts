import type { CategoriaTicket, EstadoTicket } from '../../entities/ticket'
import { api } from '../../shared/api/client'

export interface TicketPublicoCreate {
  solicitante_nombre: string
  solicitante_correo: string
  area?: string | null
  categoria: CategoriaTicket
  asunto: string
  descripcion: string
}

export async function crearTicket(payload: TicketPublicoCreate): Promise<{ numero: string }> {
  const { data } = await api.post<{ numero: string }>('/soporte/tickets', payload)
  return data
}

export interface ComentarioPublico {
  autor: string
  texto: string
  created_at: string
}

export interface AdjuntoPublico {
  id: number
  nombre_archivo: string
  tamano_bytes: number
  mime_type: string
  origen: string
  created_at: string
}

export interface SeguimientoResult {
  numero: string
  asunto: string
  categoria: string
  estado: EstadoTicket
  created_at: string
  comentarios: ComentarioPublico[]
  adjuntos: AdjuntoPublico[]
}

export async function consultarSeguimiento(
  numero: string,
  correo: string,
): Promise<SeguimientoResult> {
  const { data } = await api.post<SeguimientoResult>('/soporte/seguimiento', { numero, correo })
  return data
}

export async function adjuntarPublico(
  numero: string,
  correo: string,
  archivo: File,
): Promise<void> {
  const fd = new FormData()
  fd.append('numero', numero)
  fd.append('correo', correo)
  fd.append('archivo', archivo)
  await api.post('/soporte/adjuntos', fd)
}
