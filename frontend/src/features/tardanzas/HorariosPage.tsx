import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  departamentosApi,
  horariosApi,
  type Departamento,
  type Schedule,
  type ScheduleBlock,
} from './tardanzasApi'

const DIAS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]
const DIAS_LABELS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

export function HorariosPage() {
  const [horarios, setHorarios] = useState<Schedule[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [tolerancia, setToleancia] = useState(0)
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([])
  const [bloques, setBloques] = useState<ScheduleBlock[]>([])
  const [editando, setEditando] = useState<number | null>(null)

  useEffect(() => {
    cargar()
  }, [])

  const cargar = async () => {
    try {
      setLoading(true)
      const [hrs, depts] = await Promise.all([
        horariosApi.listar(),
        departamentosApi.listar(),
      ])
      setHorarios(hrs)
      setDepartamentos(depts.filter((d) => d.activo && !d.es_eliminado))
    } catch (error) {
      console.error('Error cargando:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !departmentId) return

    try {
      const nuevoHorario: typeof horariosApi.crear = (datos: any) =>
        horariosApi.crear(datos)

      const horario = await nuevoHorario({
        department_id: departmentId as number,
        nombre,
        tolerancia_min: tolerancia,
        dias_semana: diasSeleccionados,
        bloques,
      })

      if (editando) {
        setHorarios(horarios.map((h) => (h.id === editando ? horario : h)))
        setEditando(null)
      } else {
        setHorarios([...horarios, horario])
      }

      reset()
    } catch (error) {
      console.error('Error guardando:', error)
    }
  }

  const handleCambiarEstado = async (id: number, activo: boolean) => {
    try {
      const actualizado = await horariosApi.cambiarEstado(id, !activo)
      setHorarios(horarios.map((h) => (h.id === id ? actualizado : h)))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Confirmar eliminación?')) return
    try {
      await horariosApi.eliminar(id)
      setHorarios(horarios.filter((h) => h.id !== id))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const reset = () => {
    setNombre('')
    setDepartmentId('')
    setToleancia(0)
    setDiasSeleccionados([])
    setBloques([])
  }

  return (
    <div className="page">
      <div className="card">
        <h2 className="text-lg font-bold mb-4">Crear Horario</h2>
        <form onSubmit={handleCrear} className="space-y-3">
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
            className="input"
          >
            <option value="">Seleccionar departamento</option>
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Nombre del horario"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input"
          />

          <input
            type="number"
            placeholder="Tolerancia (minutos)"
            min="0"
            value={tolerancia}
            onChange={(e) => setToleancia(Number(e.target.value))}
            className="input"
          />

          <div className="space-y-1">
            <label className="text-sm font-semibold">Días de la semana</label>
            <div className="grid grid-cols-4 gap-2">
              {DIAS.map((dia, idx) => (
                <label key={dia} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={diasSeleccionados.includes(dia)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDiasSeleccionados([...diasSeleccionados, dia])
                      } else {
                        setDiasSeleccionados(
                          diasSeleccionados.filter((d) => d !== dia)
                        )
                      }
                    }}
                  />
                  {DIAS_LABELS[idx]}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full">
            <Plus size={16} />
            {editando ? 'Actualizar' : 'Crear'} Horario
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-4">Horarios Activos</h2>
        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : horarios.length === 0 ? (
          <p className="text-gray-500">Sin horarios</p>
        ) : (
          <div className="space-y-2">
            {horarios.map((horario) => (
              <div
                key={horario.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <div className="font-semibold">{horario.nombre}</div>
                  <div className="text-sm text-gray-600">
                    {departamentos
                      .find((d) => d.id === horario.department_id)
                      ?.nombre || 'N/A'}{' '}
                    • Tolerancia: {horario.tolerancia_min}min
                  </div>
                  <div className="text-xs text-gray-500">
                    {horario.dias_semana.join(', ')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCambiarEstado(horario.id, horario.activo)}
                    className="btn btn-sm btn-ghost"
                  >
                    {horario.activo ? (
                      <ToggleRight size={18} className="text-green-600" />
                    ) : (
                      <ToggleLeft size={18} className="text-gray-400" />
                    )}
                  </button>
                  {!horario.es_eliminado && (
                    <button
                      onClick={() => handleEliminar(horario.id)}
                      className="btn btn-sm btn-ghost text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
