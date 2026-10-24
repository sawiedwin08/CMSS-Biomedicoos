import { Boxes, CalendarClock, Shield, ShieldAlert, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  type Equipo,
  type EstadoEquipo,
  etiquetaEstado,
  proximoMantenimiento,
  semaforoVencimiento,
} from '../../entities/equipo'
import { useAuth } from '../../shared/auth/AuthContext'
import { listarEquipos } from '../inventario/equiposApi'
import {
  obtenerTodasOrdenesTrabajo,
  type EstadoOT,
  type OTRead,
} from '../mantenimiento/mantenimientoApi'

// Colores de estado del equipo (paleta de estado: identidad + leyenda, nunca color solo).
const ESTADO_COLOR: Record<EstadoEquipo, string> = {
  operativo: '#0ca30c',
  mantenimiento: '#fab219',
  fuera_de_servicio: '#d03b3b',
  baja: '#898781',
}
const AZUL = '#1e6fb8'

const ESTADO_OT_LABEL: Record<EstadoOT, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
  cancelada: 'Cancelada',
}
const ESTADO_OT_COLOR: Record<EstadoOT, string> = {
  pendiente: '#fab219',
  en_progreso: '#1e6fb8',
  completada: '#0ca30c',
  cancelada: '#898781',
}

interface Alerta {
  equipo: Equipo
  dias: number
  estado: 'rojo' | 'amarillo'
}

// Etiqueta permanente de la dona: línea guía + nombre, conteo y porcentaje.
// Se dibuja siempre (no depende del hover), así la dona se ve completa siempre.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderLabel(props: any) {
  const RADIAN = Math.PI / 180
  const { cx, cy, midAngle, outerRadius, percent, value, name } = props
  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 8) * cos
  const sy = cy + (outerRadius + 8) * sin
  const mx = cx + (outerRadius + 22) * cos
  const my = cy + (outerRadius + 22) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 16
  const ey = my
  const anchor = cos >= 0 ? 'start' : 'end'
  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#bbb" fill="none" />
      <circle cx={ex} cy={ey} r={2} fill="#bbb" stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 10}
        y={ey}
        textAnchor={anchor}
        fill="#333"
        style={{ fontSize: 12, fontWeight: 600 }}
      >
        {`${name}: ${value}`}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 10}
        y={ey}
        dy={15}
        textAnchor={anchor}
        fill="#999"
        style={{ fontSize: 11 }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  )
}

