export interface Permiso {
  id: number
  modulo: string
  accion: string
  codigo: string
  descripcion: string | null
}

export interface Rol {
  id: number
  nombre: string
  descripcion: string | null
  es_sistema: boolean
  permisos: Permiso[]
}
