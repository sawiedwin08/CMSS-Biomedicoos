import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { ETIQUETA_CATEGORIA_T, ETIQUETA_ESTADO_T } from '../../entities/ticket'
import { consultarSeguimiento, type SeguimientoResult } from './soporteApi'

function detalleError(err: unknown, p: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? p
}

export function SeguimientoPage() {
  const [numero, setNumero] = useState('')
  const [correo, setCorreo] = useState('')
  const [consultando, setConsultando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [res, setRes] = useState<SeguimientoResult | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setConsultando(true)
    setError(null)
    setRes(null)
    try {
      setRes(await consultarSeguimiento(numero.trim(), correo.trim()))
    } catch (err) {
      setError(detalleError(err, 'No se encontró el ticket. Verifica el número y el correo.'))
    } finally {
      setConsultando(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '32px auto', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 4 }}>Consultar un ticket</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Ingresa tu número de ticket y el correo con el que lo registraste.{' '}
        <Link to="/soporte">Crear un ticket nuevo</Link>
      </p>

      <form className="card" onSubmit={onSubmit}>
        {error && <div className="alert-error">{error}</div>}
        <div className="form-grid">
          <label className="field">
            <span>Número de ticket *</span>
            <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="MA-0001" required />
          </label>
          <label className="field">
            <span>Correo *</span>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </label>
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="submit" className="btn-primary" disabled={consultando}>
            {consultando ? 'Consultando…' : 'Consultar'}
          </button>
        </div>
      </form>

      {res && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>
            {res.numero} — {res.asunto}
          </h2>
          <p>
            <strong>Estado:</strong> {ETIQUETA_ESTADO_T[res.estado]} &nbsp;·&nbsp;{' '}
            <strong>Categoría:</strong> {ETIQUETA_CATEGORIA_T[res.categoria as keyof typeof ETIQUETA_CATEGORIA_T] ?? res.categoria}
          </p>
          <p className="muted">Creado: {new Date(res.created_at).toLocaleString()}</p>

          <h3>Respuestas</h3>
          {res.comentarios.length === 0 ? (
            <p className="muted">Aún no hay respuestas del equipo de soporte.</p>
          ) : (
            <ul>
              {res.comentarios.map((c, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <div>{c.texto}</div>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    {c.autor} · {new Date(c.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {res.adjuntos.length > 0 && (
            <>
              <h3>Adjuntos</h3>
              <ul>
                {res.adjuntos.map((a) => (
                  <li key={a.id}>
                    {a.nombre_archivo}{' '}
                    <span className="muted" style={{ fontSize: '0.8rem' }}>
                      ({a.origen === 'tecnico' ? 'soporte' : 'tú'})
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