function fechaCorta(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function DashboardPage() {
  const { usuario, puede } = useAuth()
  const verInv = puede('inventario:ver')
  const verMant = puede('mantenimiento:ver')

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [ordenes, setOrdenes] = useState<OTRead[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [eq, ots] = await Promise.all([
          verInv ? listarEquipos() : Promise.resolve([]),
          verMant ? obtenerTodasOrdenesTrabajo() : Promise.resolve([]),
        ])
        setEquipos(eq)
        setOrdenes(ots)
      } catch {
        /* sin permisos o error de red: el dashboard muestra lo que haya */
      } finally {
        setCargando(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    // Equipos por estado
    const porEstadoMap = new Map<EstadoEquipo, number>()
    for (const e of equipos) porEstadoMap.set(e.estado, (porEstadoMap.get(e.estado) ?? 0) + 1)
    const porEstado = (Object.keys(ESTADO_COLOR) as EstadoEquipo[])
      .map((k) => ({ key: k, label: etiquetaEstado(k), total: porEstadoMap.get(k) ?? 0 }))
      .filter((d) => d.total > 0)

    // Alertas de vencimiento + estado de mantenimiento
    const invima: Alerta[] = []
    const garantia: Alerta[] = []
    const manto: Alerta[] = []
    let mAlDia = 0
    let mPorVencer = 0
    let mAtrasado = 0
    let mSinProg = 0
    for (const e of equipos) {
      const si = semaforoVencimiento(e.fecha_vencimiento_invima)
      if (si && si.estado !== 'verde') invima.push({ equipo: e, dias: si.dias, estado: si.estado })

      const sg = semaforoVencimiento(e.fecha_final_garantia)
      if (sg && sg.estado !== 'verde') garantia.push({ equipo: e, dias: sg.dias, estado: sg.estado })

      const prox = proximoMantenimiento(e.ultimo_mantenimiento_efectivo, e.periodicidad_mantenimiento)
      const sm = prox ? semaforoVencimiento(prox) : null
      if (!sm) {
        mSinProg++
      } else if (sm.estado === 'rojo') {
        mAtrasado++
        manto.push({ equipo: e, dias: sm.dias, estado: 'rojo' })
      } else if (sm.estado === 'amarillo') {
        mPorVencer++
        manto.push({ equipo: e, dias: sm.dias, estado: 'amarillo' })
      } else {
        mAlDia++
      }
    }

    // Distribución del estado de mantenimiento (para la dona)
    const mantEstado = [
      { key: 'al_dia', label: 'Al día', total: mAlDia, color: '#0ca30c' },
      { key: 'por_vencer', label: 'Por vencer', total: mPorVencer, color: '#fab219' },
      { key: 'atrasado', label: 'Atrasado', total: mAtrasado, color: '#d03b3b' },
      { key: 'sin_programar', label: 'Sin programar', total: mSinProg, color: '#898781' },
    ].filter((d) => d.total > 0)
    const ordenar = (a: Alerta[]) => a.sort((x, y) => x.dias - y.dias)
    ordenar(invima)
    ordenar(garantia)
    ordenar(manto)

    // Equipos que requieren atención (algún semáforo rojo)
    const conAlertaRoja = new Set<number>()
    for (const a of [...invima, ...garantia, ...manto]) {
      if (a.estado === 'rojo' && a.equipo.id != null) conAlertaRoja.add(a.equipo.id)
    }

    const operativos = porEstadoMap.get('operativo') ?? 0
    const otPendientes = ordenes.filter((o) => o.estado === 'pendiente').length

    // OT por estado (para mini-resumen) y recientes
    const otRecientes = [...ordenes]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)

    return {
      total: equipos.length,
      operativos,
      otPendientes,
      requierenAtencion: conAlertaRoja.size,
      porEstado,
      mantEstado,
      invima,
      garantia,
      manto,
      otRecientes,
    }
  }, [equipos, ordenes])

  if (!usuario) return null
  if (cargando) return <div className="muted">Cargando panel…</div>

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: '0 0 4px' }}>Hola, {usuario.nombre} 👋</h2>
        <p className="muted" style={{ margin: 0 }}>Resumen del estado de los equipos biomédicos.</p>
      </div>

      {/* ===== KPIs ===== */}
      {verInv && (
        <div className="dash-kpis">
          <KpiCard icono={<Boxes size={22} />} valor={stats.total} etiqueta="Equipos totales" color={AZUL} />
          {verMant && (
            <KpiCard icono={<Wrench size={22} />} valor={stats.otPendientes} etiqueta="OT pendientes" color="#fab219" />
          )}
          <KpiCard
            icono={<ShieldAlert size={22} />}
            valor={stats.requierenAtencion}
            etiqueta="Requieren atención"
            color="#d03b3b"
          />
        </div>
      )}

      {/* ===== Gráficos ===== */}
      {verInv && stats.total > 0 && (
        <div className="dash-graficos">
          <div className="card">
            <h3 className="dash-tit">Equipos por estado</h3>
            <div className="dash-chart">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart margin={{ top: 8, right: 70, bottom: 8, left: 70 }}>
                  <Pie
                    data={stats.porEstado}
                    dataKey="total"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                    label={renderLabel}
                    labelLine={false}
                    isAnimationActive
                    animationBegin={150}
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {stats.porEstado.map((d) => (
                      <Cell key={d.key} fill={ESTADO_COLOR[d.key]} />
                    ))}
                  </Pie>
                  {/* Anillo exterior decorativo (como la vista completa) */}
                  <Pie
                    data={stats.porEstado}
                    dataKey="total"
                    cx="50%"
                    cy="50%"
                    innerRadius={84}
                    outerRadius={88}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {stats.porEstado.map((d) => (
                      <Cell key={d.key} fill={ESTADO_COLOR[d.key]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={28} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              <div className="dash-dona-centro">
                <span className="dash-dona-num">{stats.total}</span>
                <span className="dash-dona-lbl">equipos</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="dash-tit">Estado de mantenimiento</h3>
            {stats.mantEstado.length === 0 ? (
              <p className="muted small" style={{ padding: '40px 0', textAlign: 'center' }}>
                Aún no hay equipos con mantenimiento programado.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.mantEstado} margin={{ top: 16, right: 8, left: -12, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke="#e1e0d9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#52514e' }}
                    tickLine={false}
                    axisLine={{ stroke: '#c3c2b7' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={34}
                    tick={{ fontSize: 11, fill: '#898781' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    formatter={(value) => [`${value}`, 'Equipos']}
                  />
                  <Bar
                    dataKey="total"
                    radius={[8, 8, 0, 0]}
                    activeBar
                    maxBarSize={64}
                    label={{ position: 'top', fontSize: 12, fontWeight: 600, fill: '#52514e' }}
                    isAnimationActive
                    animationBegin={150}
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {stats.mantEstado.map((d) => (
                      <Cell key={d.key} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ===== Alertas ===== */}
      {verInv && (
        <div className="dash-alertas">
          <ListaAlertas
            titulo="INVIMA por vencer"
            icono={<Shield size={16} />}
            sufijo="vence"
            alertas={stats.invima}
          />
          <ListaAlertas
            titulo="Garantías por vencer"
            icono={<CalendarClock size={16} />}
            sufijo="vence"
            alertas={stats.garantia}
          />
          <ListaAlertas
            titulo="Mantenimiento atrasado"
            icono={<Wrench size={16} />}
            sufijo="programado"
            alertas={stats.manto}
          />
        </div>
      )}

      {/* ===== Actividad reciente ===== */}
      {verMant && stats.otRecientes.length > 0 && (
        <div className="card">
          <h3 className="dash-tit">Órdenes de trabajo recientes</h3>
          <div className="docs-tabla-container">
            <table className="docs-tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Equipo</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {stats.otRecientes.map((ot) => (
                  <tr key={ot.id}>
                    <td style={{ fontWeight: 600 }}>#{ot.id}</td>
                    <td className="docs-nombre-col">{ot.equipo_nombre || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{ot.tipo}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: ESTADO_OT_COLOR[ot.estado],
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {ESTADO_OT_LABEL[ot.estado]}
                      </span>
                    </td>
                    <td className="docs-usuario-col">{fechaCorta(ot.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!verInv && !verMant && (
        <div className="card aviso">No tienes módulos con datos para mostrar en el panel.</div>
      )}
    </div>
  )
}

function KpiCard({
  icono,
  valor,
  etiqueta,
  color,
}: {
  icono: React.ReactNode
  valor: number
  etiqueta: string
  color: string
}) {
  return (
    <div className="card dash-kpi">
      <span className="dash-kpi-ico" style={{ background: `${color}1a`, color }}>
        {icono}
      </span>
      <div>
        <div className="dash-kpi-num">{valor}</div>
        <div className="dash-kpi-lbl">{etiqueta}</div>
      </div>
    </div>
  )
}

function ListaAlertas({
  titulo,
  icono,
  sufijo,
  alertas,
}: {
  titulo: string
  icono: React.ReactNode
  sufijo: string
  alertas: Alerta[]
}) {
  return (
    <div className="card">
      <h3 className="dash-tit">
        <span className="dash-alerta-ico">{icono}</span>
        {titulo}
        {alertas.length > 0 && <span className="dash-contador">{alertas.length}</span>}
      </h3>
      {alertas.length === 0 ? (
        <p className="muted small" style={{ margin: 0 }}>Sin alertas 🎉</p>
      ) : (
        <ul className="dash-lista">
          {alertas.slice(0, 5).map((a) => (
            <li key={a.equipo.id}>
              <span className={`dash-dot dash-dot-${a.estado}`} />
              <span className="dash-lista-nom">
                <strong>{a.equipo.codigo_interno}</strong>
                <span className="muted"> · {a.equipo.nombre}</span>
              </span>
              <span className={`invima-venc invima-${a.estado}`}>
                {a.dias < 0
                  ? `vencido hace ${Math.abs(a.dias)} d`
                  : a.dias === 0
                    ? `${sufijo} hoy`
                    : `${sufijo} en ${a.dias} d`}
              </span>
            </li>
          ))}
          {alertas.length > 5 && (
            <li className="dash-lista-mas muted small">y {alertas.length - 5} más…</li>
          )}
        </ul>
      )}
    </div>
  )
}
