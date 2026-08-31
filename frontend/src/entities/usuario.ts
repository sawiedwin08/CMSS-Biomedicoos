export interface Usuario {
  id: number
  nombre: string
  email: string
  activo: boolean
  es_protegido: boolean
  rol_id: number
  rol_nombre: string | null
  permisos: string[]
}
