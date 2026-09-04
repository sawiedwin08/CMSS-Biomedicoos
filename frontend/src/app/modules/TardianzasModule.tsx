import { Navigate } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext'

export function TardianzasModule() {
  const { usuario } = useAuth()
  if (!usuario?.modulos.includes('tardanzas')) {
    return <Navigate to="/" replace />
  }

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <h2>⏰ Módulo de Tardanzas</h2>
      <p style={{ color: '#666', marginTop: '16px' }}>
        Este módulo está en construcción.
      </p>
    </div>
  )
}
