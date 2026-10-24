import { Plus, Search, Trash2, X } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import { type Equipo } from '../../entities/equipo'
import { cerrarAlClicFuera } from '../../shared/ui/overlay'
import { listarEquipos } from '../inventario/equiposApi'
import {
  crearChecklist,
  crearOrdenTrabajo,
  crearOrdenesLote,
  crearPlantillaRutina,
  listarPlantillasRutina,
  type PlantillaRutina,
  type TipoMantenimiento,
} from './mantenimientoApi'

interface Props {
  /** Si viene con IDs, es creación en lote (equipos ya seleccionados). Si no, se busca uno. */
  equipoIds?: number[]
  onClose: () => void
  onSuccess: () => void
}

export function CrearOTModal({ equipoIds, onClose, onSuccess }: Props) {
  const esLote = Array.isArray(equipoIds) && equipoIds.length > 0

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [equipoId, setEquipoId] = useState('') // modo individual
  const [busqueda, setBusqueda] = useState('')

  const [tipo, setTipo] = useState<TipoMantenimiento>('preventivo')
  const [fecha, setFecha] = useState('')
  const [tecnico, setTecnico] = useState('')
  const [descripcion, setDescripcion] = useState('')

  // Rutina
  const [pasos, setPasos] = useState<{ descripcion: string }[]>([{ descripcion: '' }])
  const [plantillas, setPlantillas] = useState<PlantillaRutina[]>([])
  const [plantillaSel, setPlantillaSel] = useState('')
  const [msgPlantilla, setMsgPlantilla] = useState<string | null>(null)

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarEquipos()
      .then(setEquipos)
      .catch(() => setError('No se pudieron cargar los equipos.'))
    listarPlantillasRutina()
      .then(setPlantillas)
      .catch(() => {
        /* sin plantillas o sin permiso */
      })
  }, [])

  const idsDestino = esLote ? equipoIds! : equipoId ? [Number(equipoId)] : []
  const equiposLote = esLote ? equipos.filter((e) => equipoIds!.includes(e.id!)) : []

  const equiposFiltrados = equipos.filter((e) => {
    const t = busqueda.trim().toLowerCase()
    if (!t) return false
    return (
      e.codigo_interno.toLowerCase().includes(t) ||
      e.nombre.toLowerCase().includes(t) ||
      (e.numero_activo?.toLowerCase().includes(t) ?? false)
    )
  })
  const equipoSel = equipos.find((e) => e.id === Number(equipoId))

  function cargarPlantilla() {
    const p = plantillas.find((x) => x.id === Number(plantillaSel))
    if (!p) return
    const nuevos = [...p.pasos]
      .sort((a, b) => a.orden - b.orden)
      .map((paso) => ({ descripcion: paso.descripcion }))
    setPasos(nuevos.length ? nuevos : [{ descripcion: '' }])
    setMsgPlantilla(`Rutina "${p.nombre}" cargada.`)
    setTimeout(() => setMsgPlantilla(null), 3000)
  }

  async function guardarComoPlantilla() {
    const limpios = pasos
      .map((p, idx) => ({ orden: idx + 1, descripcion: p.descripcion.trim() }))
      .filter((p) => p.descripcion)
    if (limpios.length === 0) {
      setMsgPlantilla('Agrega al menos un paso antes de guardar la plantilla.')
      setTimeout(() => setMsgPlantilla(null), 3000)
      return
    }
    const nombre = window.prompt('Nombre de la plantilla de rutina:')
    if (!nombre || !nombre.trim()) return
    try {
      const nueva = await crearPlantillaRutina(nombre.trim(), limpios)
      setPlantillas((prev) => [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setPlantillaSel(String(nueva.id))
      setMsgPlantilla(`Plantilla "${nueva.nombre}" guardada.`)
      setTimeout(() => setMsgPlantilla(null), 3000)
    } catch (err: any) {
      setMsgPlantilla(err?.response?.data?.detail || 'No se pudo guardar la plantilla.')
      setTimeout(() => setMsgPlantilla(null), 4000)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!esLote && !equipoId) {
      setError('Selecciona un equipo.')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const datos = {
        tipo,
        descripcion: descripcion.trim() || undefined,
        tecnico_nombre: tecnico.trim() || undefined,
        fecha_programada: fecha || undefined,
      }
      if (esLote) await crearOrdenesLote(idsDestino, datos)
      else await crearOrdenTrabajo(idsDestino[0], datos)

      // Aplicar la rutina a todos los equipos destino (reemplaza el checklist existente).
      const pasosLimpios = pasos
        .map((p, idx) => ({ orden: idx + 1, descripcion: p.descripcion.trim() }))
        .filter((p) => p.descripcion)
      if (pasosLimpios.length > 0) {
        for (const eid of idsDestino) {
          try {
            await crearChecklist(eid, { nombre: `Rutina ${tipo}`, pasos: pasosLimpios })
          } catch {
            /* no bloquear la creación de la OT por un fallo de checklist */
          }
        }
      }
      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'No se pudo crear la orden de trabajo.')
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(onClose)}>
      <form className="modal card modal-ancho" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div className="detail-head">
          <h3 style={{ margin: 0 }}>
            {esLote ? `Generar OT para ${idsDestino.length} equipo(s)` : 'Nueva orden de trabajo'}
          </h3>
          <button type="button" className="btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        {/* ===== Equipo(s) ===== */}
        <h4 className="grupo-tit">Equipo</h4>
        {esLote ? (
          <div className="card aviso" style={{ marginTop: 4 }}>
            {equiposLote.length > 0
              ? equiposLote.map((e) => e.codigo_interno).join(', ')
              : `${idsDestino.length} equipo(s) seleccionado(s)`}
          </div>
        ) : (
          <div className="field">
            <div className="dt-search" style={{ width: '100%' }}>
              <Search size={15} />
              <input
                placeholder="Buscar código, nombre o placa…"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  if (equipoId) setEquipoId('')
                }}
              />
            </div>
            {equipoSel && (
              <div
                style={{
                  marginTop: 8,
                  padding: '10px 12px',
                  background: '#e8f5e9',
                  borderRadius: 6,
                  color: '#2e7d32',
                  fontSize: '0.9rem',
                }}
              >
                ✓ <strong>{equipoSel.codigo_interno}</strong> · {equipoSel.nombre}
              </div>
            )}
            {busqueda && !equipoId && (
              <div
                style={{
                  marginTop: 8,
                  border: '1px solid var(--borde)',
                  borderRadius: 6,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {equiposFiltrados.length === 0 ? (
                  <div className="muted small" style={{ padding: 12 }}>Sin resultados</div>
                ) : (
                  equiposFiltrados.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => setEquipoId(String(e.id))}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--borde)' }}
                    >
                      <strong>{e.codigo_interno}</strong>
                      <span className="muted"> · {e.nombre}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== Tipo ===== */}
        <h4 className="grupo-tit">Tipo de mantenimiento</h4>
        <label className="field">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoMantenimiento)}>
            <option value="preventivo">🛡️ Preventivo</option>
            <option value="correctivo">🔧 Correctivo</option>
            <option value="calibracion">⚖️ Calibración</option>
            <option value="otra">📋 Otra</option>
          </select>
        </label>

        {/* ===== Rutina ===== */}
        <h4 className="grupo-tit">Rutina / Checklist (opcional)</h4>
        <p className="muted small" style={{ margin: '0 0 8px' }}>
          Carga una rutina guardada o crea los pasos.
          {esLote ? ' Se aplicará a todos los equipos seleccionados.' : ''}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <select
            value={plantillaSel}
            onChange={(e) => setPlantillaSel(e.target.value)}
            style={{ flex: 1, minWidth: 160 }}
          >
            <option value="">
              {plantillas.length ? 'Selecciona una rutina guardada…' : 'No hay rutinas guardadas'}
            </option>
            {plantillas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.pasos.length} pasos)
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-ghost" onClick={cargarPlantilla} disabled={!plantillaSel}>
            Cargar rutina
          </button>
          <button type="button" className="btn btn-ghost" onClick={guardarComoPlantilla}>
            Guardar como plantilla
          </button>
        </div>
        {msgPlantilla && <div className="alert-ok">{msgPlantilla}</div>}

        {pasos.map((p, idx) => (
          <div key={idx} className="field" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{ flex: 1 }}
              placeholder={`Paso ${idx + 1} (ej: Verificar baterías)`}
              value={p.descripcion}
              onChange={(e) => {
                const nuevos = [...pasos]
                nuevos[idx] = { descripcion: e.target.value }
                setPasos(nuevos)
              }}
            />
            {pasos.length > 1 && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => setPasos(pasos.filter((_, i) => i !== idx))}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn btn-ghost btn-ico"
          onClick={() => setPasos([...pasos, { descripcion: '' }])}
          style={{ fontSize: '0.85rem' }}
        >
          <Plus size={14} /> Agregar paso
        </button>

        {/* ===== Datos ===== */}
        <h4 className="grupo-tit">Datos de la orden</h4>
        <div className="form-grid">
          <label className="field">
            <span>Fecha programada</span>
            <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label className="field">
            <span>Técnico responsable</span>
            <input value={tecnico} onChange={(e) => setTecnico(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Descripción {esLote ? '(se aplica a todas)' : ''}</span>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
        </label>

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={guardando || (!esLote && !equipoId)}
          >
            {guardando
              ? 'Creando…'
              : esLote
                ? `Generar ${idsDestino.length} OT`
                : 'Crear orden'}
          </button>
        </div>
      </form>
    </div>
  )
}
