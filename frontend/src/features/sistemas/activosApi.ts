import type {
  Activo,
  CategoriaActivo,
  EstadoActivo,
  MotivoBaja,
} from '../../entities/activo'
import { api } from '../../shared/api/client'

/** Payload para crear/editar un activo (coincide con ActivoCreate del backend). */
export type DatosActivo = Omit<
  Activo,
  'id' | 'fecha_baja' | 'motivo_baja' | 'baja_autorizado_por' | 'acta_baja'
>

export interface FiltroActivos {
  texto?: string
  categoria?: CategoriaActivo
  estado?: EstadoActivo
  sede_id?: number
  asignado_a_usuario_id?: number
}

export interface DatosBaja {
  motivo_baja: MotivoBaja
  fecha_baja?: string | null
  baja_autorizado_por?: string | null
  acta_baja?: string | null
}

export async function listarActivos(filtro: FiltroActivos = {}): Promise<Activo[]> {
  const params: Record<string, string | number> = {}
  if (filtro.texto) params.texto = filtro.texto
  if (filtro.categoria) params.categoria = filtro.categoria
  if (filtro.estado) params.estado = filtro.estado
  if (filtro.sede_id) params.sede_id = filtro.sede_id
  if (filtro.asignado_a_usuario_id) params.asignado_a_usuario_id = filtro.asignado_a_usuario_id
  const { data } = await api.get<Activo[]>('/sistemas/activos', { params })
  return data
}

export async function listarBajas(): Promise<Activo[]> {
  const { data } = await api.get<Activo[]>('/sistemas/activos/bajas')
  return data
}

export async function crearActivo(payload: DatosActivo): Promise<Activo> {
  const { data } = await api.post<Activo>('/sistemas/activos', payload)
  return data
}

export async function actualizarActivo(id: number, payload: DatosActivo): Promise<Activo> {
  const { data } = await api.put<Activo>(`/sistemas/activos/${id}`, payload)
  return data
}

export async function darDeBajaActivo(id: number, payload: DatosBaja): Promise<Activo> {
  const { data } = await api.post<Activo>(`/sistemas/activos/${id}/baja`, payload)
  return data
}

export async function eliminarActivo(id: number): Promise<void> {
  await api.delete(`/sistemas/activos/${id}`)
}

// --- Importar / exportar Excel ---
export interface ResultadoImportacion {
  total: number
  creados: number
  errores: { fila: number; mensaje: string }[]
}

export async function importarActivos(archivo: File): Promise<ResultadoImportacion> {
  const fd = new FormData()
  fd.append('archivo', archivo)
  const { data } = await api.post<ResultadoImportacion>('/sistemas/activos/importar', fd)
  return data
}

