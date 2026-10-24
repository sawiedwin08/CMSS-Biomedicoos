/**
 * Tabla reutilizable de documentos (igual a la de "Documentos del Equipo").
 * Columnas: Tipo de archivo · Nombre · Año · Usuario · Acciones.
 */
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Cog,
  Download,
  Eye,
  FileText,
  HelpCircle,
  MoreHorizontal,
  Receipt,
  Ruler,
  Shield,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react'

import { type DocumentoEquipo, TIPOS_DOCUMENTOS } from './documentosApi'

function IconoTipo({ tipo }: { tipo: string }) {
  switch (tipo) {
    case 'manual':
      return <BookOpen size={18} />
    case 'plano':
      return <Ruler size={18} />
    case 'calibracion':
      return <Cog size={18} />
    case 'hoja_de_vida':
      return <FileText size={18} />
    case 'mantenimientos_preventivos':
      return <Wrench size={18} />
    case 'correctivo':
      return <AlertCircle size={18} />
    case 'reportes':
      return <BarChart3 size={18} />
    case 'invima':
      return <Shield size={18} />
    case 'factura':
      return <Receipt size={18} />
    case 'importacion':
      return <Download size={18} />
    case 'ficha_tecnica':
      return <Zap size={18} />
    case 'guia_rapida':
      return <HelpCircle size={18} />
    default:
      return <MoreHorizontal size={18} />
  }
}

interface Props {
  documentos: DocumentoEquipo[]
  puedeEditar: boolean
  onVisualizar?: (doc: DocumentoEquipo) => void
  onDescargar?: (doc: DocumentoEquipo) => void
  onEliminar?: (doc: DocumentoEquipo) => void
  vacio?: string
}

export function TablaDocumentos({
  documentos,
  puedeEditar,
  onVisualizar,
  onDescargar,
  onEliminar,
  vacio = 'No hay documentos.',
}: Props) {
  if (documentos.length === 0) {
    return (
      <div className="muted small" style={{ textAlign: 'center', padding: '20px' }}>
        {vacio}
      </div>
    )
  }

  return (
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
                <IconoTipo tipo={doc.tipo} />
                <span className="docs-tipo-label">
                  {TIPOS_DOCUMENTOS.find((t) => t.value === doc.tipo)?.label ?? doc.tipo}
                </span>
              </td>
              <td className="docs-nombre-col">{doc.nombre_archivo}</td>
              <td className="docs-anio-col">
                {doc.año_documento || new Date(doc.created_at).getFullYear()}
              </td>
              <td className="docs-usuario-col">{doc.usuario?.nombre || '—'}</td>
              <td className="docs-acciones-col">
                {onVisualizar && (
                  <button className="icon-btn" title="Visualizar" onClick={() => onVisualizar(doc)}>
                    <Eye size={16} />
                  </button>
                )}
                {onDescargar && (
                  <button className="icon-btn" title="Descargar" onClick={() => onDescargar(doc)}>
                    <Download size={16} />
                  </button>
                )}
                {puedeEditar && onEliminar && (
                  <button className="icon-btn" title="Eliminar" onClick={() => onEliminar(doc)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
