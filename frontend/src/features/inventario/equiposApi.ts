import type {
  ClasificacionRiesgo,
  Equipo,
  EstadoEquipo,
  Propiedad,
} from '../../entities/equipo'
import { api } from '../../shared/api/client'

export interface DatosEquipo {
  // Identificación
  codigo_interno: string
  serial_fabricante: string
  nombre: string
  estado: EstadoEquipo
  marca: string | null
  modelo: string | null
  numero_activo: string | null
  // Ubicación
  sede_id: number | null
  servicio_id: number | null
  piso: string | null
  // Clasificación
  clase_biomedica: string | null
  clase_uso: string | null
  clasificacion_riesgo: ClasificacionRiesgo | null
  tecnologia_predominante: string | null
  // Fabricante
  fabricante: string | null
  anio_fabricacion: number | null
  pais_fabricante: string | null
  ciudad_fabricante: string | null
  direccion_fabricante: string | null
  telefono_fabricante: string | null
  correo_fabricante: string | null
  // Representante
  representante: string | null
  pais_representante: string | null
  ciudad_representante: string | null
  direccion_representante: string | null
  telefono_representante: string | null
  correo_representante: string | null
  // Especificaciones técnicas
  voltaje_operacion: string | null
  voltaje_maximo: string | null
  corriente_maxima: string | null
  corriente_minima: string | null
  potencia_consumida: string | null
  frecuencia: string | null
  presion: string | null
  velocidad: string | null
  temperatura: string | null
  peso: string | null
  capacidad: string | null
  fuentes_alimentacion: string[]
  // Documentación
  manuales: string[]
  planos: string[]
  recomendaciones_fabricante: string[]
  // Adquisición y garantía
  modo_adquisicion: string | null
  propiedad: Propiedad | null
  proveedor_id: number | null
  fecha_adquisicion: string | null
  costo_adquisicion: string | null
  orden_compra: string | null
  fecha_inicial_garantia: string | null
  fecha_final_garantia: string | null
  // Instalación
  fecha_instalacion: string | null
  fecha_funcionamiento: string | null
  // Registro sanitario
  registro_invima: string | null
  fecha_vencimiento_invima: string | null
  // Mantenimiento / operación
  periodicidad_mantenimiento: string | null
  calibracion_si: boolean
  calibracion_no: boolean
  equipo_movil: boolean
  equipo_fijo: boolean
  accesorios: string | null
  descripcion_funcional: string | null
}

export interface FiltroEquipos {
  texto?: string
  sede_id?: number
  servicio_id?: number
  estado?: EstadoEquipo
  propiedad?: Propiedad
  clasificacion_riesgo?: ClasificacionRiesgo
}

export async function listarEquipos(filtro: FiltroEquipos = {}): Promise<Equipo[]> {
  const params: Record<string, string | number> = {}
  if (filtro.texto) params.texto = filtro.texto
  if (filtro.sede_id) params.sede_id = filtro.sede_id
  if (filtro.servicio_id) params.servicio_id = filtro.servicio_id
  if (filtro.estado) params.estado = filtro.estado
  if (filtro.propiedad) params.propiedad = filtro.propiedad
  if (filtro.clasificacion_riesgo) params.clasificacion_riesgo = filtro.clasificacion_riesgo
  const { data } = await api.get<Equipo[]>('/equipos', { params })
  return data
}

export async function crearEquipo(payload: DatosEquipo): Promise<Equipo> {
  const { data } = await api.post<Equipo>('/equipos', payload)
  return data
}

export async function actualizarEquipo(
  id: number,
  payload: DatosEquipo,
): Promise<Equipo> {
  const { data } = await api.put<Equipo>(`/equipos/${id}`, payload)
  return data
}

export async function eliminarEquipo(id: number): Promise<void> {
  await api.delete(`/equipos/${id}`)
}

export interface ResultadoImportacion {
  total: number
  creados: number
  errores: { fila: number; mensaje: string }[]
}

export async function importarEquipos(archivo: File): Promise<ResultadoImportacion> {
  const fd = new FormData()
  fd.append('archivo', archivo)
  const { data } = await api.post<ResultadoImportacion>('/equipos/importar', fd)
  return data
}

export async function descargarPlantilla(): Promise<void> {
  const res = await api.get('/equipos/plantilla', { responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla_equipos.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