async function descargarBlob(ruta: string, nombre: string): Promise<void> {
  const res = await api.get(ruta, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function descargarPlantilla(): Promise<void> {
  return descargarBlob('/sistemas/activos/plantilla', 'plantilla_activos.xlsx')
}

export function exportarActivos(): Promise<void> {
  return descargarBlob('/sistemas/activos/exportar', 'inventario_activos.xlsx')
}

// --- Documentos adjuntos ---
export interface DocumentoActivo {
  id: number
  activo_id: number
  usuario_id: number | null
  usuario: { id: number; nombre: string } | null
  tipo: string
  nombre_archivo: string
  tamano_bytes: number
  mime_type: string
  descripcion: string | null
  created_at: string
}

export async function listarDocumentos(activoId: number): Promise<DocumentoActivo[]> {
  const { data } = await api.get<DocumentoActivo[]>(`/sistemas/activos/${activoId}/documentos`)
  return data
}

export async function subirDocumento(
  activoId: number,
  tipo: string,
  archivo: File,
  descripcion?: string,
): Promise<DocumentoActivo> {
  const fd = new FormData()
  fd.append('archivo', archivo)
  const params: Record<string, string> = { tipo }
  if (descripcion) params.descripcion = descripcion
  const { data } = await api.post<DocumentoActivo>(
    `/sistemas/activos/${activoId}/documentos`,
    fd,
    { params },
  )
  return data
}

export function descargarDocumento(activoId: number, doc: DocumentoActivo): Promise<void> {
  return descargarBlob(`/sistemas/activos/${activoId}/documentos/${doc.id}`, doc.nombre_archivo)
}

export async function eliminarDocumento(activoId: number, documentoId: number): Promise<void> {
  await api.delete(`/sistemas/activos/${activoId}/documentos/${documentoId}`)
}

/** Devuelve un object URL del documento para visualizarlo (sin descargar). */
export async function urlDocumento(activoId: number, documentoId: number): Promise<string> {
  const res = await api.get(`/sistemas/activos/${activoId}/documentos/${documentoId}`, {
    responseType: 'blob',
  })
  return URL.createObjectURL(res.data as Blob)
}

// --- Movimientos / historial ---
export interface MovimientoActivo {
  id: number
  activo_id: number
  sede_origen_id: number | null
  area_origen_id: number | null
  sede_destino_id: number | null
  area_destino_id: number | null
  usuario_origen_id: number | null
  usuario_destino_id: number | null
  motivo: string | null
  responsable: string | null
  fecha_movimiento: string
  sede_origen_nombre: string | null
  area_origen_nombre: string | null
  sede_destino_nombre: string | null
  area_destino_nombre: string | null
  usuario_origen_nombre: string | null
  usuario_destino_nombre: string | null
}

export interface DatosMovimiento {
  sede_destino_id: number | null
  area_destino_id: number | null
  usuario_destino_id: number | null
  motivo?: string | null
  responsable?: string | null
}

export async function listarMovimientos(activoId: number): Promise<MovimientoActivo[]> {
  const { data } = await api.get<MovimientoActivo[]>(`/sistemas/activos/${activoId}/movimientos`)
  return data
}

export async function registrarMovimiento(
  activoId: number,
  payload: DatosMovimiento,
): Promise<MovimientoActivo> {
  const { data } = await api.post<MovimientoActivo>(
    `/sistemas/activos/${activoId}/movimientos`,
    payload,
  )
  return data
}

// --- Acta de asignación ---
export interface AccesorioItem {
  nombre: string
  entregado: boolean
  marca_serie?: string | null
  observaciones?: string | null
}

export interface ActaAsignacionDatos {
  codigo?: string | null
  fecha?: string | null
  funcionario_nombre?: string | null
  funcionario_documento?: string | null
  funcionario_cargo?: string | null
  dependencia?: string | null
  correo?: string | null
  telefono?: string | null
  estado_condicion?: string | null
  observaciones_estado?: string | null
  accesorios: AccesorioItem[]
  entrega_nombre?: string | null
  entrega_cargo?: string | null
  recibe_nombre?: string | null
  recibe_cargo?: string | null
}

export async function previewActaAsignacion(
  activoId: number,
  datos: ActaAsignacionDatos,
): Promise<string> {
  const res = await api.post(`/sistemas/activos/${activoId}/acta-asignacion/preview`, datos, {
    responseType: 'blob',
  })
  return URL.createObjectURL(res.data as Blob)
}

export async function guardarActaAsignacion(
  activoId: number,
  datos: ActaAsignacionDatos,
): Promise<DocumentoActivo> {
  const { data } = await api.post<DocumentoActivo>(
    `/sistemas/activos/${activoId}/acta-asignacion`,
    datos,
  )
  return data
}

// --- Lista global de actas (sección Actas) ---
export interface ActaItem {
  id: number
  activo_id: number
  activo_codigo: string
  activo_nombre: string
  tipo: string
  nombre_archivo: string
  descripcion: string | null
  usuario: { id: number; nombre: string } | null
  created_at: string
}

export async function listarActas(): Promise<ActaItem[]> {
  const { data } = await api.get<ActaItem[]>('/sistemas/activos/actas')
  return data
}

export function descargarActa(activoId: number, docId: number, nombre: string): Promise<void> {
  return descargarBlob(`/sistemas/activos/${activoId}/documentos/${docId}`, nombre)
}

// --- Mantenimientos (bitácora) + Hoja de Vida ---
export type TipoMantenimiento = 'verificacion' | 'preventivo' | 'correctivo' | 'seguimiento'

export interface Mantenimiento {
  id: number
  activo_id: number
  tipo: TipoMantenimiento
  fecha: string | null
  responsable: string | null
  descripcion: string | null
  created_at: string
}

export interface MantenimientoItem extends Mantenimiento {
  activo_codigo: string
  activo_nombre: string
}

export interface DatosMantenimiento {
  tipo: TipoMantenimiento
  fecha?: string | null
  responsable?: string | null
  descripcion?: string | null
}

export async function listarMantenimientos(activoId: number): Promise<Mantenimiento[]> {
  const { data } = await api.get<Mantenimiento[]>(`/sistemas/activos/${activoId}/mantenimientos`)
  return data
}

export async function registrarMantenimiento(
  activoId: number,
  payload: DatosMantenimiento,
): Promise<Mantenimiento> {
  const { data } = await api.post<Mantenimiento>(
    `/sistemas/activos/${activoId}/mantenimientos`,
    payload,
  )
  return data
}

export async function eliminarMantenimiento(activoId: number, mantId: number): Promise<void> {
  await api.delete(`/sistemas/activos/${activoId}/mantenimientos/${mantId}`)
}

export async function listarMantenimientosGlobal(): Promise<MantenimientoItem[]> {
  const { data } = await api.get<MantenimientoItem[]>('/sistemas/activos/mantenimientos')
  return data
}

export async function previewHojaVida(activoId: number): Promise<string> {
  const res = await api.get(`/sistemas/activos/${activoId}/hoja-vida/preview`, {
    responseType: 'blob',
  })
  return URL.createObjectURL(res.data as Blob)
}

export async function guardarHojaVida(activoId: number): Promise<DocumentoActivo> {
  const { data } = await api.post<DocumentoActivo>(`/sistemas/activos/${activoId}/hoja-vida`, {})
  return data
}

export const ETIQUETA_TIPO_MANT: Record<TipoMantenimiento, string> = {
  verificacion: 'Verificación',
  preventivo: 'Preventivo',
  correctivo: 'Correctivo',
  seguimiento: 'Seguimiento',
}

// --- Opciones para los selectores del formulario (maestros compartidos) ---
export interface Opcion {
  id: number
  nombre: string
  sede_id?: number
}

async function cargarOpciones(ruta: string): Promise<Opcion[]> {
  try {
    const { data } = await api.get<Opcion[]>(ruta)
    return data
  } catch {
    // Si el usuario no tiene permiso sobre el maestro, el selector queda vacío.
    return []
  }
}

export function listarSedesOpc(): Promise<Opcion[]> {
  return cargarOpciones('/sedes')
}

export function listarAreasOpc(): Promise<Opcion[]> {
  return cargarOpciones('/servicios')
}

export function listarProveedoresOpc(): Promise<Opcion[]> {
  return cargarOpciones('/proveedores')
}

export function listarUsuariosOpc(): Promise<Opcion[]> {
  return cargarOpciones('/usuarios')
}
