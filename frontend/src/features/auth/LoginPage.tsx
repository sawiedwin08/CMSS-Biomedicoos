import { type FormEvent, useState } from 'react'

import { useAuth } from '../../shared/auth/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      setError(
        status === 401
          ? 'Email o contraseña incorrectos.'
          : 'No se pudo conectar con el servidor. ¿Está encendido el backend?',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={onSubmit}>
        <div className="brand">
          <span className="brand-icon">🩺</span>
          <div>
            <h1>Sistema de Gestión CMVA</h1>
            <p className="muted">Gestión de CMVA</p>
          </div>
        </div>

        <label className="field">
          <span>Correo electrónico</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@cmva.com"
            autoComplete="username"
            required
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="alert-error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  )
}
