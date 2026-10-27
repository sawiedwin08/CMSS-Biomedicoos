import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { CATEGORIAS_T, type CategoriaTicket, ETIQUETA_CATEGORIA_T } from '../../entities/ticket'
import { adjuntarPublico, crearTicket, listarAreas } from './soporteApi'

function detalleError(err: unknown, p: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? p
}

export function SoportePage() {
  const [f, setF] = useState({
    solicitante_nombre: '',
    solicitante_correo: '',
    area: '',
    categoria: 'hardware' as CategoriaTicket,
    asunto: '',
    descripcion: '',
  })
  const [archivos, setArchivos] = useState<File[]>([])
  const [enviando, setEnviando] = useState(false)
  const [numero, setNumero] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [areas, setAreas] = useState<string[]>([])

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
      const r = await crearTicket({ ...f, area: f.area || null })
      for (const archivo of archivos) {
        try {
          await adjuntarPublico(r.numero, f.solicitante_correo, archivo)
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
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--azul)' }}>{numero}</p>
          <p className="muted">
            Guárdalo. Con ese número y tu correo puedes consultar el estado en “Consultar un ticket”.
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
                  asunto: '',
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
              <span>Correo *</span>
              <input type="email" value={f.solicitante_correo} onChange={(e) => set('solicitante_correo', e.target.value)} required />
            </label>
            <label className="field">
              <span>Servicio / Área / Dependencia</span>
              <select value={f.area} onChange={(e) => set('area', e.target.value)}>
                <option value="">— Selecciona —</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
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
          </div>
          <label className="field">
            <span>Asunto *</span>
            <input value={f.asunto} onChange={(e) => set('asunto', e.target.value)} required minLength={3} />
          </label>
          <label className="field">
            <span>Descripción *</span>
            <textarea value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} rows={4} required minLength={3} />
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
          <div style={{ marginTop: 10 }}>
            <button type="submit" className="btn-primary" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar ticket'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
