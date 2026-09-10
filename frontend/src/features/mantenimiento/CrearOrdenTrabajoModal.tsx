import { X, Plus, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

import { api } from '../../shared/api/client'
import {
  crearOrdenTrabajo,
  crearChecklist,
  type TipoMantenimiento,
} from './mantenimientoApi'

interface Equipo {
  id: number
  codigo_interno: string
  nombre: string
}

interface CrearOrdenTrabajoModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CrearOrdenTrabajoModal({ onClose, onSuccess }: CrearOrdenTrabajoModalProps) {
  const [paso, setPaso] = useState(1)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Paso 1: Equipo y tipo
  const [equipoId, setEquipoId] = useState('')
  const [tipo, setTipo] = useState<TipoMantenimiento>('preventivo')

  // Paso 2: Checklist
  const [pasosChecklist, setPasosChecklist] = useState([{ descripcion: '' }])

  // Paso 3: Datos finales
  const [descripcion, setDescripcion] = useState('')
  const [tiempoMinutos, setTiempoMinutos] = useState('')
  const [costo, setCosto] = useState('')
  const [repuestos, setRepuestos] = useState('')
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [tecnicoId, setTecnicoId] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api
      .get<Equipo[]>('/equipos')
      .then(({ data }) => setEquipos(data))
      .catch(() => setError('No se pudieron cargar los equipos'))
      .finally(() => setCargando(false))
  }, [])

  async function crearOT() {
    if (!equipoId) {
      setError('Selecciona un equipo')
      return
    }

    setGuardando(true)
    setError(null)

    try {
      await crearOrdenTrabajo(parseInt(equipoId), {
        tipo,
        descripcion: descripcion || undefined,
        tecnico_nombre: tecnicoId || undefined,
        tiempo_empleado_minutos: tiempoMinutos ? parseInt(tiempoMinutos) : undefined,
        costo_total: costo ? parseFloat(costo) : undefined,
        repuestos: repuestos || undefined,
        fecha_programada: fechaProgramada || undefined,
      })

      // Guardar checklist si hay pasos y no existe uno ya
      const pasosConContenido = pasosChecklist.filter(p => p.descripcion.trim())
      if (pasosConContenido.length > 0) {
        try {
          await crearChecklist(parseInt(equipoId), {
            nombre: `Checklist ${tipo}`,
            pasos: pasosConContenido.map((p, idx) => ({
              orden: idx + 1,
              descripcion: p.descripcion,
            })),
          })
        } catch (err: any) {
          // Si el checklist ya existe (duplicado o unique violation), ignorar el error
          const detail = err.response?.data?.detail || ''
          const isDuplicate = detail.includes('duplicada') || detail.includes('UniqueViolation') || detail.includes('equipo_id')
          if (!isDuplicate) {
            throw err
          }
        }
      }

      onSuccess()
    } catch (err: any) {
      const mensaje = err.response?.data?.detail || 'Error al crear la orden de trabajo'
      setError(mensaje)
      console.error('Error creando OT:', err)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card modal-ancho" onClick={e => e.stopPropagation()}>
        <div className="detail-head">
          <h3>Nueva Orden de Trabajo · Paso {paso}/3</h3>
          <button className="btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

        {/* PASO 1 */}
        {paso === 1 && (
          <div style={{ padding: '16px 0' }}>
            <h4 className="grupo-tit">Equipo y Tipo</h4>

            <div className="field">
              <label>Equipo *</label>
              <select
                value={equipoId}
                onChange={e => setEquipoId(e.target.value)}
                disabled={cargando}
              >
                <option value="">
                  {cargando ? 'Cargando...' : 'Selecciona un equipo'}
                </option>
                {equipos.map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.codigo_interno} - {eq.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Tipo de Mantenimiento *</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoMantenimiento)}>
                <option value="preventivo">🛡️ Preventivo</option>
                <option value="correctivo">🔧 Correctivo</option>
                <option value="calibracion">⚖️ Calibración</option>
                <option value="otra">📋 Otra</option>
              </select>
            </div>
          </div>
        )}

        {/* PASO 2: Checklist (opcional) */}
        {paso === 2 && (
          <div style={{ padding: '16px 0' }}>
            <h4 className="grupo-tit">Crear Checklist (opcional)</h4>
            <p className="muted small">Los pasos se pueden crear aquí o después</p>

            {pasosChecklist.map((paso, idx) => (
              <div key={idx} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--borde)' }}>
                <div className="field">
                  <label>Paso {idx + 1}</label>
                  <input
                    type="text"
                    placeholder="Ej: Verificar temperatura"
                    value={paso.descripcion}
                    onChange={e => {
                      const nuevos = [...pasosChecklist]
                      nuevos[idx].descripcion = e.target.value
                      setPasosChecklist(nuevos)
                    }}
                  />
                </div>
              </div>
            ))}

            <button
              className="btn btn-ghost"
              onClick={() => setPasosChecklist([...pasosChecklist, { descripcion: '' }])}
              style={{ marginTop: '12px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Agregar paso
            </button>
          </div>
        )}

        {/* PASO 3: Datos finales */}
        {paso === 3 && (
          <div style={{ padding: '16px 0' }}>
            <h4 className="grupo-tit">Información de la Orden</h4>

            <div className="field">
              <label>Descripción</label>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Describe la orden de trabajo..."
                rows={3}
              />
            </div>

            <div className="field">
              <label>Fecha Programada</label>
              <input
                type="datetime-local"
                value={fechaProgramada}
                onChange={e => setFechaProgramada(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Técnico Responsable</label>
              <input
                type="text"
                value={tecnicoId}
                onChange={e => setTecnicoId(e.target.value)}
                placeholder="Nombre de la persona que realiza la actividad"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field">
                <label>Tiempo Empleado (min)</label>
                <input
                  type="number"
                  min="0"
                  value={tiempoMinutos}
                  onChange={e => setTiempoMinutos(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="field">
                <label>Costo Total ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costo}
                  onChange={e => setCosto(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="field">
              <label>Repuestos Utilizados</label>
              <textarea
                value={repuestos}
                onChange={e => setRepuestos(e.target.value)}
                placeholder="Ej: Filtro A1, Batería X10..."
                rows={2}
              />
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button
            className="btn btn-ghost"
            onClick={() => {
              if (paso > 1) setPaso(paso - 1)
              else onClose()
            }}
          >
            {paso === 1 ? 'Cerrar' : 'Atrás'}
          </button>

          {paso < 3 ? (
            <button
              className="btn btn-primary"
              onClick={() => setPaso(paso + 1)}
              disabled={paso === 1 && !equipoId}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={crearOT}
              disabled={guardando || !equipoId}
            >
              {guardando ? 'Creando...' : 'Crear Orden'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
