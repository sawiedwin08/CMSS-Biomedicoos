/**
 * Componente para visualizar el historial de movimientos de un equipo.
 * Muestra una timeline con todos los cambios de ubicación (sede/servicio).
 */
import { MapPin, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../shared/api/client'

export interface Movimiento {
  id: number
  equipo_id: number
  sede_origen_id: number | null
  servicio_origen_id: number | null
  sede_origen_nombre: string | null
  servicio_origen_nombre: string | null
  sede_destino_id: number | null
  servicio_destino_id: number | null
  sede_destino_nombre: string | null
  servicio_destino_nombre: string | null
  motivo: string | null
  responsable: string | null
  fecha_movimiento: string
}

interface HistorialMovimientosProps {
  equipoId: number
  puedeEditar: boolean
}

export function HistorialMovimientos({
  equipoId,
  puedeEditar,
}: HistorialMovimientosProps) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarHistorial()
  }, [equipoId])

  async function cargarHistorial() {
    setCargando(true)
    setError(null)
    try {
      const { data } = await api.get<Movimiento[]>(
        `/equipos/${equipoId}/movimientos`
      )
      setMovimientos(data)
    } catch {
      setError('No se pudo cargar el historial de movimientos.')
    } finally {
      setCargando(false)
    }
  }

  async function eliminarMovimiento(movimientoId: number) {
    if (!window.confirm('¿Eliminar este movimiento del historial?')) return

    try {
      await api.delete(`/equipos/${equipoId}/movimientos/${movimientoId}`)
      setMovimientos(movimientos.filter((m) => m.id !== movimientoId))
    } catch {
      setError('Error al eliminar el movimiento.')
    }
  }

  function formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO)
    return fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function obtenerUbicacion(
    sede: string | null,
    servicio: string | null
  ): string {
    if (sede && servicio) return `${sede} - ${servicio}`
    if (sede) return sede
    if (servicio) return servicio
    return '(sin especificar)'
  }

  if (cargando) return <div className="muted small">Cargando historial…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <MapPin size={20} />
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
          Historial de Ubicaciones
        </h4>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {movimientos.length === 0 ? (
        <div className="muted small" style={{ textAlign: 'center', padding: '20px' }}>
          Sin movimientos registrados.
        </div>
      ) : (
        <div className="docs-tabla-container">
          <table className="docs-tabla">
            <thead>
              <tr>
                <th>Ubicación origen</th>
                <th>Ubicación destino</th>
                <th>Fecha</th>
                <th>Responsable</th>
                <th>Motivo</th>
                {puedeEditar && <th style={{ textAlign: 'right' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov) => (
                <tr key={mov.id}>
                  <td>{obtenerUbicacion(mov.sede_origen_nombre, mov.servicio_origen_nombre)}</td>
                  <td className="docs-nombre-col">
                    {obtenerUbicacion(mov.sede_destino_nombre, mov.servicio_destino_nombre)}
                  </td>
                  <td className="docs-usuario-col">{formatearFecha(mov.fecha_movimiento)}</td>
                  <td className="docs-usuario-col">{mov.responsable || '—'}</td>
                  <td>{mov.motivo || '—'}</td>
                  {puedeEditar && (
                    <td className="docs-acciones-col">
                      <button
                        className="icon-btn"
                        title="Eliminar movimiento"
                        onClick={() => eliminarMovimiento(mov.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
