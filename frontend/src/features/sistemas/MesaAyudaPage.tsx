import { type ChangeEvent, useEffect, useRef, useState } from 'react'

import {
  CATEGORIAS_T,
  type CategoriaTicket,
  ESTADOS_T,
  ETIQUETA_CATEGORIA_T,
  ETIQUETA_ESTADO_T,
  ETIQUETA_PRIORIDAD,
  type EstadoTicket,
  PRIORIDADES_T,
  type PrioridadTicket,
} from '../../entities/ticket'
import { useAuth } from '../../shared/auth/AuthContext'
import DataTable, { type Columna } from '../../shared/ui/DataTable'
import { cerrarAlClicFuera } from '../../shared/ui/overlay'
import { listarUsuariosOpc, type Opcion } from './activosApi'
import {
  actualizarTicket,
  type Adjunto,
  agregarComentario,
  type Comentario,
  contarNuevos,
  listarAdjuntos,
  listarComentarios,
  listarTickets,
  obtenerTicket,
  subirAdjunto,
  type Ticket,
  type TicketListItem,
  urlAdjunto,
} from './mesaAyudaApi'
import { VisorPdfModal } from './VisorPdfModal'

const RESPUESTAS_RAPIDAS = [
  'Hemos recibido tu caso y ya lo estamos revisando.',
  'Estamos trabajando en tu caso, te mantendremos informado.',
  'Necesitamos más información para continuar. Por favor detállanos: ',
  'Tu caso quedó resuelto. Si el problema persiste, repórtalo nuevamente.',
  'Escalamos tu caso a un técnico con más experiencia; en breve te contactarán.',
]

function detalleError(err: unknown, p: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? p
}

