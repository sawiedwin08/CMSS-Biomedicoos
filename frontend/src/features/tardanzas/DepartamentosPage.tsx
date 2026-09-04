import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import { departamentosApi, type Departamento } from './tardanzasApi'

export function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [notas, setNotas] = useState('')
  const [editando, setEditando] = useState<number | null>(null)

  useEffect(() => {
    cargar()
  }, [])

  const cargar = async () => {
    try {
      setLoading(true)
      const datos = await departamentosApi.listar()
      setDepartamentos(datos)
    } catch (error) {
      console.error('Error cargando departamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    try {
      if (editando) {
        const actualizado = await departamentosApi.actualizar(editando, {
          nombre,
          notas,
        })
        setDepartamentos(
          departamentos.map((d) => (d.id === editando ? actualizado : d))
        )
        setEditando(null)
      } else {
        const nuevo = await departamentosApi.crear({ nombre, notas })
        setDepartamentos([...departamentos, nuevo])
      }
      setNombre('')
      setNotas('')
    } catch (error) {
      console.error('Error guardando:', error)
    }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Confirmar eliminación?')) return
    try {
      await departamentosApi.eliminar(id)
      setDepartamentos(departamentos.filter((d) => d.id !== id))
    } catch (error) {
      console.error('Error eliminando:', error)
    }
  }

  const handleCambiarEstado = async (id: number, activo: boolean) => {
    try {
      const actualizado = await departamentosApi.cambiarEstado(id, !activo)
      setDepartamentos(
        departamentos.map((d) => (d.id === id ? actualizado : d))
      )
    } catch (error) {
      console.error('Error cambiando estado:', error)
    }
  }

  const handleEditar = (dept: Departamento) => {
    setEditando(dept.id)
    setNombre(dept.nombre)
    setNotas(dept.notas || '')
  }

  const handleCancelar = () => {
    setEditando(null)
    setNombre('')
    setNotas('')
  }

  return (
    <div className="page">
      <div className="card">
        <h2 className="text-lg font-bold mb-4">Crear Departamento</h2>
        <form onSubmit={handleCrear} className="space-y-3">
          <input
            type="text"
            placeholder="Nombre del departamento"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input"
          />
          <textarea
            placeholder="Notas (opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="input resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1">
              <Plus size={16} />
              {editando ? 'Actualizar' : 'Crear'}
            </button>
            {editando && (
              <button
                type="button"
                onClick={handleCancelar}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-4">Departamentos</h2>
        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : departamentos.length === 0 ? (
          <p className="text-gray-500">Sin departamentos</p>
        ) : (
          <div className="space-y-2">
            {departamentos.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="font-semibold">{dept.nombre}</div>
                  {dept.notas && (
                    <div className="text-sm text-gray-600">{dept.notas}</div>
                  )}
                  {dept.es_eliminado && (
                    <div className="text-xs text-red-600">Eliminado</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCambiarEstado(dept.id, dept.activo)}
                    className="btn btn-sm btn-ghost"
                    title={dept.activo ? 'Desactivar' : 'Activar'}
                  >
                    {dept.activo ? (
                      <ToggleRight size={18} className="text-green-600" />
                    ) : (
                      <ToggleLeft size={18} className="text-gray-400" />
                    )}
                  </button>
                  {!dept.es_eliminado && (
                    <>
                      <button
                        onClick={() => handleEditar(dept)}
                        className="btn btn-sm btn-ghost"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(dept.id)}
                        className="btn btn-sm btn-ghost text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
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
