import { Wrench, X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { api } from '../../shared/api/client'
import {
  obtenerOrdenesTrabajo,
  obtenerChecklist,
  obtenerEjecucionOT,
  type OTRead,
  type EstadoOT,
  type ChecklistEquipoRead,
  type EstadoChecklist,
} from './mantenimientoApi'
import { HojaRutina } from './HojaRutina'

interface OrdenesTrabajoProps {
  equipoId: number
  equipoNombre?: string
  puedeEditar: boolean
}

const COLORES_ESTADO: Record<EstadoOT, string> = {
  pendiente: '#FFA500',
  en_progreso: '#4A90E2',
  completada: '#52C41A',
  cancelada: '#D9D9D9',
}

const ETIQUETAS_ESTADO: Record<EstadoOT, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

export function OrdenesTrabajo({ equipoId, equipoNombre, puedeEditar }: OrdenesTrabajoProps) {
  const [ordenes, setOrdenes] = useState<OTRead[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seleccionada, setSeleccionada] = useState<OTRead | null>(null)

  useEffect(() => {
    cargarOrdenes()
  }, [equipoId])

  async function cargarOrdenes() {
    setCargando(true)
    setError(null)
    try {
      const ots = await obtenerOrdenesTrabajo(equipoId)
      setOrdenes(ots)
    } catch {
      setError('No se pudieron cargar las órdenes de trabajo.')
    } finally {
      setCargando(false)
    }
  }

function formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO)
    return fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (cargando) return <div className="muted small">Cargando órdenes de trabajo…</div>

  return (
    <div className="ordenes-section">
      <h4 className="ordenes-titulo" style={{ marginBottom: '12px' }}>
        <Wrench size={20} /> Órdenes de Trabajo
      </h4>

      {error && <div className="alert-error">{error}</div>}

      {ordenes.length === 0 ? (
        <div className="muted small" style={{ textAlign: 'center', padding: '20px' }}>
          Sin órdenes de trabajo.
        </div>
      ) : (
        <div className="ordenes-tabla-container">
          <table className="ordenes-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Equipo</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Fecha Prog.</th>
                <th>Técnico</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((ot) => (
                <tr key={ot.id} onClick={() => setSeleccionada(ot)} style={{ cursor: 'pointer' }}>
                  <td className="ordenes-id-col">#{ot.id}</td>
                  <td className="ordenes-equipo-col">{equipoNombre || '—'}</td>
                  <td className="ordenes-tipo-col">
                    {ot.tipo === 'preventivo' && '🛡️ Preventivo'}
                    {ot.tipo === 'correctivo' && '🔧 Correctivo'}
                    {ot.tipo === 'calibracion' && '⚖️ Calibración'}
                  </td>
                  <td className="ordenes-estado-col">
                    <span
                      className="estado-badge"
                      style={{
                        backgroundColor: COLORES_ESTADO[ot.estado],
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      {ETIQUETAS_ESTADO[ot.estado]}
                    </span>
                  </td>
                  <td className="ordenes-fecha-col">
                    {ot.fecha_programada ? formatearFecha(ot.fecha_programada) : '—'}
                  </td>
                  <td className="ordenes-tecnico-col">
                    {ot.tecnico_nombre ?? '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="icon-btn" title="Ver detalle">
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

{seleccionada && (
        <DetalleOTModal
          ot={seleccionada}
          equipoId={equipoId}
          onCerrar={() => setSeleccionada(null)}
          onActualizar={() => cargarOrdenes()}
        />
      )}

      <style>{`
        .ordenes-section {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }

        .ordenes-titulo {
          margin: 0;
          color: var(--color-text);
          font-size: 0.95rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ordenes-tabla-container {
          border: 1px solid var(--color-border);
          border-radius: 6px;
          overflow: hidden;
          background: var(--color-bg);
        }

        .ordenes-tabla {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .ordenes-tabla thead {
          background: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border);
          font-weight: 600;
        }

        .ordenes-tabla th {
          padding: 10px 12px;
          text-align: left;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--color-text-secondary);
        }

        .ordenes-tabla tbody tr {
          border-bottom: 1px solid var(--color-border);
          transition: background 0.2s;
        }

        .ordenes-tabla tbody tr:hover {
          background: var(--color-bg-hover);
        }

        .ordenes-tabla td {
          padding: 10px 12px;
          color: var(--color-text);
        }

        .ordenes-id-col {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .ordenes-tipo-col {
          font-size: 0.85rem;
        }

        .ordenes-estado-col {
          font-size: 0.85rem;
        }

        .ordenes-fecha-col {
          color: var(--color-text-secondary);
          font-size: 0.8rem;
        }

        .ordenes-tecnico-col {
          color: var(--color-text-secondary);
          font-size: 0.8rem;
        }

        @media (max-width: 800px) {
          .ordenes-tabla {
            font-size: 0.75rem;
          }

          .ordenes-tabla th,
          .ordenes-tabla td {
            padding: 8px 6px;
          }
        }
      `}</style>
    </div>
  )
}

function DetalleOTModal({
  ot,
  equipoId,
  onCerrar,
  onActualizar,
}: {
  ot: OTRead
  equipoId: number
  onCerrar: () => void
  onActualizar: () => void
}) {
  const [checklist, setChecklist] = useState<ChecklistEquipoRead | null>(null)
  const [ejecucion, setEjecucion] = useState<Record<number, EstadoChecklist>>({})
  const [cargando, setCargando] = useState(true)
  const [verRutina, setVerRutina] = useState(false)
  const [equipo, setEquipo] = useState<any>(null)

  useEffect(() => {
    cargarDetalles()
  }, [ot.id])

  async function cargarDetalles() {
    setCargando(true)
    try {
      const [c, e, eq] = await Promise.all([
        obtenerChecklist(equipoId),
        obtenerEjecucionOT(ot.id),
        api.get(`/equipos/${equipoId}`),
      ])
      setChecklist(c)
      setEquipo(eq.data)
      if (e.length) {
        const ejecMap: Record<number, EstadoChecklist> = {}
        e.forEach((ex) => {
          ejecMap[ex.paso_id] = ex.estado
        })
        setEjecucion(ejecMap)
      }
    } catch (err) {
      console.error('Error cargando detalles:', err)
    } finally {
      setCargando(false)
    }
  }



  function formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO)
    return fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal card modal-ancho" onClick={(e) => e.stopPropagation()}>
        <div className="detail-head">
          <div>
            <h3 style={{ margin: 0 }}>OT #{ot.id}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--muted)' }}>
              {ot.tipo === 'preventivo' && '🛡️ Preventivo'}
              {ot.tipo === 'correctivo' && '🔧 Correctivo'}
              {ot.tipo === 'calibracion' && '⚖️ Calibración'}
            </p>
          </div>
          <button className="btn-ghost" onClick={onCerrar} style={{ padding: '4px 8px' }}>
            <X size={18} />
          </button>
        </div>

        {cargando ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
            Cargando detalles…
          </div>
        ) : (
          <>
            <div className="datos">
              <dt>Estado</dt>
              <dd>
                <span
                  className="badge"
                  style={{
                    backgroundColor: COLORES_ESTADO[ot.estado],
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    display: 'inline-block',
                  }}
                >
                  {ETIQUETAS_ESTADO[ot.estado]}
                </span>
              </dd>
              <dt>Descripción</dt>
              <dd>{ot.descripcion || '—'}</dd>
              <dt>Fecha programada</dt>
              <dd>{ot.fecha_programada ? formatearFecha(ot.fecha_programada) : '—'}</dd>
              <dt>Técnico</dt>
              <dd>{ot.tecnico_nombre ?? '—'}</dd>
            </div>

            {checklist && checklist.pasos.length > 0 && (
              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--borde)',
                }}
              >
                <h4 className="grupo-tit">Checklist: {checklist.nombre}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {checklist.pasos.map((paso) => {
                    const estado = ejecucion[paso.id]
                    return (
                      <div
                        key={paso.id}
                        style={{
                          padding: '12px',
                          background: 'var(--fondo)',
                          border: '1px solid var(--borde)',
                          borderRadius: '6px',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: '0.9rem',
                              marginBottom: '4px',
                            }}
                          >
                            {paso.orden}. {paso.descripcion}
                          </div>
                          {paso.instrucciones && (
                            <div
                              style={{
                                fontSize: '0.85rem',
                                color: 'var(--muted)',
                                fontStyle: 'italic',
                              }}
                            >
                              {paso.instrucciones}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {estado === 'R' && (
                            <CheckCircle size={18} style={{ color: 'var(--ok)' }} />
                          )}
                          {estado === 'NR' && (
                            <XCircle size={18} style={{ color: 'var(--error-tx)' }} />
                          )}
                          {estado === 'PA' && (
                            <AlertTriangle size={18} style={{ color: '#FFA500' }} />
                          )}
                          {!estado && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Sin ejecutar</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-ghost" onClick={onCerrar}>
                Cerrar
              </button>
              <button type="button" className="btn-primary" onClick={() => setVerRutina(true)}>
                Ver Hoja de Rutina
              </button>
              <p className="muted small">Para editar esta orden, ve a <strong>Mantenimiento</strong></p>
            </div>
          </>
        )}
      </div>

      {verRutina && equipo && (
        <HojaRutina
          ot={ot}
          equipo={equipo}
          checklist={checklist}
          ejecucion={ejecucion}
          onClose={() => setVerRutina(false)}
        />
      )}
    </div>
  )
}
