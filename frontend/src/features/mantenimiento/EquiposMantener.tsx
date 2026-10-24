import { Search, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  type Equipo,
  proximoMantenimiento,
  semaforoVencimiento,
} from '../../entities/equipo'
import { useAuth } from '../../shared/auth/AuthContext'
import { listarEquipos } from '../inventario/equiposApi'
import { CrearOTModal } from './CrearOTModal'
import { obtenerTodasOrdenesTrabajo } from './mantenimientoApi'

type EstadoMant = 'atrasado' | 'por_vencer' | 'al_dia' | 'sin_programar'
type Filtro = 'todos' | EstadoMant

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'por_vencer', label: 'Por vencer' },
  { value: 'al_dia', label: 'Al día' },
  { value: 'sin_programar', label: 'Sin programar' },
]

const PILL: Record<EstadoMant, { clase: string; label: string }> = {
  atrasado: { clase: 'invima-rojo', label: 'Atrasado' },
  por_vencer: { clase: 'invima-amarillo', label: 'Por vencer' },
  al_dia: { clase: 'invima-verde', label: 'Al día' },
  sin_programar: { clase: '', label: 'Sin programar' },
}

const LS_FILTRO = 'mant_equipos_filtro'
const LS_BUSQUEDA = 'mant_equipos_busqueda'

interface Fila {
  equipo: Equipo
  estadoMant: EstadoMant
  proxima: string | null
  dias: number | null
}

function estadoDeMantenimiento(e: Equipo): { estadoMant: EstadoMant; proxima: string | null; dias: number | null } {
  const proxima = proximoMantenimiento(e.ultimo_mantenimiento_efectivo, e.periodicidad_mantenimiento)
  const s = proxima ? semaforoVencimiento(proxima) : null
  if (!s) return { estadoMant: 'sin_programar', proxima: null, dias: null }
  const estadoMant: EstadoMant =
    s.estado === 'rojo' ? 'atrasado' : s.estado === 'amarillo' ? 'por_vencer' : 'al_dia'
  return { estadoMant, proxima, dias: s.dias }
}