export function MesaAyudaPage() {
  const { puede } = useAuth()
  const puedeVer = puede('mesa_ayuda:ver')
  const puedeEditar = puede('mesa_ayuda:editar')

  const [items, setItems] = useState<TicketListItem[]>([])
  const [nuevos, setNuevos] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fEstado, setFEstado] = useState<EstadoTicket | ''>('')
  const [fCategoria, setFCategoria] = useState<CategoriaTicket | ''>('')
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState<number | null>(null)
  const [usuarios, setUsuarios] = useState<Opcion[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const prevNuevosRef = useRef<number | null>(null)

  function beep() {
    try {
      const ctx = new AudioContext()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.value = 880
      g.gain.setValueAtTime(0.12, ctx.currentTime)
      o.start()
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3)
      o.stop(ctx.currentTime + 0.35)
    } catch {
      /* sin audio */
    }
  }

  function notificar(cuantos: number) {
    const txt =
      cuantos === 1 ? 'Llegó 1 ticket nuevo' : `Llegaron ${cuantos} tickets nuevos`
    setToast('🔔 ' + txt)
    window.setTimeout(() => setToast(null), 6000)
    beep()
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Mesa de ayuda', { body: txt })
      }
    } catch {
      /* sin notificación de escritorio */
    }
  }

  async function cargar() {
    setItems(
      await listarTickets({
        estado: fEstado || undefined,
        categoria: fCategoria || undefined,
        texto: texto || undefined,
      }),
    )
    const n = await contarNuevos()
    if (prevNuevosRef.current !== null && n > prevNuevosRef.current) {
      notificar(n - prevNuevosRef.current)
    }
    prevNuevosRef.current = n
    setNuevos(n)
  }

  useEffect(() => {
    if (puedeVer) listarUsuariosOpc().then(setUsuarios)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!puedeVer) {
      setCargando(false)
      return
    }
    setCargando(true)
    cargar()
      .catch((err) => setError(detalleError(err, 'No se pudieron cargar los tickets.')))
      .finally(() => setCargando(false))
    // Se actualiza sola cada 15s para que los tickets nuevos aparezcan sin refrescar.
    const id = setInterval(() => {
      cargar().catch(() => {})
    }, 15000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fEstado, fCategoria, texto])

  if (!puedeVer) {
    return <div className="card muted">No tienes permiso para ver la mesa de ayuda.</div>
  }

  const columnas: Columna<TicketListItem>[] = [
    { id: 'numero', header: 'Ticket', accessorFn: (t) => t.numero },
    { id: 'asunto', header: 'Asunto', accessorFn: (t) => t.asunto },
    { id: 'solic', header: 'Solicitante', accessorFn: (t) => t.solicitante_nombre },
    { id: 'cat', header: 'Categoría', accessorFn: (t) => ETIQUETA_CATEGORIA_T[t.categoria] },
    { id: 'prio', header: 'Prioridad', accessorFn: (t) => ETIQUETA_PRIORIDAD[t.prioridad] },
    {
      id: 'estado',
      header: 'Estado',
      accessorFn: (t) => t.estado,
      cell: ({ row }) => {
        const t = row.original
        return (
          <span className={t.estado === 'nuevo' ? 'estado-off' : 'estado-ok'}>
            {ETIQUETA_ESTADO_T[t.estado]}
          </span>
        )
      },
    },
    { id: 'tec', header: 'Técnico', accessorFn: (t) => t.tecnico_nombre || '—' },
    { id: 'fecha', header: 'Creado', accessorFn: (t) => new Date(t.created_at).toLocaleDateString() },
    {
      id: 'acc',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <button className="btn-ghost" onClick={() => setAbierto(row.original.id)}>
          Abrir
        </button>
      ),
    },
  ]

  return (
    <div className="stack">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Bandeja de tickets</strong>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge">{nuevos} nuevo(s)</span>
            <button className="btn-ghost" onClick={() => cargar().catch(() => {})}>
              Actualizar
            </button>
          </span>
        </div>
        <div className="form-grid" style={{ marginTop: 8 }}>
          <label className="field">
            <span>Buscar</span>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Número, asunto, solicitante…" />
          </label>
          <label className="field">
            <span>Estado</span>
            <select value={fEstado} onChange={(e) => setFEstado(e.target.value as EstadoTicket | '')}>
              <option value="">Todos</option>
              {ESTADOS_T.map((s) => (
                <option key={s} value={s}>
                  {ETIQUETA_ESTADO_T[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Categoría</span>
            <select value={fCategoria} onChange={(e) => setFCategoria(e.target.value as CategoriaTicket | '')}>
              <option value="">Todas</option>
              {CATEGORIAS_T.map((c) => (
                <option key={c} value={c}>
                  {ETIQUETA_CATEGORIA_T[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="card">
        {error && <div className="alert-error">{error}</div>}
        {cargando ? (
          <div className="muted">Cargando…</div>
        ) : (
          <DataTable columns={columnas} data={items} title="Tickets" initialPageSize={15} />
        )}
      </div>

      {abierto !== null && (
        <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(() => setAbierto(null))}>
          <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <TicketDetalle
              ticketId={abierto}
              usuarios={usuarios}
              puedeEditar={puedeEditar}
              onError={setError}
              onCambio={cargar}
              onCerrar={() => setAbierto(null)}
            />
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 100,
            background: 'var(--azul)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 10,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

function TicketDetalle({
  ticketId,
  usuarios,
  puedeEditar,
  onError,
  onCambio,
  onCerrar,
}: {
  ticketId: number
  usuarios: Opcion[]
  puedeEditar: boolean
  onError: (m: string) => void
  onCambio: () => Promise<void>
  onCerrar: () => void
}) {
  const [t, setT] = useState<Ticket | null>(null)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [estado, setEstado] = useState<EstadoTicket>('nuevo')
  const [prioridad, setPrioridad] = useState<PrioridadTicket>('media')
  const [categoria, setCategoria] = useState<CategoriaTicket>('otro')
  const [tecnicoId, setTecnicoId] = useState<number | null>(null)
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [esPublico, setEsPublico] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([])
  const [verUrl, setVerUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function cargar() {
    const ticket = await obtenerTicket(ticketId)
    setT(ticket)
    setEstado(ticket.estado)
    setPrioridad(ticket.prioridad)
    setCategoria(ticket.categoria)
    setTecnicoId(ticket.tecnico_id)
    setComentarios(await listarComentarios(ticketId))
    setAdjuntos(await listarAdjuntos(ticketId))
  }

  async function onArchivo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      await subirAdjunto(ticketId, file)
      setAdjuntos(await listarAdjuntos(ticketId))
    } catch (err) {
      onError(detalleError(err, 'No se pudo subir el adjunto.'))
    }
  }

  async function ver(a: Adjunto) {
    try {
      setVerUrl(await urlAdjunto(ticketId, a.id))
    } catch (err) {
      onError(detalleError(err, 'No se pudo abrir el adjunto.'))
    }
  }

  useEffect(() => {
    cargar().catch((err) => onError(detalleError(err, 'No se pudo cargar el ticket.')))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  async function guardar() {
    setGuardando(true)
    try {
      await actualizarTicket(ticketId, { estado, prioridad, categoria, tecnico_id: tecnicoId })
      await onCambio()
    } catch (err) {
      onError(detalleError(err, 'No se pudo actualizar el ticket.'))
    } finally {
      setGuardando(false)
    }
  }

  async function comentar() {
    if (!nuevoComentario.trim()) return
    try {
      await agregarComentario(ticketId, nuevoComentario.trim(), esPublico)
      setNuevoComentario('')
      await cargar()
    } catch (err) {
      onError(detalleError(err, 'No se pudo agregar el comentario.'))
    }
  }

  if (!t) return <div className="muted">Cargando…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '82vh' }}>
      <h3 style={{ marginBottom: 4 }}>
        {t.numero} — {t.asunto}
      </h3>
      <div style={{ overflowY: 'auto', flex: 1, paddingRight: 6 }}>
        <p className="muted" style={{ marginTop: 0 }}>
          {t.solicitante_nombre} · {t.solicitante_correo}
          {t.area ? ` · ${t.area}` : ''} · {new Date(t.created_at).toLocaleString()}
        </p>
        <div className="card" style={{ background: 'var(--fondo)', boxShadow: 'none' }}>
          {t.descripcion}
        </div>

        {puedeEditar && (
          <>
            <h4>Gestión</h4>
            <div className="form-grid">
              <label className="field">
                <span>Estado</span>
                <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoTicket)}>
                  {ESTADOS_T.map((s) => (
                    <option key={s} value={s}>
                      {ETIQUETA_ESTADO_T[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Prioridad</span>
                <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as PrioridadTicket)}>
                  {PRIORIDADES_T.map((p) => (
                    <option key={p} value={p}>
                      {ETIQUETA_PRIORIDAD[p]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Categoría</span>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaTicket)}>
                  {CATEGORIAS_T.map((c) => (
                    <option key={c} value={c}>
                      {ETIQUETA_CATEGORIA_T[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Técnico asignado</span>
                <select
                  value={tecnicoId ?? ''}
                  onChange={(e) => setTecnicoId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">—</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button className="btn-primary" disabled={guardando} onClick={guardar} style={{ marginTop: 4 }}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </>
        )}

        <h4>Adjuntos</h4>
        {adjuntos.length === 0 ? (
          <p className="muted">Sin adjuntos.</p>
        ) : (
          <ul>
            {adjuntos.map((a) => (
              <li key={a.id}>
                <button className="btn-ghost" style={{ padding: '2px 6px' }} onClick={() => ver(a)}>
                  {a.nombre_archivo}
                </button>{' '}
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  ({a.origen === 'tecnico' ? 'soporte' : 'solicitante'})
                </span>
              </li>
            ))}
          </ul>
        )}
        {puedeEditar && (
          <>
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
              Adjuntar archivo
            </button>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onArchivo} />
          </>
        )}

        <h4>Seguimiento / comentarios</h4>
        {comentarios.length === 0 ? (
          <p className="muted">Sin comentarios.</p>
        ) : (
          <ul>
            {comentarios.map((c) => (
              <li key={c.id} style={{ marginBottom: 8 }}>
                <div>
                  {c.texto} {!c.es_publico && <span className="badge">interno</span>}
                </div>
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  {c.autor} · {new Date(c.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}

        {puedeEditar && (
          <div className="card" style={{ background: 'var(--fondo)', boxShadow: 'none' }}>
            <label className="field">
              <span>Respuesta rápida</span>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) setNuevoComentario(e.target.value)
                }}
              >
                <option value="">— Elegir una respuesta predefinida —</option>
                {RESPUESTAS_RAPIDAS.map((r, i) => (
                  <option key={i} value={r}>
                    {r.length > 50 ? r.slice(0, 50) + '…' : r}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Nuevo comentario</span>
              <textarea value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} rows={2} />
            </label>
            <label className="check-row">
              <input type="checkbox" checked={esPublico} onChange={(e) => setEsPublico(e.target.checked)} />
              <span>Visible para el solicitante (si no, queda como nota interna)</span>
            </label>
            <button className="btn-ghost" onClick={comentar} style={{ marginTop: 4 }}>
              Agregar comentario
            </button>
          </div>
        )}
      </div>

      <div className="modal-actions" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
      {verUrl && <VisorPdfModal url={verUrl} titulo="Adjunto" onCerrar={() => setVerUrl(null)} />}
    </div>
  )
}
