import { type FormEvent, useEffect, useState } from 'react'

import {
  type Equipo,
  ESTADOS,
  etiquetaEstado,
  etiquetaPropiedad,
} from '../../entities/equipo'
import type { Sede } from '../../entities/sede'
import { type Columna, DataTable } from '../../shared/ui/DataTable'
import { type FiltroEquipos, listarEquipos, obtenerFotoUrl } from './equiposApi'
import { HojaVida } from './HojaVida'
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
  const [ver, setVer] = useState<Equipo | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [hoja, setHoja] = useState<Equipo | null>(null)

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

  function abrirResumen(e: Equipo) {
    setVer(e)
    setFotoUrl(null)
    if (e.foto_mime) obtenerFotoUrl(e.id).then(setFotoUrl)
  }

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
    {
      header: '',
      ancho: 50,
      celda: (e) => (
        <button className="icon-btn" title="Ver resumen" onClick={() => abrirResumen(e)}>
          👁️
        </button>
      ),
    },
  ]

  return (
    <div className="stack">
      <div className="card">
        <div className="detail-head">
          <h2>Equipos</h2>
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

      {ver && (
        <ResumenModal
          equipo={ver}
          fotoUrl={fotoUrl}
          onGenerarHoja={() => setHoja(ver)}
          onCerrar={() => setVer(null)}
        />
      )}

      {hoja && (
        <HojaVida equipo={hoja} fotoUrl={fotoUrl} onCerrar={() => setHoja(null)} />
      )}
    </div>
  )
}

// ---- Resumen del equipo (solo lectura) ----
const D = (x: string | number | null | undefined) => (x != null && x !== '' ? String(x) : '—')
const L = (a: string[] | null | undefined) => (a && a.length ? a.join(', ') : '—')
const SN = (b: boolean) => (b ? 'Sí' : 'No')

function Dato({ k, val }: { k: string; val: string }) {
  return (
    <div className="rz-dato">
      <span className="rz-k">{k}</span>
      <span className="rz-v">{val}</span>
    </div>
  )
}

function ResumenModal({
  equipo: e,
  fotoUrl,
  onGenerarHoja,
  onCerrar,
}: {
  equipo: Equipo
  fotoUrl: string | null
  onGenerarHoja: () => void
  onCerrar: () => void
}) {
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal card modal-ancho" onClick={(e) => e.stopPropagation()}>
        <div className="detail-head">
          <h3>
            {e.nombre} <span className="muted">· {e.codigo_interno}</span>
          </h3>
          <button className="btn-primary" onClick={onGenerarHoja}>
            📄 Generar hoja de vida
          </button>
        </div>

        <div className="rz-cuerpo">
          <div className="rz-foto">
            {fotoUrl ? (
              <img src={fotoUrl} alt="Foto del equipo" />
            ) : (
              <span className="muted small">Sin foto</span>
            )}
          </div>
          <div className="rz-datos">
            <h4 className="grupo-tit">Identificación</h4>
            <Dato k="Marca" val={D(e.marca)} />
            <Dato k="Modelo" val={D(e.modelo)} />
            <Dato k="Serial" val={D(e.serial_fabricante)} />
            <Dato k="N° activo" val={D(e.numero_activo)} />
            <Dato k="Estado" val={etiquetaEstado(e.estado)} />

            <h4 className="grupo-tit">Ubicación</h4>
            <Dato k="Sede" val={D(e.sede_nombre)} />
            <Dato k="Servicio" val={D(e.servicio_nombre)} />
            <Dato k="Piso" val={D(e.piso)} />

            <h4 className="grupo-tit">Clasificación</h4>
            <Dato k="Clase biomédica" val={D(e.clase_biomedica)} />
            <Dato k="Clase de uso" val={D(e.clase_uso)} />
            <Dato k="Riesgo" val={D(e.clasificacion_riesgo)} />
            <Dato k="Tecnología" val={D(e.tecnologia_predominante)} />
            <Dato k="Propiedad" val={etiquetaPropiedad(e.propiedad)} />

            <h4 className="grupo-tit">Registro INVIMA</h4>
            <Dato k="Registro" val={D(e.registro_invima)} />
            <Dato k="Vencimiento" val={D(e.fecha_vencimiento_invima)} />

            <h4 className="grupo-tit">Documentación</h4>
            <Dato k="Fuente alimentación" val={L(e.fuentes_alimentacion)} />
            <Dato k="Manuales" val={L(e.manuales)} />
            <Dato k="Planos" val={L(e.planos)} />

            <h4 className="grupo-tit">Mantenimiento</h4>
            <Dato k="Periodicidad" val={D(e.periodicidad_mantenimiento)} />
            <Dato
              k="Requiere calibración"
              val={e.calibracion_si ? 'Sí' : e.calibracion_no ? 'No' : '—'}
            />
            <Dato k="Móvil / Fijo" val={`${SN(e.equipo_movil)} / ${SN(e.equipo_fijo)}`} />
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
