/**
 * Componente para gestionar documentos de un equipo.
 * Permite subir, descargar y eliminar documentos.
 */
import { Download, Trash2, Upload, Folder, BookOpen, Ruler, Cog, FileText, Wrench, AlertCircle, BarChart3, Shield, Receipt, Zap, HelpCircle, MoreHorizontal } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import {
  type DocumentoEquipo,
  type TipoDocumento,
  TIPOS_MANTENIMIENTO,
  TIPOS_DOCUMENTACION,
  TIPOS_DOCUMENTOS,
  descargarDocumentoNombre,
  descargarTodosDocumentos,
  eliminarDocumento,
  listarDocumentos,
  obtenerIconoTipo,
  subirDocumento,
} from './documentosApi'

interface DocumentosEquipoProps {
  equipoId: number
  puedeEditar: boolean
  onDocumentosChanged?: () => Promise<void>
}

export function DocumentosEquipo({
  equipoId,
  puedeEditar,
  onDocumentosChanged,
}: DocumentosEquipoProps) {
  const [documentos, setDocumentos] = useState<DocumentoEquipo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [dondeVa, setDondeVa] = useState<'mantenimiento' | 'documentacion'>('mantenimiento')
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoDocumento>(
    'mantenimientos_preventivos'
  )
  const [archivoSeleccionado, setArchivoSeleccionado] =
    useState<File | null>(null)
  const [descripcion, setDescripcion] = useState('')
  const [año, setAño] = useState<number | ''>(new Date().getFullYear())

  // Cambiar tipo disponible cuando cambia dónde va
  const tiposDisponibles = dondeVa === 'mantenimiento' ? TIPOS_MANTENIMIENTO : TIPOS_DOCUMENTACION

  // Cargar documentos al montar
  useEffect(() => {
    cargarDocumentos()
  }, [equipoId])

  // Cambiar tipo si no está disponible en la categoría actual
  useEffect(() => {
    const tiposActuales = dondeVa === 'mantenimiento' ? TIPOS_MANTENIMIENTO : TIPOS_DOCUMENTACION
    if (!tiposActuales.find(t => t.value === tipoSeleccionado)) {
      setTipoSeleccionado(tiposActuales[0].value)
    }
  }, [dondeVa])

  async function cargarDocumentos() {
    setCargando(true)
    setError(null)
    try {
      const docs = await listarDocumentos(equipoId)
      setDocumentos(docs)
    } catch {
      setError('No se pudieron cargar los documentos.')
    } finally {
      setCargando(false)
    }
  }

  async function subirDoc(e: FormEvent) {
    e.preventDefault()
    if (!archivoSeleccionado) return

    setSubiendo(true)
    setError(null)
    try {
      const nuevoDoc = await subirDocumento(
        equipoId,
        archivoSeleccionado,
        tipoSeleccionado,
        descripcion || undefined,
        dondeVa === 'mantenimiento' ? (año ? Number(año) : undefined) : undefined
      )
      setDocumentos([...documentos, nuevoDoc])
      setArchivoSeleccionado(null)
      setDescripcion('')
      setAño(new Date().getFullYear())
      if (onDocumentosChanged) await onDocumentosChanged()
    } catch {
      setError('Error al subir el documento.')
    } finally {
      setSubiendo(false)
    }
  }

  async function borrar(docId: number) {
    if (!window.confirm('¿Eliminar este documento?')) return

    setError(null)
    try {
      await eliminarDocumento(equipoId, docId)
      setDocumentos(documentos.filter((d) => d.id !== docId))
      if (onDocumentosChanged) await onDocumentosChanged()
    } catch {
      setError('Error al eliminar el documento.')
    }
  }

  async function descargar(doc: DocumentoEquipo) {
    try {
      await descargarDocumentoNombre(equipoId, doc.id, doc.nombre_archivo)
    } catch {
      setError('Error al descargar el documento.')
    }
  }

  if (cargando) return <div className="muted small">Cargando documentos…</div>

  async function descargarTodos() {
    setError(null)
    try {
      await descargarTodosDocumentos(equipoId, `equipo_${equipoId}`)
    } catch {
      setError('Error al descargar los documentos.')
    }
  }

  return (
    <div className="documentos-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 className="docs-titulo">
          <Folder size={20} /> Documentos del Equipo
        </h4>
        {documentos.length > 0 && (
          <button
            className="btn-primary btn-ico"
            title="Descargar todos en ZIP"
            onClick={descargarTodos}
          >
            <Download size={16} /> Descargar todos
          </button>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Formulario de carga */}
      {puedeEditar && (
        <form className="docs-form" onSubmit={subirDoc}>
          <div className="docs-form-row">
            <label className="field">
              <span>¿Dónde va?</span>
              <select
                value={dondeVa}
                onChange={(e) => setDondeVa(e.target.value as 'mantenimiento' | 'documentacion')}
              >
                <option value="mantenimiento">Mantenimiento (con año)</option>
                <option value="documentacion">Documentación Equipos</option>
              </select>
            </label>

            <label className="field">
              <span>Tipo de documento</span>
              <select
                value={tipoSeleccionado}
                onChange={(e) =>
                  setTipoSeleccionado(e.target.value as TipoDocumento)
                }
              >
                {tiposDisponibles.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Archivo</span>
              <input
                type="file"
                onChange={(e) => setArchivoSeleccionado(e.target.files?.[0] ?? null)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.pptx"
              />
            </label>

            {dondeVa === 'mantenimiento' && (
              <label className="field">
                <span>Año del documento</span>
                <select
                  value={año}
                  onChange={(e) => setAño(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">-- Seleccionar año --</option>
                  {Array.from({ length: 20 }, (_, i) => {
                    const y = new Date().getFullYear() - i
                    return (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    )
                  })}
                </select>
              </label>
            )}

            <label className="field">
              <span>Descripción (opcional)</span>
              <input
                type="text"
                placeholder="Ej: Versión 2.1, actualizado, etc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={500}
              />
            </label>

            <button
              type="submit"
              className="btn-primary btn-ico"
              disabled={!archivoSeleccionado || subiendo || (dondeVa === 'mantenimiento' && !año)}
              title={dondeVa === 'mantenimiento' && !año ? 'Selecciona un año' : ''}
            >
              <Upload size={16} />{' '}
              {subiendo ? 'Subiendo…' : 'Subir documento'}
            </button>
          </div>
        </form>
      )}

      {/* Tabla de documentos */}
      {documentos.length === 0 ? (
        <div className="muted small" style={{ textAlign: 'center', padding: '20px' }}>
          No hay documentos. {puedeEditar && 'Sube uno arriba.'}
        </div>
      ) : (
        <div className="docs-tabla-container">
          <table className="docs-tabla">
            <thead>
              <tr>
                <th>Tipo de archivo</th>
                <th>Nombre de archivo</th>
                <th>Año</th>
                <th>Usuario</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((doc) => (
                <tr key={doc.id}>
                  <td className="docs-tipo-col">
                    {doc.tipo === 'manual' && <BookOpen size={18} />}
                    {doc.tipo === 'plano' && <Ruler size={18} />}
                    {doc.tipo === 'calibracion' && <Cog size={18} />}
                    {doc.tipo === 'hoja_de_vida' && <FileText size={18} />}
                    {doc.tipo === 'mantenimientos_preventivos' && <Wrench size={18} />}
                    {doc.tipo === 'correctivo' && <AlertCircle size={18} />}
                    {doc.tipo === 'reportes' && <BarChart3 size={18} />}
                    {doc.tipo === 'invima' && <Shield size={18} />}
                    {doc.tipo === 'factura' && <Receipt size={18} />}
                    {doc.tipo === 'importacion' && <Download size={18} />}
                    {doc.tipo === 'ficha_tecnica' && <Zap size={18} />}
                    {doc.tipo === 'guia_rapida' && <HelpCircle size={18} />}
                    {doc.tipo === 'otros' && <MoreHorizontal size={18} />}
                    <span className="docs-tipo-label">
                      {TIPOS_DOCUMENTOS.find((t) => t.value === doc.tipo)?.label}
                    </span>
                  </td>
                  <td className="docs-nombre-col">{doc.nombre_archivo}</td>
                  <td className="docs-año-col">
                    {doc.año_documento || new Date(doc.created_at).getFullYear()}
                  </td>
                  <td className="docs-usuario-col">
                    {doc.usuario?.nombre || '—'}
                  </td>
                  <td className="docs-acciones-col">
                    <button
                      className="icon-btn"
                      title="Descargar"
                      onClick={() => descargar(doc)}
                    >
                      <Download size={16} />
                    </button>
                    {puedeEditar && (
                      <button
                        className="icon-btn"
                        title="Eliminar"
                        onClick={() => borrar(doc.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .documentos-section {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }

        .docs-titulo {
          margin: 0 0 12px;
          color: var(--color-text);
          font-size: 0.95rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .docs-form {
          background: var(--color-bg-secondary);
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .docs-form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
          align-items: flex-end;
        }

        @media (max-width: 600px) {
          .docs-form-row {
            grid-template-columns: 1fr;
          }
        }

        .docs-form label {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .docs-form span {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .docs-form input,
        .docs-form select {
          padding: 5px 6px;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .docs-tabla-container {
          border: 1px solid var(--color-border);
          border-radius: 6px;
          overflow: hidden;
          background: var(--color-bg);
        }

        .docs-tabla {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .docs-tabla thead {
          background: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border);
          font-weight: 600;
          color: var(--color-text);
        }

        .docs-tabla th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-text-secondary);
        }

        .docs-tabla tbody tr {
          border-bottom: 1px solid var(--color-border);
          transition: background 0.2s;
        }

        .docs-tabla tbody tr:last-child {
          border-bottom: none;
        }

        .docs-tabla tbody tr:hover {
          background: var(--color-bg-hover);
        }

        .docs-tabla td {
          padding: 10px 12px;
          color: var(--color-text);
        }

        .docs-tipo-col {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 1.2em;
        }

        .docs-tipo-label {
          font-size: 0.85rem;
          font-weight: 500;
        }

        .docs-nombre-col {
          font-weight: 500;
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .docs-año-col {
          text-align: center;
          font-weight: 500;
          color: var(--color-text-secondary);
        }

        .docs-usuario-col {
          color: var(--color-text-secondary);
          font-size: 0.8rem;
        }

        .docs-acciones-col {
          text-align: right;
          display: flex;
          gap: 4px;
          justify-content: flex-end;
        }

        .icon-btn {
          padding: 4px 8px;
          background: none;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text);
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: var(--color-bg-hover);
          border-color: var(--color-primary);
        }

        @media (max-width: 800px) {
          .docs-tabla {
            font-size: 0.8rem;
          }

          .docs-tabla th,
          .docs-tabla td {
            padding: 8px 10px;
          }
        }

      `}</style>
    </div>
  )
}
