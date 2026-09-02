import { type FormEvent, useEffect, useState } from 'react'

import {
  CRITICIDADES,
  type Equipo,
  ESTADOS,
  etiquetaPropiedad,
  PROPIEDADES,
  RIESGOS,
} from '../../entities/equipo'
import type { Proveedor } from '../../entities/proveedor'
import type { Sede } from '../../entities/sede'
import type { Servicio } from '../../entities/servicio'
import { useAuth } from '../../shared/auth/AuthContext'
import { type Columna, DataTable } from '../../shared/ui/DataTable'
import {
  actualizarEquipo,
  crearEquipo,
  type DatosEquipo,
  descargarPlantilla,
  eliminarEquipo,
  type FiltroEquipos,
  importarEquipos,
  listarEquipos,
  type ResultadoImportacion,
} from './equiposApi'
import { listarProveedores } from './proveedoresApi'
import { listarSedes } from './sedesApi'
import { listarServicios } from './serviciosApi'

function detalleError(err: unknown, porDefecto: string): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    porDefecto
  )
}

export function EquiposPage() {
  const { puede } = useAuth()
  const puedeCrear = puede('inventario:crear')
  const puedeEditar = puede('inventario:editar')
  const puedeEliminar = puede('inventario:eliminar')

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [filtros, setFiltros] = useState<FiltroEquipos>({})
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [editando, setEditando] = useState<Equipo | 'nuevo' | null>(null)
  const [importar, setImportar] = useState(false)

  async function cargarEquipos(f: FiltroEquipos = filtros) {
    setEquipos(await listarEquipos(f))
  }

  useEffect(() => {
    ;(async () => {
      try {
        const [eq, sd, sv, pr] = await Promise.all([
          listarEquipos(),
          listarSedes(),
          listarServicios(),
          listarProveedores(),
        ])
        setEquipos(eq)
        setSedes(sd)
        setServicios(sv)
        setProveedores(pr)
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
    cargarEquipos(nuevos).catch((err) =>
      setError(detalleError(err, 'Error al filtrar.')),
    )
  }

  function buscarTexto(e: FormEvent) {
    e.preventDefault()
    aplicar({ texto: texto.trim() || undefined })
  }

  async function borrar(eq: Equipo) {
    if (!window.confirm(`¿Eliminar el equipo "${eq.nombre}" (${eq.codigo_interno})?`))
      return
    setError(null)
    setMensaje(null)
    try {
      await eliminarEquipo(eq.id)
      await cargarEquipos()
      setMensaje('Equipo eliminado.')
    } catch (err) {
      setError(detalleError(err, 'No se pudo eliminar el equipo.'))
    }
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
    { header: 'INVIMA', celda: (e) => e.registro_invima || '—' },
    { header: 'Fecha vencimiento registro INVIMA', celda: (e) => e.fin_garantia || '—' },
    { header: 'Clasificación', celda: (e) => e.clasificacion_riesgo || '—' },
    { header: 'Propiedad', celda: (e) => etiquetaPropiedad(e.propiedad) },
    {
      header: '',
      ancho: 90,
      celda: (e) => (
        <>
          {puedeEditar && (
            <button
              className="icon-btn"
              title="Editar"
              onClick={() => {
                setError(null)
                setMensaje(null)
                setEditando(e)
              }}
            >
              ✏️
            </button>
          )}
          {puedeEliminar && (
            <button className="icon-btn" title="Eliminar" onClick={() => borrar(e)}>
              🗑️
            </button>
          )}
        </>
      ),
    },
  ]

  return (
    <div className="stack">
      <div className="card">
        <div className="detail-head">
          <h2>Equipos biomédicos</h2>
          {puedeCrear && (
            <div className="acciones-head">
              <button className="btn-ghost" onClick={() => setImportar(true)}>
                Importar Excel
              </button>
              {sedes.length > 0 && (
                <button className="btn-primary" onClick={() => setEditando('nuevo')}>
                  + Registrar equipo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filtros (RF-007) */}
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
            onChange={(e) =>
              aplicar({ estado: (e.target.value || undefined) as never })
            }
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filtros.criticidad ?? ''}
            onChange={(e) =>
              aplicar({ criticidad: (e.target.value || undefined) as never })
            }
          >
            <option value="">Toda criticidad</option>
            {CRITICIDADES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={filtros.propiedad ?? ''}
            onChange={(e) =>
              aplicar({ propiedad: (e.target.value || undefined) as never })
            }
          >
            <option value="">Toda propiedad</option>
            {PROPIEDADES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <button className="btn-ghost" type="submit">
            Buscar
          </button>
        </form>

        {mensaje && <div className="alert-ok">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}
        {puedeCrear && sedes.length === 0 && (
          <div className="aviso" style={{ marginTop: 12 }}>
            Registra una <strong>sede</strong> antes de crear equipos.
          </div>
        )}

        <DataTable
          columnas={columnas}
          filas={equipos}
          keyOf={(e) => e.id}
          porPagina={50}
          vacio="No hay equipos que coincidan."
        />
      </div>

      {editando && (
        <div className="modal-overlay" onClick={() => setEditando(null)}>
          <div className="modal card modal-ancho" onClick={(e) => e.stopPropagation()}>
            <EquipoForm
              inicial={editando === 'nuevo' ? undefined : editando}
              sedes={sedes}
              servicios={servicios}
              proveedores={proveedores}
              onGuardar={async (datos) => {
                if (editando === 'nuevo') {
                  await crearEquipo(datos)
                  setMensaje('Equipo registrado.')
                } else {
                  await actualizarEquipo(editando.id, datos)
                  setMensaje('Equipo actualizado.')
                }
                setEditando(null)
                await cargarEquipos()
              }}
              onError={setError}
              onCancelar={() => setEditando(null)}
            />
          </div>
        </div>
      )}

      {importar && (
        <ImportarModal
          onCerrar={() => setImportar(false)}
          onImportado={async (r) => {
            await cargarEquipos()
            if (r.creados > 0) setMensaje(`${r.creados} equipo(s) importado(s).`)
          }}
        />
      )}
    </div>
  )
}

function ImportarModal({
  onCerrar,
  onImportado,
}: {
  onCerrar: () => void
  onImportado: (r: ResultadoImportacion) => void | Promise<void>
}) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function importar() {
    if (!archivo) return
    setSubiendo(true)
    setError(null)
    try {
      const r = await importarEquipos(archivo)
      setResultado(r)
      await onImportado(r)
    } catch (err) {
      setError(detalleError(err, 'No se pudo importar el archivo.'))
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3>Importar equipos desde Excel</h3>
        <p className="muted small">
          Descarga la plantilla, complétala y súbela. Las filas con error se
          reportan y no detienen a las demás.
        </p>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => descargarPlantilla().catch(() => setError('No se pudo descargar la plantilla.'))}
        >
          ⬇ Descargar plantilla
        </button>

        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => {
            setArchivo(e.target.files?.[0] ?? null)
            setResultado(null)
          }}
        />

        {error && <div className="alert-error">{error}</div>}

        {resultado && (
          <div className={resultado.errores.length ? 'alert-error' : 'alert-ok'}>
            Procesadas: {resultado.total} · Creadas: {resultado.creados} · Con error:{' '}
            {resultado.errores.length}
          </div>
        )}
        {resultado && resultado.errores.length > 0 && (
          <div className="tabla-wrap" style={{ maxHeight: 200, overflowY: 'auto' }}>
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {resultado.errores.map((e) => (
                  <tr key={e.fila}>
                    <td>{e.fila}</td>
                    <td>{e.mensaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCerrar}>
            Cerrar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!archivo || subiendo}
            onClick={importar}
          >
            {subiendo ? 'Importando…' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EquipoForm({
  inicial,
  sedes,
  servicios,
  proveedores,
  onGuardar,
  onError,
  onCancelar,
}: {
  inicial?: Equipo
  sedes: Sede[]
  servicios: Servicio[]
  proveedores: Proveedor[]
  onGuardar: (datos: DatosEquipo) => Promise<void>
  onError: (msg: string) => void
  onCancelar: () => void
}) {
  const [f, setF] = useState<DatosEquipo>({
    codigo_interno: inicial?.codigo_interno ?? '',
    serial_fabricante: inicial?.serial_fabricante ?? '',
    nombre: inicial?.nombre ?? '',
    estado: inicial?.estado ?? 'operativo',
    marca: inicial?.marca ?? null,
    modelo: inicial?.modelo ?? null,
    criticidad: inicial?.criticidad ?? null,
    registro_invima: inicial?.registro_invima ?? null,
    clasificacion_riesgo: inicial?.clasificacion_riesgo ?? null,
    propiedad: inicial?.propiedad ?? null,
    sede_id: inicial?.sede_id ?? null,
    servicio_id: inicial?.servicio_id ?? null,
    proveedor_id: inicial?.proveedor_id ?? null,
    fecha_adquisicion: inicial?.fecha_adquisicion ?? null,
    costo_adquisicion:
      inicial?.costo_adquisicion != null ? String(inicial.costo_adquisicion) : null,
    fin_garantia: inicial?.fin_garantia ?? null,
    orden_compra: inicial?.orden_compra ?? null,
  })
  const [guardando, setGuardando] = useState(false)

  function set<K extends keyof DatosEquipo>(campo: K, valor: DatosEquipo[K]) {
    setF((prev) => ({ ...prev, [campo]: valor }))
  }

  const serviciosDeSede = servicios.filter((s) => s.sede_id === f.sede_id)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      await onGuardar({
        ...f,
        codigo_interno: f.codigo_interno.trim(),
        serial_fabricante: f.serial_fabricante.trim(),
        nombre: f.nombre.trim(),
      })
    } catch (err) {
      onError(detalleError(err, 'No se pudo guardar el equipo.'))
    } finally {
      setGuardando(false)
    }
  }

  const txt = (v: string | null) => v ?? ''

  return (
    <form onSubmit={onSubmit}>
      <h3>{inicial ? 'Editar equipo' : 'Registrar equipo'}</h3>

      <h4 className="grupo-tit">Identificación</h4>
      <div className="form-grid">
        <label className="field">
          <span>Código interno {inicial ? '*' : ''}</span>
          <input
            value={f.codigo_interno ?? ''}
            onChange={(e) => set('codigo_interno', e.target.value)}
            required={Boolean(inicial)}
            placeholder={inicial ? '' : 'Automático (EQ-0001) si lo dejas vacío'}
          />
        </label>
        <label className="field">
          <span>Serial del fabricante *</span>
          <input value={f.serial_fabricante} onChange={(e) => set('serial_fabricante', e.target.value)} required />
        </label>
        <label className="field">
          <span>Nombre *</span>
          <input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} required minLength={2} />
        </label>
        <label className="field">
          <span>Marca</span>
          <input value={txt(f.marca)} onChange={(e) => set('marca', e.target.value || null)} />
        </label>
        <label className="field">
          <span>Modelo</span>
          <input value={txt(f.modelo)} onChange={(e) => set('modelo', e.target.value || null)} />
        </label>
        <label className="field">
          <span>Criticidad</span>
          <select value={txt(f.criticidad)} onChange={(e) => set('criticidad', (e.target.value || null) as never)}>
            <option value="">—</option>
            {CRITICIDADES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
      </div>

      <h4 className="grupo-tit">Registro INVIMA y estado</h4>
      <div className="form-grid">
        <label className="field">
          <span>Registro INVIMA</span>
          <input value={txt(f.registro_invima)} onChange={(e) => set('registro_invima', e.target.value || null)} />
        </label>
        <label className="field">
          <span>Clasificación de riesgo</span>
          <select value={txt(f.clasificacion_riesgo)} onChange={(e) => set('clasificacion_riesgo', (e.target.value || null) as never)}>
            <option value="">—</option>
            {RIESGOS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Estado</span>
          <select value={f.estado} onChange={(e) => set('estado', e.target.value as never)}>
            {ESTADOS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      <h4 className="grupo-tit">Ubicación</h4>
      <div className="form-grid">
        <label className="field">
          <span>Sede</span>
          <select
            value={f.sede_id ?? ''}
            onChange={(e) => {
              const sede = e.target.value ? Number(e.target.value) : null
              setF((prev) => ({ ...prev, sede_id: sede, servicio_id: null }))
            }}
          >
            <option value="">—</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Servicio</span>
          <select
            value={f.servicio_id ?? ''}
            onChange={(e) => set('servicio_id', e.target.value ? Number(e.target.value) : null)}
            disabled={!f.sede_id}
          >
            <option value="">—</option>
            {serviciosDeSede.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </label>
      </div>

      <h4 className="grupo-tit">Adquisición</h4>
      <div className="form-grid">
        <label className="field">
          <span>Propiedad</span>
          <select value={txt(f.propiedad)} onChange={(e) => set('propiedad', (e.target.value || null) as never)}>
            <option value="">—</option>
            {PROPIEDADES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Proveedor</span>
          <select value={f.proveedor_id ?? ''} onChange={(e) => set('proveedor_id', e.target.value ? Number(e.target.value) : null)}>
            <option value="">—</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Fecha de adquisición</span>
          <input type="date" value={txt(f.fecha_adquisicion)} onChange={(e) => set('fecha_adquisicion', e.target.value || null)} />
        </label>
        <label className="field">
          <span>Costo</span>
          <input type="number" step="0.01" min="0" value={txt(f.costo_adquisicion)} onChange={(e) => set('costo_adquisicion', e.target.value || null)} />
        </label>
        <label className="field">
          <span>Fin de garantía</span>
          <input type="date" value={txt(f.fin_garantia)} onChange={(e) => set('fin_garantia', e.target.value || null)} />
        </label>
        <label className="field">
          <span>Orden de compra</span>
          <input value={txt(f.orden_compra)} onChange={(e) => set('orden_compra', e.target.value || null)} />
        </label>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-ghost" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
