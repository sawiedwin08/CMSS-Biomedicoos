export interface Proveedor {
  id: number
  nombre: string
  nit: string | null
  contacto: string | null
  telefono: string | null
  email: string | null
  activo: boolean
}
