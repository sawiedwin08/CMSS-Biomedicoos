export interface Modulo {
  id: number
  slug: string
  nombre: string
  descripcion: string | null
  icono: string | null
  orden: number
  activo: boolean
}
