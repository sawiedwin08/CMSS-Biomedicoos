import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  type PieSectorDataItem,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ETIQUETA_ESTADO_T,
  ETIQUETA_PRIORIDAD,
  type EstadoTicket,
  type PrioridadTicket,
} from '../../entities/ticket'
import { obtenerResumen, type Resumen } from './inicioApi'

const COLORES = ['#1e6fb8', '#27ae60', '#d9822b', '#c0392b', '#8e44ad', '#16a085', '#7f8c8d', '#2c3e50']
const COLOR_PRIORIDAD: Record<string, string> = {
  baja: '#27ae60',
  media: '#1e6fb8',
  alta: '#d9822b',
  critica: '#c0392b',
}

function isoHaceDias(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// --- Dona interactiva (active shape): al pasar el mouse resalta el sector
//     y muestra nombre, cantidad y porcentaje. ---
interface DatoDonut {
  nombre: string
  cantidad: number
  color: string
}

function formaActiva(props: PieSectorDataItem) {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle,
    endAngle,
    fill,
    payload,
    percent = 0,
    value = 0,
  } = props
  const p = payload as unknown as { nombre?: string }
  const RAD = Math.PI / 180
  const cos = Math.cos(-RAD * midAngle)
  const sin = Math.sin(-RAD * midAngle)
  const sx = cx + (outerRadius + 10) * cos
  const sy = cy + (outerRadius + 10) * sin
  const mx = cx + (outerRadius + 30) * cos
  const my = cy + (outerRadius + 30) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 16
  const ey = my
  const anchor = cos >= 0 ? 'start' : 'end'
  return (
    <g>
      <text x={cx} y={cy} dy={6} textAnchor="middle" fill={fill} style={{ fontWeight: 700 }}>
        {p.nombre}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={anchor} fill="#333" style={{ fontSize: 13 }}>
        {`${value} ticket(s)`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={16} textAnchor={anchor} fill="#999" style={{ fontSize: 12 }}>
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  )
}

function DonutActivo({ datos }: { datos: DatoDonut[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 24, right: 80, bottom: 24, left: 80 }}>
        <Pie
          data={datos}
          dataKey="cantidad"
          nameKey="nombre"
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="60%"
          activeShape={formaActiva}
        >
          {datos.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        {/* El Tooltip no dibuja caja, solo gobierna el sector activo (hover). */}
        <Tooltip content={() => null} defaultIndex={0} />
      </PieChart>
    </ResponsiveContainer>
  )
}

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

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{titulo}</h3>
      {children}
    </div>
  )
}

function SinDatos() {
  return (
    <div className="muted" style={{ textAlign: 'center', padding: '40px 0' }}>
      Sin datos en el período.
    </div>
  )
}

export function InicioPage() {
  const [r, setR] = useState<Resumen | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [desde, setDesde] = useState(isoHaceDias(29))
  const [hasta, setHasta] = useState(isoHaceDias(0))

  useEffect(() => {
    obtenerResumen(desde, hasta)
      .then(setR)
      .catch(() => setError('No se pudo cargar el resumen.'))
  }, [desde, hasta])

  if (error) return <div className="card alert-error">{error}</div>
  if (!r) return <div className="card muted">Cargando…</div>

  const grid = {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  } as const

  const datosDia = r.tickets_por_dia.map((d) => ({ fecha: d.fecha.slice(5), cantidad: d.cantidad }))
  const datosEstado: DatoDonut[] = r.tickets_por_estado.map((x, i) => ({
    nombre: ETIQUETA_ESTADO_T[x.estado as EstadoTicket] ?? x.estado,
    cantidad: x.cantidad,
    color: COLORES[i % COLORES.length],
  }))
  const datosPrioridad: DatoDonut[] = r.tickets_por_prioridad.map((x, i) => ({
    nombre: ETIQUETA_PRIORIDAD[x.prioridad as PrioridadTicket] ?? x.prioridad,
    cantidad: x.cantidad,
    color: COLOR_PRIORIDAD[x.prioridad] ?? COLORES[i % COLORES.length],
  }))
  const datosArea = r.tickets_por_area.map((x) => ({ nombre: x.area, cantidad: x.cantidad }))

  return (
    <div className="stack">
      <h2 style={{ margin: 0 }}>Inicio — Sistemas</h2>

      {/* Período */}
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
        <label className="field">
          <span>Desde</span>
          <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="field">
          <span>Hasta</span>
          <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <span className="muted" style={{ paddingBottom: 10 }}>
          El período afecta la tarjeta de tickets recibidos y las gráficas.
        </span>
      </div>

      {/* Equipos */}
      <div>
        <h3>Inventario de equipos</h3>
        <div style={grid}>
          <Tile label="Total de equipos" valor={r.activos_total} />
          <Tile label="Operativos" valor={r.activos_operativo} color="var(--ok)" />
          <Tile label="En reparación" valor={r.activos_en_reparacion} color="#d9822b" />
          <Tile label="En bodega" valor={r.activos_en_bodega} />
          <Tile label="Dados de baja" valor={r.activos_baja} color="#c0392b" />
        </div>
      </div>

      {/* Soporte */}
      <div>
        <h3>Soporte</h3>
        <div style={grid}>
          <Tile label="Tickets abiertos" valor={r.tickets_abiertos} />
          <Tile label="Tickets recibidos en el período" valor={r.tickets_recibidos_periodo} color="#d9822b" />
        </div>
      </div>

      {/* Tickets por día */}
      <Tarjeta titulo="Tickets recibidos por día">
        {datosDia.length === 0 ? (
          <SinDatos />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={datosDia} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="cantidad" name="Tickets" stroke="#1e6fb8" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Tarjeta>

      {/* Pasteles (dona interactiva), lado a lado */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Tarjeta titulo="Tickets por estado">
          {datosEstado.length === 0 ? <SinDatos /> : <DonutActivo datos={datosEstado} />}
        </Tarjeta>
        <Tarjeta titulo="Tickets por prioridad">
          {datosPrioridad.length === 0 ? <SinDatos /> : <DonutActivo datos={datosPrioridad} />}
        </Tarjeta>
      </div>

      {/* Áreas con más tickets */}
      <Tarjeta titulo="Áreas con más tickets">
        {datosArea.length === 0 ? (
          <SinDatos />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(220, datosArea.length * 40)}>
            <BarChart data={datosArea} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="nombre" width={140} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="cantidad" name="Tickets" fill="#1e6fb8" radius={[0, 4, 4, 0]} activeBar={{ fill: '#0f4c81' }} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Tarjeta>
    </div>
  )
}
