import { Plus, Wrench, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  obtenerTodasOrdenesTrabajo,
  obtenerChecklist,
  obtenerEjecucionOT,
  registrarEjecucionPaso,
  cambiarEstadoOT,
  type OTRead,
  type EstadoOT,
  type TipoMantenimiento,
  type ChecklistEquipoRead,
  type EstadoChecklist,
} from './mantenimientoApi'
import { cerrarAlClicFuera } from '../../shared/ui/overlay'
import { AccionesEstadoLote } from './AccionesEstadoLote'
import { CrearOTModal } from './CrearOTModal'
import { EquiposMantener } from './EquiposMantener'

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

const EMOJIS_TIPO: Record<TipoMantenimiento, string> = {
  preventivo: '🛡️',
  correctivo: '🔧',
  calibracion: '⚖️',
  otra: '📋',
}

export function MantenimientoPage() {
  const [ordenes, setOrdenes] = useState<OTRead[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<EstadoOT | 'todas'>('todas')
  const [seleccionada, setSeleccionada] = useState<OTRead | null>(null)
  const [mostrarCrearOT, setMostrarCrearOT] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set())
  const [tab, setTab] = useState<'ot' | 'equipos'>(() => {
    try {
      return localStorage.getItem('mant_tab') === 'equipos' ? 'equipos' : 'ot'
    } catch {
      return 'ot'
    }
  })

  function cambiarTab(t: 'ot' | 'equipos') {
    setTab(t)
    try {
      localStorage.setItem('mant_tab', t)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    cargarOrdenes()
  }, [])

  async function cargarOrdenes() {
    setCargando(true)
    setError(null)
    try {
      const ots = await obtenerTodasOrdenesTrabajo()
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

  const ordenesFiltradas = filtroEstado === 'todas'
    ? ordenes
    : ordenes.filter(o => o.estado === filtroEstado)

  // Seleccionables: todas menos las completadas (bloqueadas).
  const idsSeleccionables = ordenesFiltradas
    .filter((o) => o.estado !== 'completada')
    .map((o) => o.id)
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

  const tabsBar = (
    <div className="tabs">
      <button
        className={`tab ${tab === 'ot' ? 'activo' : ''}`}
        onClick={() => cambiarTab('ot')}
      >
        Órdenes de trabajo
      </button>
      <button
        className={`tab ${tab === 'equipos' ? 'activo' : ''}`}
        onClick={() => cambiarTab('equipos')}
      >
        Mantenimientos
      </button>
    </div>
  )

  if (tab === 'equipos') {
    return (
      <div className="stack">
        {tabsBar}
        <EquiposMantener />
      </div>
    )
  }

  return (
    <div className="stack">
      {tabsBar}
      <div className="card">
        <div className="detail-head">
          <h2>Órdenes de Trabajo</h2>
          <button
            className="btn btn-primary btn-ico"
            onClick={() => setMostrarCrearOT(true)}
          >
            <Plus size={16} /> Nueva OT
          </button>
        </div>

        {error && <div className="alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

        {/* Filtros */}
        <form className="filtros">
          {(['todas', 'pendiente', 'en_progreso', 'completada', 'cancelada'] as const).map((estado) => (
            <button
              key={estado}
              type="button"
              className={`btn ${filtroEstado === estado ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFiltroEstado(estado)}
            >
              {estado === 'todas' ? 'Todas' : ETIQUETAS_ESTADO[estado]}
            </button>
          ))}
        </form>

        {mensaje && <div className="alert-ok">{mensaje}</div>}
        {seleccion.size > 0 && (
          <AccionesEstadoLote
            ids={[...seleccion]}
            onLimpiar={() => setSeleccion(new Set())}
            onHecho={trasLote}
          />
        )}

        {/* Tabla de órdenes */}
        {cargando ? (
          <div className="muted">Cargando órdenes de trabajo…</div>
        ) : ordenesFiltradas.length === 0 ? (
          <div className="aviso" style={{ marginTop: '20px', textAlign: 'center' }}>
            <Wrench size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>No hay órdenes de trabajo</p>
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
                <th>Descripción</th>
                <th>Fecha Prog.</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map((ot) => (
                <tr key={ot.id}>
                  <td>
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
                    <span style={{ color: 'var(--muted)' }}>{ot.equipo_nombre || '—'}</span>
                  </td>
                  <td>{EMOJIS_TIPO[ot.tipo]} {ot.tipo}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: COLORES_ESTADO[ot.estado],
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      {ETIQUETAS_ESTADO[ot.estado]}
                    </span>
                  </td>
                  <td className="docs-nombre-col">{ot.descripcion ?? '—'}</td>
                  <td className="docs-usuario-col">
                    {ot.fecha_programada ? formatearFecha(ot.fecha_programada) : '—'}
                  </td>
                  <td className="docs-acciones-col">
                    <button
                      className="icon-btn"
                      onClick={() => setSeleccionada(ot)}
                      title="Ver detalles"
                    >
                      <Wrench size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal de crear OT */}
      {mostrarCrearOT && (
        <CrearOTModal
          onClose={() => setMostrarCrearOT(false)}
          onSuccess={() => {
            setMostrarCrearOT(false)
            cargarOrdenes()
          }}
        />
      )}

      {/* Modal de detalles */}
      {seleccionada && (
        <DetalleOTModal
          ot={seleccionada}
          onClose={() => setSeleccionada(null)}
          onSave={() => {
            setSeleccionada(null)
            cargarOrdenes()
          }}
        />
      )}
    </div>
  )
}

interface DetalleOTModalProps {
  ot: OTRead
  onClose: () => void
  onSave: () => void
}

function DetalleOTModal({ ot, onClose, onSave }: DetalleOTModalProps) {
  const [checklist, setChecklist] = useState<ChecklistEquipoRead | null>(null)
  const [ejecucion, setEjecucion] = useState<Record<number, EstadoChecklist>>({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [tiempoMinutos, setTiempoMinutos] = useState<number>(ot.tiempo_empleado_minutos ?? 0)
  const [costo, setCosto] = useState<number>(ot.costo_total ?? 0)
  const [nuevoEstado, setNuevoEstado] = useState<EstadoOT>(ot.estado)

  useEffect(() => {
    cargarDetalles()
  }, [ot.id])

  async function cargarDetalles() {
    setCargando(true)
    try {
      const [checklistData, ejecucionData] = await Promise.all([
        obtenerChecklist(ot.equipo_id),
        obtenerEjecucionOT(ot.id),
      ])
      setChecklist(checklistData)
      const ejecucionMap: Record<number, EstadoChecklist> = {}
      ejecucionData.forEach((e) => {
        ejecucionMap[e.paso_id] = e.estado
      })
      setEjecucion(ejecucionMap)
    } catch (err) {
      console.error('Error cargando detalles:', err)
    } finally {
      setCargando(false)
    }
  }

  async function guardarCambios() {
    setGuardando(true)
    try {
      if (nuevoEstado !== ot.estado) {
        await cambiarEstadoOT(ot.id, nuevoEstado)
      }
      onSave()
    } catch (err) {
      console.error('Error guardando:', err)
    } finally {
      setGuardando(false)
    }
  }

  async function marcarPaso(pasoId: number, estado: EstadoChecklist) {
    try {
      await registrarEjecucionPaso(ot.id, {
        paso_id: pasoId,
        estado,
      })
      setEjecucion({ ...ejecucion, [pasoId]: estado })
    } catch (err) {
      console.error('Error registrando paso:', err)
    }
  }

  function formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO)
    return fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(onClose)}>
      <div className="modal card modal-ancho" onClick={(e) => e.stopPropagation()}>
        <div className="detail-head">
          <div>
            <h3 style={{ margin: 0 }}>{EMOJIS_TIPO[ot.tipo]} Orden #{ot.id}</h3>
            {(ot.equipo_codigo || ot.equipo_nombre) && (
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--muted)' }}>
                {ot.equipo_codigo && <strong>{ot.equipo_codigo}</strong>}
                {ot.equipo_codigo && ot.equipo_nombre ? ' · ' : ''}
                {ot.equipo_nombre}
              </p>
            )}
          </div>
          <button className="btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {cargando ? (
          <div className="muted">Cargando…</div>
        ) : (
          <div style={{ padding: '16px 0' }}>
            <h4 className="grupo-tit">Información General</h4>

            <div className="field">
              <label>Equipo</label>
              <p className="muted">
                {ot.equipo_codigo ? `${ot.equipo_codigo} · ` : ''}
                {ot.equipo_nombre ?? '—'}
              </p>
            </div>

            <div className="field">
              <label>Estado</label>
              <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value as EstadoOT)}>
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En progreso</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div className="field">
              <label>Tipo</label>
              <p className="muted">{ot.tipo}</p>
            </div>

            <div className="field">
              <label>Descripción</label>
              <p className="muted">{ot.descripcion ?? '—'}</p>
            </div>

            <div className="field">
              <label>Fecha Programada</label>
              <p className="muted">{ot.fecha_programada ? formatearFecha(ot.fecha_programada) : '—'}</p>
            </div>

            <div className="field">
              <label>Técnico Responsable</label>
              <p className="muted">{ot.tecnico_nombre ?? '—'}</p>
            </div>

            <div className="field">
              <label>Repuestos Utilizados</label>
              <p className="muted">{ot.repuestos ?? '—'}</p>
            </div>

            {checklist && checklist.pasos.length > 0 && (
              <>
                <h4 className="grupo-tit">Checklist: {checklist.nombre}</h4>
                {checklist.pasos.map((paso) => (
                  <div key={paso.id} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--borde)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: '0.95rem' }}>{paso.descripcion}</p>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          className={`btn btn-sm ${ejecucion[paso.id] === 'R' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => marcarPaso(paso.id, 'R')}
                          title="Realizado"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          className={`btn btn-sm ${ejecucion[paso.id] === 'NR' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => marcarPaso(paso.id, 'NR')}
                          title="No Realizado"
                        >
                          <XCircle size={14} />
                        </button>
                        <button
                          className={`btn btn-sm ${ejecucion[paso.id] === 'PA' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => marcarPaso(paso.id, 'PA')}
                          title="Presenta Anomalía"
                        >
                          <AlertTriangle size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            <h4 className="grupo-tit">Ejecución</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field">
                <label>Tiempo Empleado (minutos)</label>
                <input
                  type="number"
                  min="0"
                  value={tiempoMinutos}
                  onChange={(e) => setTiempoMinutos(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="field">
                <label>Costo Total ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costo}
                  onChange={(e) => setCosto(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
          {nuevoEstado !== ot.estado && (
            <button
              className="btn btn-primary"
              onClick={guardarCambios}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Cambiar estado'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
