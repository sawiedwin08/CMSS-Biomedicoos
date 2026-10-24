import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ETIQUETA_ESTADO_T, type EstadoTicket } from '../../entities/ticket'
import { obtenerResumen, type Resumen } from './inicioApi'

function Tile({ label, valor, color }: { label: string; valor: number; color?: string }) {
  return (
    <div className="card" style={{ padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: color ?? 'var(--azul)' }}>{valor}</div>
      <div className="muted" style={{ fontSize: '0.85rem' }}>
        {label}
      </div>
    </div>
  )
}

export function InicioPage() {
  const [r, setR] = useState<Resumen | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    obtenerResumen()
      .then(setR)
      .catch(() => setError('No se pudo cargar el resumen.'))
  }, [])

  if (error) return <div className="card alert-error">{error}</div>
  if (!r) return <div className="card muted">Cargando…</div>

  const datosGrafica = r.tickets_por_estado.map((x) => ({
    nombre: ETIQUETA_ESTADO_T[x.estado as EstadoTicket] ?? x.estado,
    cantidad: x.cantidad,
  }))

  const grid = {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  } as const

  return (
    <div className="stack">
      <h2 style={{ margin: 0 }}>Inicio — Sistemas</h2>

      <div>
        <h3>Inventario de activos</h3>
        <div style={grid}>
          <Tile label="Total de activos" valor={r.activos_total} />
          <Tile label="Operativos" valor={r.activos_operativo} color="var(--ok)" />
          <Tile label="En reparación" valor={r.activos_en_reparacion} color="#d9822b" />
          <Tile label="En bodega" valor={r.activos_en_bodega} />
          <Tile label="Dados de baja" valor={r.activos_baja} color="#c0392b" />
        </div>
      </div>

      <div>
        <h3>Soporte y cuentas</h3>
        <div style={grid}>
          <Tile label="Tickets abiertos" valor={r.tickets_abiertos} />
          <Tile label="Tickets nuevos hoy" valor={r.tickets_nuevos_hoy} color="#d9822b" />
          <Tile label="Cuentas de correo activas" valor={r.cuentas_activas} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Tickets por estado</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={datosGrafica} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
            <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="cantidad" fill="#1e6fb8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
