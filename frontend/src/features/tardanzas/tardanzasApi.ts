import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1/tardanzas',
})

export interface Departamento {
  id: number
  nombre: string
  notas?: string
  activo: boolean
  es_eliminado: boolean
  creado_en: string
  actualizado_en: string
}

export interface ScheduleBlock {
  id?: number
  nombre: string
  hora_inicio: string
  hora_fin: string
  orden: number
  cruza_medianoche: boolean
  es_entrada: boolean
}

export interface Schedule {
  id: number
  department_id: number
  nombre: string
  tipo_horario: string
  dias_semana: string[]
  tolerancia_min: number
  entradas_esperadas?: number
  salidas_esperadas?: number
  activo: boolean
  es_eliminado: boolean
  bloques: ScheduleBlock[]
  creado_en: string
  actualizado_en: string
}

export const departamentosApi = {
  listar: async (): Promise<Departamento[]> => {
    const { data } = await api.get<Departamento[]>('/departamentos')
    return data
  },

  obtener: async (id: number): Promise<Departamento> => {
    const { data } = await api.get<Departamento>(`/departamentos/${id}`)
    return data
  },

  crear: async (datos: {
    nombre: string
    notas?: string
    activo?: boolean
  }): Promise<Departamento> => {
    const { data } = await api.post<Departamento>('/departamentos', datos)
    return data
  },

  actualizar: async (
    id: number,
    datos: { nombre?: string; notas?: string }
  ): Promise<Departamento> => {
    const { data } = await api.put<Departamento>(`/departamentos/${id}`, datos)
    return data
  },

  cambiarEstado: async (id: number, activo: boolean): Promise<Departamento> => {
    const { data } = await api.patch<Departamento>(
      `/departamentos/${id}/estado?es_activo=${activo}`
    )
    return data
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/departamentos/${id}`)
  },

  restaurar: async (id: number): Promise<Departamento> => {
    const { data } = await api.patch<Departamento>(
      `/departamentos/${id}/restaurar`
    )
    return data
  },
}

export const horariosApi = {
  listar: async (): Promise<Schedule[]> => {
    const { data } = await api.get<Schedule[]>('/horarios')
    return data
  },

  listarPorDepartamento: async (departmentId: number): Promise<Schedule[]> => {
    const { data } = await api.get<Schedule[]>(
      `/departamentos/${departmentId}/horarios`
    )
    return data
  },

  obtener: async (id: number): Promise<Schedule> => {
    const { data } = await api.get<Schedule>(`/horarios/${id}`)
    return data
  },

  crear: async (datos: {
    department_id: number
    nombre: string
    tipo_horario?: string
    dias_semana?: string[]
    tolerancia_min?: number
    entradas_esperadas?: number
    salidas_esperadas?: number
    activo?: boolean
    notas?: string
    bloques?: ScheduleBlock[]
  }): Promise<Schedule> => {
    const { data } = await api.post<Schedule>('/horarios', datos)
    return data
  },

  actualizar: async (
    id: number,
    datos: Partial<Schedule>
  ): Promise<Schedule> => {
    const { data } = await api.put<Schedule>(`/horarios/${id}`, datos)
    return data
  },

  cambiarEstado: async (id: number, activo: boolean): Promise<Schedule> => {
    const { data } = await api.patch<Schedule>(
      `/horarios/${id}/estado?es_activo=${activo}`
    )
    return data
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/horarios/${id}`)
  },

  restaurar: async (id: number): Promise<Schedule> => {
    const { data } = await api.patch<Schedule>(`/horarios/${id}/restaurar`)
    return data
  },
}
