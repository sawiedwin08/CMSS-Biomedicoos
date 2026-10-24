import { Pencil, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import { type Activo } from '../../entities/activo'
import { useAuth } from '../../shared/auth/AuthContext'
import DataTable, { type Columna } from '../../shared/ui/DataTable'
import { cerrarAlClicFuera } from '../../shared/ui/overlay'
import { listarActivos, listarSedesOpc, type Opcion } from './activosApi'
import {
  actualizarEnlace,
  crearEnlace,
  type DatosEnlace,
  eliminarEnlace,
  type Enlace,
  type IpEnUso,
  listarEnlaces,
  listarIps,
} from './redApi'

function detalleError(err: unknown, p: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? p
}

type Tab = 'equipos' | 'enlaces' | 'ips'

export function RedesPage() {
  const { puede } = useAuth()
  const [tab, setTab] = useState<Tab>('equipos')

  return (
    <div className="stack">
      <div className="card">
        <div className="tabs">
          <button className={tab === 'equipos' ? 'tab activo' : 'tab'} onClick={() => setTab('equipos')}>
            Equipos de red
          </button>
          <button className={tab === 'enlaces' ? 'tab activo' : 'tab'} onClick={() => setTab('enlaces')}>
            Enlaces (ISP)
          </button>
          <button className={tab === 'ips' ? 'tab activo' : 'tab'} onClick={() => setTab('ips')}>
            Direccionamiento IP
          </button>
        </div>
      </div>

      {tab === 'equipos' && <EquiposRed />}
      {tab === 'enlaces' && <Enlaces puede={puede} />}
      {tab === 'ips' && <Ips />}
    </div>
  )
}

function EquiposRed() {
  const [items, setItems] = useState<Activo[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    listarActivos({ categoria: 'red' })
      .then(setItems)
      .finally(() => setCargando(false))
  }, [])

  const columnas: Columna<Activo>[] = [
    { id: 'codigo', header: 'Código', accessorFn: (a) => a.codigo_interno },
    { id: 'nombre', header: 'Nombre', accessorFn: (a) => a.nombre },
    { id: 'tipo', header: 'Tipo', accessorFn: (a) => a.tipo_red || '—' },
    { id: 'ip', header: 'IP', accessorFn: (a) => a.ip || '—' },
    { id: 'mac', header: 'MAC', accessorFn: (a) => a.mac || '—' },
    { id: 'puertos', header: 'Puertos', accessorFn: (a) => a.num_puertos ?? '—' },
    { id: 'poe', header: 'PoE', accessorFn: (a) => (a.poe ? 'Sí' : 'No') },
    { id: 'ubic', header: 'Ubicación', accessorFn: (a) => a.ubicacion_fisica || '—' },
  ]

  return (
    <div className="card">
      {cargando ? (
        <div className="muted">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="muted">
          No hay equipos de red. Regístralos en el Inventario con categoría “Equipo de red”.
        </div>
      ) : (
        <DataTable columns={columnas} data={items} title="Equipos de red" initialPageSize={15} />
      )}
    </div>
  )
}

function Ips() {
  const [items, setItems] = useState<IpEnUso[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    listarIps()
      .then(setItems)
      .finally(() => setCargando(false))
  }, [])

  const columnas: Columna<IpEnUso>[] = [
    {
      id: 'ip',
      header: 'IP',
      accessorFn: (r) => r.ip,
      cell: ({ row }) => {
        const r = row.original
        return (
          <span className={r.duplicada ? 'estado-off' : undefined}>
            {r.ip}
            {r.duplicada ? ' ⚠' : ''}
          </span>
        )
      },
    },
    { id: 'origen', header: 'Origen', accessorFn: (r) => (r.origen === 'equipo' ? 'Equipo' : 'Enlace') },
    { id: 'ref', header: 'Asignada a', accessorFn: (r) => r.referencia },
    { id: 'sede', header: 'Sede', accessorFn: (r) => r.sede || '—' },
    { id: 'dup', header: 'Estado', accessorFn: (r) => (r.duplicada ? 'Duplicada' : 'OK') },
  ]

  return (
    <div className="card">
      <p className="muted">
        IPs en uso (de equipos del inventario + enlaces). Las marcadas con ⚠ están duplicadas.
      </p>
      {cargando ? (
        <div className="muted">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="muted">No hay IPs registradas en equipos ni enlaces.</div>
      ) : (
        <DataTable columns={columnas} data={items} title="Direccionamiento IP" initialPageSize={20} />
      )}
    </div>
  )
}

