import { type FormEvent, useEffect, useState } from 'react'

import { type Equipo, ESTADOS, etiquetaEstado } from '../../entities/equipo'
import type { Sede } from '../../entities/sede'
import { type Columna, DataTable } from '../../shared/ui/DataTable'
import { type FiltroEquipos, listarEquipos } from './equiposApi'
import { listarSedes } from './sedesApi'

function detalleError(err: unknown, porDefecto: string): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    porDefecto
  )
}

/** Vista resumen (solo lectura) de los equipos. La gestión completa vive en Inventario. */
export function EquiposPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [filtros, setFiltros] = useState<FiltroEquipos>({})
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function cargar(f: FiltroEquipos = filtros) {
    setEquipos(await listarEquipos(f))
  }

  useEffect(() => {
    ;(async () => {
      try {
        const [eq, sd] = await Promise.all([listarEquipos(), listarSedes()])
        setEquipos(eq)
        setSedes(sd)
      } catch (err) {
        setError(detalleError(err, 'No se pudieron cargar los equipos.'))
      } finally {
        setCargando(false)
      }
    })()
  }, [])

  function aplicar(cambio: Partial<FiltroEquipos>) {
    const nuevos = { ...filtros, ...cambio }
    setFiltros(nuevos)
    cargar(nuevos).catch((err) => setError(detalleError(err, 'Error al filtrar.')))
  }

  function buscarTexto(e: FormEvent) {
    e.preventDefault()
    aplicar({ texto: texto.trim() || undefined })
  }

  if (cargando) return <div className="muted">Cargando equipos…</div>

  const columnas: Columna<Equipo>[] = [
    { header: 'Código interno', celda: (e) => e.codigo_interno },
    { header: 'Nombre de equipo', celda: (e) => e.nombre },
    { header: 'Marca', celda: (e) => e.marca || '—' },
    { header: 'Modelo', celda: (e) => e.modelo || '—' },
    { header: 'Serial', celda: (e) => e.serial_fabricante },
    {
      header: 'Ubicación',
      celda: (e) =>
        `${e.sede_nombre || '—'}${e.servicio_nombre ? ` / ${e.servicio_nombre}` : ''}`,
    },
    { header: 'Estado', celda: (e) => etiquetaEstado(e.estado) },
  ]

  return (
    <div className="stack">
      <div className="card">
        <div className="detail-head">
          <h2>Equipos (resumen)</h2>
        </div>

        <form className="filtros" onSubmit={buscarTexto}>
          <input
            className="filtro-texto"
            placeholder="Buscar por nombre, código, serial o marca…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <select
            value={filtros.sede_id ?? ''}
            onChange={(e) =>
              aplicar({ sede_id: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            <option value="">Todas las sedes</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          <select
            value={filtros.estado ?? ''}
            onChange={(e) => aplicar({ estado: (e.target.value || undefined) as never })}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button className="btn-ghost" type="submit">
            Buscar
          </button>
        </form>

        {error && <div className="alert-error">{error}</div>}

        <DataTable
          columnas={columnas}
          filas={equipos}
          keyOf={(e) => e.id}
          porPagina={50}
          vacio="No hay equipos que coincidan."
        />
      </div>
    </div>
  )
}
