import { Wrench, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { api } from '../../shared/api/client'
import { cerrarAlClicFuera } from '../../shared/ui/overlay'
import { AccionesEstadoLote } from './AccionesEstadoLote'
import {
  obtenerOrdenesTrabajo,
  obtenerChecklist,
  obtenerEjecucionOT,
  registrarEjecucionPaso,
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
  onDocumentosChanged?: () => void
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

export function OrdenesTrabajo({
  equipoId,
  equipoNombre,
  onDocumentosChanged,
}: OrdenesTrabajoProps) {
  const [ordenes, setOrdenes] = useState<OTRead[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seleccionada, setSeleccionada] = useState<OTRead | null>(null)
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set())
  const [mensaje, setMensaje] = useState<string | null>(null)

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

  const idsSeleccionables = ordenes.filter((o) => o.estado !== 'completada').map((o) => o.id)
  const todasSel = idsSeleccionables.length > 0 && idsSeleccionables.every((id) => seleccion.has(id))
  function toggleSel(id: number) {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleTodasSel() {
    setSeleccion(() => (todasSel ? new Set() : new Set(idsSeleccionables)))
  }
  async function trasLote(msg: string) {
    setMensaje(msg)
    setSeleccion(new Set())
    await cargarOrdenes()
    setTimeout(() => setMensaje(null), 4000)
  }

  if (cargando) return <div className="muted small">Cargando órdenes de trabajo…</div>

  return (
    <div>
      <h4
        style={{
          margin: '0 0 12px',
          fontSize: '0.95rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Wrench size={20} /> Órdenes de Trabajo
      </h4>

      {error && <div className="alert-error">{error}</div>}
      {mensaje && <div className="alert-ok">{mensaje}</div>}
      {seleccion.size > 0 && (
        <AccionesEstadoLote
          ids={[...seleccion]}
          onLimpiar={() => setSeleccion(new Set())}
          onHecho={trasLote}
        />
      )}

      {ordenes.length === 0 ? (
        <div className="muted small" style={{ textAlign: 'center', padding: '20px' }}>
          Sin órdenes de trabajo.
        </div>
      ) : (
        <div className="docs-tabla-container">
          <table className="docs-tabla">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={todasSel}
                    onChange={toggleTodasSel}
                    disabled={idsSeleccionables.length === 0}
                  />
                </th>
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
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={seleccion.has(ot.id)}
                      disabled={ot.estado === 'completada'}
                      title={ot.estado === 'completada' ? 'Completada: bloqueada' : ''}
                      onChange={() => toggleSel(ot.id)}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>#{ot.id}</td>
                  <td className="docs-nombre-col">
                    {ot.equipo_codigo && (
                      <span
                        style={{
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                          marginRight: 6,
                        }}
                      >
                        {ot.equipo_codigo}
                      </span>
                    )}
                    <span style={{ color: 'var(--muted)' }}>
                      {ot.equipo_nombre || equipoNombre || '—'}
                    </span>
                  </td>
                  <td>
                    {ot.tipo === 'preventivo' && '🛡️ Preventivo'}
                    {ot.tipo === 'correctivo' && '🔧 Correctivo'}
                    {ot.tipo === 'calibracion' && '⚖️ Calibración'}
                  </td>
                  <td>
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
                  <td className="docs-usuario-col">
                    {ot.fecha_programada ? formatearFecha(ot.fecha_programada) : '—'}
                  </td>
                  <td className="docs-usuario-col">{ot.tecnico_nombre ?? '—'}</td>
                  <td className="docs-acciones-col">
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
          onDocumentosChanged={onDocumentosChanged}
        />
      )}
    </div>
  )
}

function DetalleOTModal({
  ot,
  equipoId,
  onCerrar,
  onDocumentosChanged,
}: {
  ot: OTRead
  equipoId: number
  onCerrar: () => void
  onActualizar: () => void
  onDocumentosChanged?: () => void
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

  // Una OT completada queda bloqueada (no se marca).
  const bloqueada = ot.estado === 'completada'

  async function marcarPaso(pasoId: number, estado: EstadoChecklist) {
    if (bloqueada) return
    const anterior = ejecucion[pasoId]
    setEjecucion((prev) => ({ ...prev, [pasoId]: estado }))
    try {
      await registrarEjecucionPaso(ot.id, { paso_id: pasoId, estado })
    } catch {
      // revertir si falla
      setEjecucion((prev) => {
        const next = { ...prev }
        if (anterior) next[pasoId] = anterior
        else delete next[pasoId]
        return next
      })
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
    <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(onCerrar)}>
      <div className="modal card modal-ancho" onClick={(e) => e.stopPropagation()}>
        <div className="detail-head">
          <div>
            <h3 style={{ margin: 0 }}>OT #{ot.id}</h3>
            {(ot.equipo_codigo || ot.equipo_nombre) && (
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--texto)' }}>
                {ot.equipo_codigo && <strong>{ot.equipo_codigo}</strong>}
                {ot.equipo_codigo && ot.equipo_nombre ? ' · ' : ''}
                {ot.equipo_nombre}
              </p>
            )}
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
                          {(['R', 'NR', 'PA'] as const).map((op) => {
                            const activo = estado === op
                            const color =
                              op === 'R'
                                ? 'var(--ok)'
                                : op === 'NR'
                                  ? 'var(--error-tx)'
                                  : '#e08600'
                            return (
                              <button
                                key={op}
                                type="button"
                                disabled={bloqueada}
                                onClick={() => marcarPaso(paso.id, op)}
                                title={
                                  op === 'R'
                                    ? 'Realizado'
                                    : op === 'NR'
                                      ? 'No realizado'
                                      : 'Presenta anomalía'
                                }
                                style={{
                                  width: 32,
                                  height: 30,
                                  borderRadius: 6,
                                  cursor: bloqueada ? 'not-allowed' : 'pointer',
                                  border: `1.5px solid ${activo ? color : 'var(--borde)'}`,
                                  background: activo ? color : '#fff',
                                  color: activo ? '#fff' : color,
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  opacity: bloqueada && !activo ? 0.5 : 1,
                                }}
                              >
                                {op}
                              </button>
                            )
                          })}
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
          onGuardado={onDocumentosChanged}
        />
      )}
    </div>
  )
}
