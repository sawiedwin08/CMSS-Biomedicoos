/**
 * Componente para visualizar el historial de movimientos de un equipo.
 * Muestra una timeline con todos los cambios de ubicación (sede/servicio).
 */
import { MapPin, Calendar, User, Trash2, AlertCircle } from 'lucide-react'
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
    <div className="historial-section">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <MapPin size={20} />
        <h4 className="historial-titulo">Historial de Ubicaciones (RF-004)</h4>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {movimientos.length === 0 ? (
        <div className="muted small" style={{ textAlign: 'center', padding: '20px' }}>
          {cargando ? 'Cargando...' : 'Sin movimientos registrados.'}
        </div>
      ) : (
        <div className="timeline-container">
          {movimientos.map((mov, idx) => (
            <div key={mov.id} className="timeline-item">
              {/* Línea conectora (no en el último) */}
              {idx < movimientos.length - 1 && <div className="timeline-line" />}

              {/* Nodo del timeline */}
              <div className="timeline-node">
                <div className="timeline-dot" />
              </div>

              {/* Contenido */}
              <div className="timeline-content">
                <div className="timeline-header">
                  <div className="timeline-cambio">
                    <strong>{obtenerUbicacion(mov.sede_origen_nombre, mov.servicio_origen_nombre)}</strong>
                    <span className="timeline-flecha">→</span>
                    <strong>{obtenerUbicacion(mov.sede_destino_nombre, mov.servicio_destino_nombre)}</strong>
                  </div>

                  {puedeEditar && (
                    <button
                      className="icon-btn delete-btn"
                      title="Eliminar movimiento"
                      onClick={() => eliminarMovimiento(mov.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="timeline-detalles">
                  <div className="detalle-item">
                    <Calendar size={14} />
                    <span>{formatearFecha(mov.fecha_movimiento)}</span>
                  </div>

                  {mov.responsable && (
                    <div className="detalle-item">
                      <User size={14} />
                      <span>{mov.responsable}</span>
                    </div>
                  )}
                </div>

                {mov.motivo && (
                  <div className="timeline-motivo">
                    <AlertCircle size={14} />
                    <span>{mov.motivo}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .historial-section {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }

        .historial-titulo {
          margin: 0;
          color: var(--color-text);
          font-size: 0.95rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .timeline-container {
          position: relative;
          padding-left: 20px;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 24px;
          display: flex;
          gap: 16px;
        }

        .timeline-node {
          position: relative;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          margin-left: -32px;
        }

        .timeline-dot {
          position: absolute;
          left: 0;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid var(--color-bg);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .timeline-line {
          position: absolute;
          left: 4px;
          top: 24px;
          width: 2px;
          height: calc(100% + 24px);
          background: var(--color-border);
        }

        .timeline-content {
          flex: 1;
          background: var(--color-bg-secondary);
          padding: 12px;
          border-radius: 6px;
          border-left: 2px solid var(--color-primary-light);
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }

        .timeline-cambio {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          flex-wrap: wrap;
        }

        .timeline-flecha {
          color: var(--color-text-secondary);
          margin: 0 4px;
        }

        .timeline-detalles {
          display: flex;
          gap: 16px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .detalle-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }

        .timeline-motivo {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px;
          background: var(--color-bg-tertiary);
          border-radius: 4px;
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          margin-top: 8px;
        }

        .delete-btn {
          padding: 4px 6px;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .delete-btn:hover {
          opacity: 1;
          color: var(--color-danger);
        }

        @media (max-width: 600px) {
          .timeline-container {
            padding-left: 0;
          }

          .timeline-node {
            margin-left: 0;
          }

          .timeline-cambio {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  )
}
