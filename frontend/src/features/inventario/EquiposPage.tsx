import { Eye, FileText, Folder, X, FolderOpen, MapPin, Wrench } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import {
  type Equipo,
  ESTADOS,
  etiquetaEstado,
  etiquetaPropiedad,
} from '../../entities/equipo'
import type { Sede } from '../../entities/sede'
import { useAuth } from '../../shared/auth/AuthContext'
import { type Columna, DataTable } from '../../shared/ui/DataTable'
import { type FiltroEquipos, listarEquipos, obtenerFotoUrl } from './equiposApi'
import { DocumentosEquipo } from './DocumentosEquipo'
import { HistorialMovimientos } from './HistorialMovimientos'
import { HojaVida } from './HojaVida'
import { OrdenesTrabajo } from '../mantenimiento/OrdenesTrabajo'
import { listarSedes } from './sedesApi'
import { listarDocumentos, type DocumentoEquipo } from './documentosApi'

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
    {
      header: 'Estado',
      celda: (e) => {
        const colores: Record<string, { bg: string; text: string }> = {
          operativo: { bg: '#d4edda', text: '#155724' },
          en_mantenimiento: { bg: '#FFD700', text: '#000' },
          fuera_de_servicio: { bg: '#f8d7da', text: '#721c24' },
          dado_de_baja: { bg: '#e2e3e5', text: '#383d41' },
        }
        const color = colores[e.estado] || { bg: '#f0f0f0', text: '#333' }
        return (
          <span
            style={{
              display: 'inline-block',
              padding: '6px 10px',
              borderRadius: '4px',
              backgroundColor: color.bg,
              color: color.text,
              fontWeight: '700',
              fontSize: '0.9rem',
              border: `2px solid ${color.text}`,
            }}
          >
            {etiquetaEstado(e.estado)}
          </span>
        )
      },
    },
    {
      header: '',
      ancho: 50,
      celda: (e) => (
        <button className="icon-btn" title="Ver resumen" onClick={() => abrirResumen(e)}>
          <Eye size={16} />
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
  const { puede } = useAuth()
  const puedeEditar = puede('inventario:editar')
  const [verDocs, setVerDocs] = useState(false)
  const [verMovimientos, setVerMovimientos] = useState(false)
  const [verMantenimiento, setVerMantenimiento] = useState(false)
  const [documentos, setDocumentos] = useState<DocumentoEquipo[]>([])
  const [cargandoDocs, setCargandoDocs] = useState(false)
  const [años, setAños] = useState<number[]>([])
  const [añoSeleccionado, setAñoSeleccionado] = useState<number | null>(null)
  const [verDocumentacion, setVerDocumentacion] = useState(false)

  useEffect(() => {
    listarDocumentos(e.id)
      .then((docs) => {
        setDocumentos(docs)
        // Extraer años solo de documentos de mantenimiento (que tienen año_documento)
        const añosUnicos = Array.from(
          new Set(docs.filter(d => d.año_documento).map((d) => d.año_documento!))
        )
          .sort((a, b) => b - a)
          .slice(0, 3)
        setAños(añosUnicos)
      })
      .catch(() => setDocumentos([]))
  }, [e.id])

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal card modal-ancho" onClick={(e) => e.stopPropagation()}>
        <div className="detail-head">
          <h3>
            {e.nombre} <span className="muted">· {e.codigo_interno}</span>
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary btn-ico" onClick={() => setVerDocs(true)}>
              <Folder size={16} /> Documentos
            </button>
            <button className="btn-primary btn-ico" onClick={onGenerarHoja}>
              <FileText size={16} /> Generar hoja de vida
            </button>
            <button className="btn-ghost" onClick={onCerrar} style={{ marginLeft: 'auto' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="rz-cuerpo">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="rz-foto">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Foto del equipo" />
              ) : (
                <span className="muted small">Sin foto</span>
              )}
            </div>
            <div>
              <h5 style={{ margin: '12px 0 8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Documentos
              </h5>
              <div className="rz-años">
                <button
                  className="año-folder"
                  onClick={() => setVerDocumentacion(true)}
                  title="Documentación del equipo"
                >
                  <FolderOpen size={16} />
                  <span>Documentación</span>
                </button>
                {años.map((año) => (
                  <button
                    key={año}
                    className="año-folder"
                    onClick={() => setAñoSeleccionado(año)}
                    title={`Documentos del año ${año}`}
                  >
                    <FolderOpen size={16} />
                    <span>{año}</span>
                  </button>
                ))}
              </div>

              <h5 style={{ margin: '20px 0 8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Movimientos
              </h5>
              <div className="rz-años">
                <button
                  className="año-folder"
                  onClick={() => setVerMovimientos(true)}
                  title="Historial de ubicaciones"
                >
                  <MapPin size={16} />
                  <span>Historial de Ubicaciones</span>
                </button>
              </div>

              <h5 style={{ margin: '20px 0 8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Mantenimiento
              </h5>
              <div className="rz-años">
                <button
                  className="año-folder"
                  onClick={() => setVerMantenimiento(true)}
                  title="Órdenes de trabajo"
                >
                  <Wrench size={16} />
                  <span>Órdenes de Trabajo</span>
                </button>
              </div>
            </div>
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

      {verDocs && (
        <div className="modal-overlay" onClick={() => setVerDocs(false)}>
          <div className="modal card modal-ancho" onClick={(e) => e.stopPropagation()}>
            <div className="detail-head">
              <h3>
                <Folder size={20} /> Documentos del equipo
              </h3>
              <button
                className="btn-ghost"
                onClick={() => setVerDocs(false)}
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
            <DocumentosEquipo
              equipoId={e.id}
              puedeEditar={puedeEditar}
              onDocumentosChanged={async () => {
                const docs = await listarDocumentos(e.id)
                setDocumentos(docs)
                const añosUnicos = Array.from(
                  new Set(docs.filter(d => d.año_documento).map((d) => d.año_documento!))
                )
                  .sort((a, b) => b - a)
                  .slice(0, 3)
                setAños(añosUnicos)
              }}
            />
          </div>
        </div>
      )}

      {verMovimientos && (
        <div className="modal-overlay" onClick={() => setVerMovimientos(false)}>
          <div className="modal card modal-ancho" onClick={(e) => e.stopPropagation()}>
            <div className="detail-head">
              <h3>
                <MapPin size={20} /> Historial de Ubicaciones
              </h3>
              <button
                className="btn-ghost"
                onClick={() => setVerMovimientos(false)}
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
            <HistorialMovimientos
              equipoId={e.id}
              puedeEditar={puedeEditar}
            />
          </div>
        </div>
      )}

      {verMantenimiento && (
        <div className="modal-overlay" onClick={() => setVerMantenimiento(false)}>
          <div className="modal card modal-ancho" onClick={(e) => e.stopPropagation()}>
            <div className="detail-head">
              <h3>
                <FileText size={20} /> Mantenimiento
              </h3>
              <button
                className="btn-ghost"
                onClick={() => setVerMantenimiento(false)}
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
            <OrdenesTrabajo
              equipoId={e.id}
              equipoNombre={e.nombre}
              puedeEditar={puedeEditar}
            />
          </div>
        </div>
      )}

      {añoSeleccionado && (
        <DocumentosAñoModal
          equipoId={e.id}
          año={añoSeleccionado}
          documentos={documentos}
          puedeEditar={puedeEditar}
          onCerrar={() => setAñoSeleccionado(null)}
        />
      )}

      {verDocumentacion && (
        <DocumentosDocumentacionModal
          equipoId={e.id}
          documentos={documentos}
          puedeEditar={puedeEditar}
          onCerrar={() => setVerDocumentacion(false)}
        />
      )}
    </div>
  )
}

function DocumentosAñoModal({
  equipoId,
  año,
  documentos,
  puedeEditar,
  onCerrar,
}: {
  equipoId: number
  año: number
  documentos: DocumentoEquipo[]
  puedeEditar: boolean
  onCerrar: () => void
}) {
  const [localDocs, setLocalDocs] = useState(documentos)
  const [docSeleccionado, setDocSeleccionado] = useState<DocumentoEquipo | null>(null)
  const [urlBlobDoc, setUrlBlobDoc] = useState<string | null>(null)

  const docsDelAño = localDocs.filter(
    (d) => d.año_documento === año
  )

  async function visualizar(doc: DocumentoEquipo) {
    try {
      const { descargarDocumento } = await import('./documentosApi')
      const blob = await descargarDocumento(equipoId, doc.id)
      const url = URL.createObjectURL(blob)
      setUrlBlobDoc(url)
      setDocSeleccionado(doc)
    } catch {
      alert('Error al cargar el documento')
    }
  }

  function cerrarVisualizacion() {
    if (urlBlobDoc) URL.revokeObjectURL(urlBlobDoc)
    setDocSeleccionado(null)
    setUrlBlobDoc(null)
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal card modal-ancho" onClick={(e) => e.stopPropagation()}>
        <div className="detail-head">
          <h3>Documentos - Año {año}</h3>
          <button
            className="btn-ghost"
            onClick={onCerrar}
            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '16px' }}>
          {docsDelAño.length === 0 ? (
            <p className="muted">No hay documentos para este año</p>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {docsDelAño.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                      {doc.nombre_archivo}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {doc.usuario?.nombre} • {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="icon-btn"
                      title="Visualizar"
                      onClick={() => visualizar(doc)}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {docSeleccionado && urlBlobDoc && (
        <div className="modal-overlay" onClick={cerrarVisualizacion}>
          <div className="modal card" style={{ maxWidth: '90%', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="detail-head">
              <h3>{docSeleccionado.nombre_archivo}</h3>
              <button
                className="btn-ghost"
                onClick={cerrarVisualizacion}
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', minHeight: '400px' }}>
              {docSeleccionado.mime_type.includes('pdf') ? (
                <iframe
                  src={urlBlobDoc}
                  style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none' }}
                  title={docSeleccionado.nombre_archivo}
                />
              ) : docSeleccionado.mime_type.startsWith('image/') ? (
                <img
                  src={urlBlobDoc}
                  alt={docSeleccionado.nombre_archivo}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <p>No se puede visualizar este tipo de archivo.</p>
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      const { descargarDocumentoNombre } = await import('./documentosApi')
                      await descargarDocumentoNombre(equipoId, docSeleccionado.id, docSeleccionado.nombre_archivo)
                    }}
                  >
                    Descargar archivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentosDocumentacionModal({
  equipoId,
  documentos,
  puedeEditar,
  onCerrar,
}: {
  equipoId: number
  documentos: DocumentoEquipo[]
  puedeEditar: boolean
  onCerrar: () => void
}) {
  const [localDocs, setLocalDocs] = useState(documentos)
  const [docSeleccionado, setDocSeleccionado] = useState<DocumentoEquipo | null>(null)
  const [urlBlobDoc, setUrlBlobDoc] = useState<string | null>(null)

  // Documentos sin año (documentación)
  const docsDocumentacion = localDocs.filter((d) => !d.año_documento)

  async function visualizar(doc: DocumentoEquipo) {
    try {
      const { descargarDocumento } = await import('./documentosApi')
      const blob = await descargarDocumento(equipoId, doc.id)
      const url = URL.createObjectURL(blob)
      setUrlBlobDoc(url)
      setDocSeleccionado(doc)
    } catch {
      alert('Error al cargar el documento')
    }
  }

  function cerrarVisualizacion() {
    if (urlBlobDoc) URL.revokeObjectURL(urlBlobDoc)
    setDocSeleccionado(null)
    setUrlBlobDoc(null)
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal card modal-ancho" onClick={(e) => e.stopPropagation()}>
        <div className="detail-head">
          <h3>Documentación del Equipo</h3>
          <button
            className="btn-ghost"
            onClick={onCerrar}
            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '16px' }}>
          {docsDocumentacion.length === 0 ? (
            <p className="muted">No hay documentos en documentación</p>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {docsDocumentacion.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                      {doc.nombre_archivo}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {doc.usuario?.nombre} • {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="icon-btn"
                      title="Visualizar"
                      onClick={() => visualizar(doc)}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {docSeleccionado && urlBlobDoc && (
        <div className="modal-overlay" onClick={cerrarVisualizacion}>
          <div className="modal card" style={{ maxWidth: '90%', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="detail-head">
              <h3>{docSeleccionado.nombre_archivo}</h3>
              <button
                className="btn-ghost"
                onClick={cerrarVisualizacion}
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {docSeleccionado.mime_type.includes('pdf') ? (
                <iframe
                  src={urlBlobDoc}
                  style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none' }}
                  title={docSeleccionado.nombre_archivo}
                />
              ) : docSeleccionado.mime_type.startsWith('image/') ? (
                <img
                  src={urlBlobDoc}
                  alt={docSeleccionado.nombre_archivo}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <p>No se puede visualizar este tipo de archivo.</p>
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      const { descargarDocumentoNombre } = await import('./documentosApi')
                      await descargarDocumentoNombre(equipoId, docSeleccionado.id, docSeleccionado.nombre_archivo)
                    }}
                  >
                    Descargar archivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
