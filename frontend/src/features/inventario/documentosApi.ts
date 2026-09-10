/**
 * Cliente HTTP para gestionar documentos de equipos.
 * Endpoints: GET|POST|DELETE /equipos/{id}/documentos
 */
import type { Equipo } from '../../entities/equipo'
import { api } from '../../shared/api/client'

export interface UsuarioEnDocumento {
  id: number
  nombre: string
}

export interface DocumentoEquipo {
  id: number
  equipo_id: number
  usuario_id: number | null
  usuario: UsuarioEnDocumento | null
  tipo: TipoDocumento
  nombre_archivo: string
  tamaño_bytes: number
  mime_type: string
  descripcion: string | null
  año_documento: number | null
  created_at: string
  updated_at: string
}

export type TipoDocumento =
  | 'manual' | 'plano' | 'calibracion' | 'hoja_de_vida'
  | 'mantenimientos_preventivos' | 'correctivo' | 'reportes'
  | 'invima' | 'factura' | 'importacion' | 'ficha_tecnica' | 'guia_rapida' | 'otros'

export const TIPOS_MANTENIMIENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'mantenimientos_preventivos', label: 'Mantenimientos Preventivos' },
  { value: 'correctivo', label: 'Correctivo' },
  { value: 'reportes', label: 'Reportes' },
  { value: 'calibracion', label: 'Calibración' },
]

export const TIPOS_DOCUMENTACION: { value: TipoDocumento; label: string }[] = [
  { value: 'hoja_de_vida', label: 'Hoja de Vida' },
  { value: 'invima', label: 'Invima' },
  { value: 'factura', label: 'Factura' },
  { value: 'importacion', label: 'Importación' },
  { value: 'manual', label: 'Manual' },
  { value: 'plano', label: 'Plano' },
  { value: 'ficha_tecnica', label: 'Ficha Técnica' },
  { value: 'guia_rapida', label: 'Guía Rápida' },
  { value: 'otros', label: 'Otros' },
]

export const TIPOS_DOCUMENTOS: { value: TipoDocumento; label: string }[] = [
  ...TIPOS_MANTENIMIENTO,
  ...TIPOS_DOCUMENTACION,
]

/**
 * Listar todos los documentos de un equipo.
 */
export async function listarDocumentos(
  equipoId: number,
  tipo?: TipoDocumento
): Promise<DocumentoEquipo[]> {
  const params: Record<string, string> = {}
  if (tipo) params.tipo = tipo

  const { data } = await api.get<DocumentoEquipo[]>(
    `/equipos/${equipoId}/documentos`,
    { params }
  )
  return data
}

/**
 * Subir un nuevo documento para un equipo.
 */
export async function subirDocumento(
  equipoId: number,
  archivo: File,
  tipo: TipoDocumento,
  descripcion?: string,
  año?: number
): Promise<DocumentoEquipo> {
  const formData = new FormData()
  formData.append('archivo', archivo)

  const params: Record<string, string> = { tipo }
  if (descripcion) params.descripcion = descripcion
  if (año) params.year = año.toString()

  const { data } = await api.post<DocumentoEquipo>(
    `/equipos/${equipoId}/documentos`,
    formData,
    { params }
  )
  return data
}

/**
 * Descargar un documento (retorna el archivo).
 */
export async function descargarDocumento(
  equipoId: number,
  documentoId: number
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/equipos/${equipoId}/documentos/${documentoId}`,
    { responseType: 'blob' }
  )
  return data as Blob
}

/**
 * Descargar un documento con su nombre original.
 */
export async function descargarDocumentoNombre(
  equipoId: number,
  documentoId: number,
  nombreArchivo: string
): Promise<void> {
  const blob = await descargarDocumento(equipoId, documentoId)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Eliminar un documento.
 */
export async function eliminarDocumento(
  equipoId: number,
  documentoId: number
): Promise<void> {
  await api.delete(`/equipos/${equipoId}/documentos/${documentoId}`)
}

/**
 * Descargar todos los documentos en ZIP.
 */
export async function descargarTodosDocumentos(
  equipoId: number,
  nombreEquipo: string
): Promise<void> {
  const { data } = await api.get<Blob>(
    `/equipos/${equipoId}/documentos/descargar-todos`,
    { responseType: 'blob' }
  )
  const url = URL.createObjectURL(data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `equipo_${equipoId}_${nombreEquipo.replace(/\s+/g, '_')}_documentos.zip`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Agrupar documentos por tipo.
 */
export function agruparPorTipo(
  documentos: DocumentoEquipo[]
): Record<TipoDocumento, DocumentoEquipo[]> {
  const agrupados: Record<TipoDocumento, DocumentoEquipo[]> = {
    manual: [],
    plano: [],
    calibracion: [],
    hoja_de_vida: [],
    mantenimientos_preventivos: [],
    correctivo: [],
    reportes: [],
    invima: [],
    factura: [],
    importacion: [],
    ficha_tecnica: [],
    guia_rapida: [],
    otros: [],
  }

  for (const doc of documentos) {
    if (agrupados[doc.tipo]) {
      agrupados[doc.tipo].push(doc)
    }
  }

  return agrupados
}

/**
 * Formatear tamaño de archivo en formato legible.
 */
export function formatearTamaño(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Obtener información de icono según tipo de documento.
 */
export function obtenerIconoTipo(tipo: TipoDocumento): { nombre: string; clase: string } {
  const iconos: Record<TipoDocumento, { nombre: string; clase: string }> = {
    manual: { nombre: 'BookOpen', clase: 'icon-manual' },
    plano: { nombre: 'Ruler', clase: 'icon-plano' },
    calibracion: { nombre: 'Cog', clase: 'icon-calibracion' },
    hoja_de_vida: { nombre: 'FileText', clase: 'icon-hoja-vida' },
    mantenimientos_preventivos: { nombre: 'Wrench', clase: 'icon-mantenimientos' },
    correctivo: { nombre: 'AlertCircle', clase: 'icon-correctivo' },
    reportes: { nombre: 'BarChart3', clase: 'icon-reportes' },
    invima: { nombre: 'Shield', clase: 'icon-invima' },
    factura: { nombre: 'Receipt', clase: 'icon-factura' },
    importacion: { nombre: 'Download', clase: 'icon-importacion' },
    ficha_tecnica: { nombre: 'Zap', clase: 'icon-ficha-tecnica' },
    guia_rapida: { nombre: 'HelpCircle', clase: 'icon-guia-rapida' },
    otros: { nombre: 'MoreHorizontal', clase: 'icon-otros' },
  }
  return iconos[tipo]
}