export function EquiposMantener() {
  const { puede } = useAuth()
  const puedeCrear = puede('mantenimiento:crear')

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [otAbiertas, setOtAbiertas] = useState<Set<number>>(new Set())
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const [filtro, setFiltro] = useState<Filtro>(() => {
    try {
      return (localStorage.getItem(LS_FILTRO) as Filtro) || 'todos'
    } catch {
      return 'todos'
    }
  })
  const [busqueda, setBusqueda] = useState(() => {
    try {
      return localStorage.getItem(LS_BUSQUEDA) || ''
    } catch {
      return ''
    }
  })
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set())
  const [generarPara, setGenerarPara] = useState<number[] | null>(null)

  // Persistir filtro y búsqueda (no se pierden al salir y volver).
  useEffect(() => {
    try {
      localStorage.setItem(LS_FILTRO, filtro)
    } catch {
      /* ignore */
    }
  }, [filtro])
  useEffect(() => {
    try {
      localStorage.setItem(LS_BUSQUEDA, busqueda)
    } catch {
      /* ignore */
    }
  }, [busqueda])

  async function cargarDatos() {
    try {
      const [eqs, ots] = await Promise.all([listarEquipos(), obtenerTodasOrdenesTrabajo()])
      setEquipos(eqs)
      // Equipos con OT abierta (pendiente o en progreso) = mantenimiento en proceso.
      const abiertas = new Set<number>()
      for (const o of ots) {
        if (o.estado === 'pendiente' || o.estado === 'en_progreso') abiertas.add(o.equipo_id)
      }
      setOtAbiertas(abiertas)
    } catch {
      setError('No se pudieron cargar los equipos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filas = useMemo<Fila[]>(() => {
    const texto = busqueda.trim().toLowerCase()
    return equipos
      .map((e) => ({ equipo: e, ...estadoDeMantenimiento(e) }))
      .filter((f) => (filtro === 'todos' ? true : f.estadoMant === filtro))
      .filter((f) => {
        if (!texto) return true
        const e = f.equipo
        return (
          e.codigo_interno.toLowerCase().includes(texto) ||
          e.nombre.toLowerCase().includes(texto) ||
          (e.servicio_nombre?.toLowerCase().includes(texto) ?? false)
        )
      })
      .sort((a, b) => (a.dias ?? 1e9) - (b.dias ?? 1e9))
  }, [equipos, filtro, busqueda])

  // Seleccionables: visibles que NO tienen ya una OT abierta.
  const idsVisibles = filas
    .map((f) => f.equipo.id!)
    .filter((id) => id && !otAbiertas.has(id))
  const todosSeleccionados = idsVisibles.length > 0 && idsVisibles.every((id) => seleccion.has(id))

  function toggle(id: number) {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleTodos() {
    setSeleccion(() => (todosSeleccionados ? new Set() : new Set(idsVisibles)))
  }

  const seleccionados = [...seleccion]

  if (cargando) return <div className="muted">Cargando equipos…</div>

  return (
    <div className="stack">
      <div className="card">
        <div className="detail-head">
          <h2 style={{ margin: 0 }}>Equipos a mantener</h2>
        </div>

        {/* Filtros por semáforo + búsqueda */}
        <div className="em-toolbar">
          <div className="filtros" style={{ margin: 0 }}>
            {FILTROS.map((f) => (
              <button
                key={f.value}
                className={`btn ${filtro === f.value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFiltro(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="dt-search">
            <Search size={15} />
            <input
              placeholder="Buscar código, nombre o servicio…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {mensaje && <div className="alert-ok">{mensaje}</div>}

        {/* Barra de acciones en lote */}
        {puedeCrear && seleccionados.length > 0 && (
          <div className="em-bulk">
            <span>{seleccionados.length} equipo(s) seleccionado(s)</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-ghost" onClick={() => setSeleccion(new Set())}>
                Limpiar
              </button>
              <button className="btn-primary btn-ico" onClick={() => setGenerarPara(seleccionados)}>
                <Wrench size={16} /> Generar OT ({seleccionados.length})
              </button>
            </div>
          </div>
        )}

        <div className="docs-tabla-container" style={{ marginTop: 12 }}>
          <table className="docs-tabla">
            <thead>
              <tr>
                {puedeCrear && (
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos} />
                  </th>
                )}
                <th>Código</th>
                <th>Nombre</th>
                <th>Servicio</th>
                <th>Último mant.</th>
                <th>Próximo mant.</th>
                {puedeCrear && <th style={{ textAlign: 'right' }}>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td className="dt-empty" colSpan={puedeCrear ? 7 : 5}>
                    No hay equipos para este filtro.
                  </td>
                </tr>
              ) : (
                filas.map(({ equipo: e, estadoMant, proxima, dias }) => {
                  const enProceso = otAbiertas.has(e.id!)
                  return (
                    <tr key={e.id}>
                      {puedeCrear && (
                        <td>
                          <input
                            type="checkbox"
                            checked={seleccion.has(e.id!)}
                            disabled={enProceso}
                            title={enProceso ? 'Ya tiene un mantenimiento en proceso' : ''}
                            onChange={() => toggle(e.id!)}
                          />
                        </td>
                      )}
                      <td style={{ fontWeight: 600 }}>{e.codigo_interno}</td>
                      <td className="docs-nombre-col">{e.nombre}</td>
                      <td className="docs-usuario-col">{e.servicio_nombre || '—'}</td>
                      <td className="docs-usuario-col">{e.ultimo_mantenimiento_efectivo || '—'}</td>
                      <td>
                        {estadoMant === 'sin_programar' || !proxima ? (
                          <span className="muted small">Sin programar</span>
                        ) : (
                          <span className={`invima-venc ${PILL[estadoMant].clase}`} title={proxima}>
                            {dias != null && dias < 0
                              ? `atrasado ${Math.abs(dias)} d`
                              : dias === 0
                                ? 'vence hoy'
                                : `en ${dias} d`}
                          </span>
                        )}
                      </td>
                      {puedeCrear && (
                        <td className="docs-acciones-col">
                          {enProceso ? (
                            <span className="em-enproceso">
                              <Wrench size={13} /> En proceso
                            </span>
                          ) : (
                            <button
                              className="btn-ghost btn-ico"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => setGenerarPara([e.id!])}
                            >
                              <Wrench size={14} /> OT
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {generarPara && (
        <CrearOTModal
          equipoIds={generarPara}
          onClose={() => setGenerarPara(null)}
          onSuccess={() => {
            setGenerarPara(null)
            setSeleccion(new Set())
            setMensaje('Órdenes de trabajo generadas correctamente.')
            setTimeout(() => setMensaje(null), 4000)
            cargarDatos()
          }}
        />
      )}
    </div>
  )
}