function Enlaces({ puede }: { puede: (c: string) => boolean }) {
  const puedeCrear = puede('sistemas:crear')
  const puedeEditar = puede('sistemas:editar')
  const puedeEliminar = puede('sistemas:eliminar')

  const [items, setItems] = useState<Enlace[]>([])
  const [sedes, setSedes] = useState<Opcion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<Enlace | null>(null)

  async function cargar() {
    setItems(await listarEnlaces())
  }

  useEffect(() => {
    listarSedesOpc().then(setSedes)
    cargar()
      .catch((err) => setError(detalleError(err, 'No se pudieron cargar los enlaces.')))
      .finally(() => setCargando(false))
  }, [])

  async function borrar(e: Enlace) {
    if (!window.confirm(`¿Eliminar el enlace de "${e.proveedor}"?`)) return
    try {
      await eliminarEnlace(e.id)
      await cargar()
      setMensaje('Enlace eliminado.')
    } catch (err) {
      setError(detalleError(err, 'No se pudo eliminar.'))
    }
  }

  const columnas: Columna<Enlace>[] = [
    { id: 'proveedor', header: 'Proveedor', accessorFn: (e) => e.proveedor },
    { id: 'sede', header: 'Sede', accessorFn: (e) => e.sede_nombre || '—' },
    { id: 'tipo', header: 'Tipo', accessorFn: (e) => e.tipo || '—' },
    { id: 'ancho', header: 'Ancho (↓/↑)', accessorFn: (e) => [e.ancho_bajada, e.ancho_subida].filter(Boolean).join(' / ') || '—' },
    { id: 'ip', header: 'IP pública', accessorFn: (e) => e.ip_publica || '—' },
    { id: 'contacto', header: 'Contacto', accessorFn: (e) => [e.contacto, e.telefono].filter(Boolean).join(' · ') || '—' },
    { id: 'estado', header: 'Estado', accessorFn: (e) => e.estado },
    {
      id: 'acciones',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const e = row.original
        return (
          <>
            {puedeEditar && (
              <button className="icon-btn" title="Editar" onClick={() => setEditando(e)}>
                <Pencil size={16} />
              </button>
            )}
            {puedeEliminar && (
              <button className="icon-btn" title="Eliminar" onClick={() => borrar(e)}>
                <Trash2 size={16} />
              </button>
            )}
          </>
        )
      },
    },
  ]

  return (
    <div className="stack">
      {puedeCrear && (
        <div className="card">
          <button className="btn-primary" onClick={() => setCreando(true)}>
            + Nuevo enlace
          </button>
        </div>
      )}
      <div className="card">
        {mensaje && <div className="alert-ok">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}
        {cargando ? (
          <div className="muted">Cargando…</div>
        ) : (
          <DataTable columns={columnas} data={items} title="Enlaces de internet" initialPageSize={15} />
        )}
      </div>

      {(creando || editando) && (
        <div
          className="modal-overlay"
          onMouseDown={cerrarAlClicFuera(() => {
            setCreando(false)
            setEditando(null)
          })}
        >
          <div className="modal card" onClick={(ev) => ev.stopPropagation()} style={{ maxWidth: 680 }}>
            <EnlaceForm
              inicial={editando ?? undefined}
              sedes={sedes}
              onGuardar={async (datos) => {
                if (editando) {
                  await actualizarEnlace(editando.id, datos)
                  setMensaje('Enlace actualizado.')
                } else {
                  await crearEnlace(datos)
                  setMensaje('Enlace creado.')
                }
                setCreando(false)
                setEditando(null)
                await cargar()
              }}
              onError={setError}
              onCancelar={() => {
                setCreando(false)
                setEditando(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function EnlaceForm({
  inicial,
  sedes,
  onGuardar,
  onError,
  onCancelar,
}: {
  inicial?: Enlace
  sedes: Opcion[]
  onGuardar: (datos: DatosEnlace) => Promise<void>
  onError: (m: string) => void
  onCancelar: () => void
}) {
  const [f, setF] = useState<DatosEnlace>({
    proveedor: inicial?.proveedor ?? '',
    sede_id: inicial?.sede_id ?? null,
    tipo: inicial?.tipo ?? null,
    ancho_bajada: inicial?.ancho_bajada ?? null,
    ancho_subida: inicial?.ancho_subida ?? null,
    ip_publica: inicial?.ip_publica ?? null,
    contacto: inicial?.contacto ?? null,
    telefono: inicial?.telefono ?? null,
    costo: inicial?.costo ?? null,
    estado: inicial?.estado ?? 'activo',
    observaciones: inicial?.observaciones ?? null,
  })
  const [guardando, setGuardando] = useState(false)

  function set<K extends keyof DatosEnlace>(k: K, v: DatosEnlace[K]) {
    setF((x) => ({ ...x, [k]: v }))
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    setGuardando(true)
    try {
      await onGuardar(f)
    } catch (err) {
      onError(detalleError(err, 'No se pudo guardar el enlace.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h3>{inicial ? 'Editar enlace' : 'Nuevo enlace'}</h3>
      <div className="form-grid">
        <label className="field">
          <span>Proveedor *</span>
          <input value={f.proveedor} onChange={(e) => set('proveedor', e.target.value)} required />
        </label>
        <label className="field">
          <span>Sede</span>
          <select
            value={f.sede_id ?? ''}
            onChange={(e) => set('sede_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">—</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Tipo</span>
          <input value={f.tipo ?? ''} onChange={(e) => set('tipo', e.target.value)} placeholder="Fibra, cable…" />
        </label>
        <label className="field">
          <span>Ancho de bajada</span>
          <input value={f.ancho_bajada ?? ''} onChange={(e) => set('ancho_bajada', e.target.value)} />
        </label>
        <label className="field">
          <span>Ancho de subida</span>
          <input value={f.ancho_subida ?? ''} onChange={(e) => set('ancho_subida', e.target.value)} />
        </label>
        <label className="field">
          <span>IP pública</span>
          <input value={f.ip_publica ?? ''} onChange={(e) => set('ip_publica', e.target.value)} />
        </label>
        <label className="field">
          <span>Contacto / soporte</span>
          <input value={f.contacto ?? ''} onChange={(e) => set('contacto', e.target.value)} />
        </label>
        <label className="field">
          <span>Teléfono</span>
          <input value={f.telefono ?? ''} onChange={(e) => set('telefono', e.target.value)} />
        </label>
        <label className="field">
          <span>Costo</span>
          <input value={f.costo ?? ''} onChange={(e) => set('costo', e.target.value)} />
        </label>
        <label className="field">
          <span>Estado</span>
          <select value={f.estado} onChange={(e) => set('estado', e.target.value)}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>Observaciones</span>
        <textarea value={f.observaciones ?? ''} onChange={(e) => set('observaciones', e.target.value)} rows={2} />
      </label>
      <div className="modal-actions" style={{ marginTop: 8 }}>
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
