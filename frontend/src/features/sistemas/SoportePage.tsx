import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  CATEGORIAS_T,
  type CategoriaTicket,
  ETIQUETA_CATEGORIA_T,
  ETIQUETA_PRIORIDAD,
  type PrioridadTicket,
} from '../../entities/ticket'
import { ComboBox } from '../../shared/ui/ComboBox'
import { adjuntarPublico, crearTicket, listarAreas } from './soporteApi'

// En el formulario público solo se ofrecen 3 prioridades.
const PRIORIDADES_PUB: PrioridadTicket[] = ['alta', 'media', 'baja']

function detalleError(err: unknown, p: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? p
}

export function SoportePage() {
  const [f, setF] = useState({
    solicitante_nombre: '',
    solicitante_correo: '',
    area: '',
    categoria: 'hardware' as CategoriaTicket,
    prioridad: 'media' as PrioridadTicket,
    descripcion: '',
  })
  const [archivos, setArchivos] = useState<File[]>([])
  const [enviando, setEnviando] = useState(false)
  const [numero, setNumero] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [areas, setAreas] = useState<string[]>([])

  function copiarNumero() {
    if (!numero) return
    navigator.clipboard
      .writeText(numero)
      .then(() => {
        setCopiado(true)
        window.setTimeout(() => setCopiado(false), 2000)
      })
      .catch(() => {})
  }

  useEffect(() => {
    document.title = 'CMSS-Soporte'
    listarAreas()
      .then(setAreas)
      .catch(() => setAreas([]))
  }, [])

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((x) => ({ ...x, [k]: v }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      const r = await crearTicket({
        solicitante_nombre: f.solicitante_nombre,
        solicitante_correo: f.solicitante_correo || null,
        area: f.area || null,
        categoria: f.categoria,
        prioridad: f.prioridad,
        descripcion: f.descripcion,
      })
      for (const archivo of archivos) {
        try {
          await adjuntarPublico(r.numero, archivo)
        } catch {
          /* si un adjunto falla, el ticket igual se creó */
        }
      }
      setNumero(r.numero)
    } catch (err) {
      setError(detalleError(err, 'No se pudo registrar el ticket. Intenta de nuevo.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '32px auto', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 4 }}>Mesa de ayuda — Soporte de Sistemas</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Reporta tu caso y recibirás un número de seguimiento.{' '}
        <Link to="/soporte/seguimiento">Consultar un ticket existente</Link>
      </p>

      {numero ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>¡Ticket registrado! ✅</h2>
          <p>Tu número de seguimiento es:</p>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--azul)' }}>
              {numero}
            </span>
            <button type="button" className="btn-ghost" onClick={copiarNumero}>
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <p style={{ fontWeight: 600, marginTop: 10 }}>
            📌 Para realizar seguimiento de tu ticket, recuerda guardar tu número de ticket.
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Link className="btn-primary" to="/soporte/seguimiento">
              Consultar seguimiento
            </Link>
            <button
              className="btn-ghost"
              onClick={() => {
                setNumero(null)
                setArchivos([])
                setF({
                  solicitante_nombre: '',
                  solicitante_correo: '',
                  area: '',
                  categoria: 'hardware',
                  prioridad: 'media',
                  descripcion: '',
                })
              }}
            >
              Reportar otro
            </button>
          </div>
        </div>
      ) : (
        <form className="card" onSubmit={onSubmit}>
          {error && <div className="alert-error">{error}</div>}
          <div className="form-grid">
            <label className="field">
              <span>Nombre *</span>
              <input value={f.solicitante_nombre} onChange={(e) => set('solicitante_nombre', e.target.value)} required minLength={2} />
            </label>
            <label className="field">
              <span>Correo (opcional)</span>
              <input type="email" value={f.solicitante_correo} onChange={(e) => set('solicitante_correo', e.target.value)} />
            </label>
            <label className="field">
              <span>Servicio / Área / Dependencia</span>
              <ComboBox
                value={f.area}
                onChange={(v) => set('area', v)}
                options={areas}
                placeholder="Escribe o elige de la lista…"
                maxVisible={5}
              />
            </label>
            <label className="field">
              <span>Categoría *</span>
              <select value={f.categoria} onChange={(e) => set('categoria', e.target.value as CategoriaTicket)}>
                {CATEGORIAS_T.map((c) => (
                  <option key={c} value={c}>
                    {ETIQUETA_CATEGORIA_T[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Prioridad *</span>
              <select value={f.prioridad} onChange={(e) => set('prioridad', e.target.value as PrioridadTicket)}>
                {PRIORIDADES_PUB.map((p) => (
                  <option key={p} value={p}>
                    {ETIQUETA_PRIORIDAD[p]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Descripción *</span>
            <textarea
              value={f.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              rows={4}
              required
              minLength={3}
              placeholder="Incluye detalles específicos para ayudarte de manera correcta. Puedes anexar una captura o fotografía."
            />
          </label>
          <label className="field">
            <span>Adjuntar archivos (opcional — captura del error, foto, etc.)</span>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => setArchivos(Array.from(e.target.files ?? []))}
            />
            {archivos.length > 0 && (
              <small className="muted">{archivos.length} archivo(s) seleccionado(s)</small>
            )}
          </label>
          <p className="muted" style={{ fontSize: '0.85rem', marginTop: 10 }}>
            💡 Al enviar recibirás un número de ticket. Para realizar seguimiento, recuerda
            guardarlo.
          </p>
          <div style={{ marginTop: 6 }}>
            <button type="submit" className="btn-primary" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar ticket'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
