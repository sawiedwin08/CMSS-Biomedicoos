import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'

import { cerrarAlClicFuera } from '../../shared/ui/overlay'
import { cambiarEstadoLote, type EstadoOT } from './mantenimientoApi'

const ETIQUETA: Record<Exclude<EstadoOT, 'pendiente'>, string> = {
  en_progreso: 'En progreso',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

/**
 * Barra de acciones para cambiar el estado de varias OT seleccionadas.
 * Pide confirmación (con advertencia para "Completada"). Las OT ya "completada"
 * quedan bloqueadas en el backend (se omiten).
 */
export function AccionesEstadoLote({
  ids,
  onLimpiar,
  onHecho,
}: {
  ids: number[]
  onLimpiar: () => void
  onHecho: (mensaje: string) => void
}) {
  const [cargando, setCargando] = useState<EstadoOT | null>(null)
  const [confirmar, setConfirmar] = useState<EstadoOT | null>(null)

  async function aplicar(estado: EstadoOT) {
    setConfirmar(null)
    setCargando(estado)
    try {
      const r = await cambiarEstadoLote(ids, estado)
      onHecho(
        `${r.actualizadas} OT actualizada(s)` +
          (r.omitidas ? `. ${r.omitidas} omitida(s) (ya completadas o inexistentes).` : '.'),
      )
    } catch {
      onHecho('No se pudo cambiar el estado de las órdenes seleccionadas.')
    } finally {
      setCargando(null)
    }
  }

  return (
    <>
      <div className="em-bulk">
        <span>
          {ids.length} OT seleccionada(s)
          <span style={{ display: 'block', fontSize: 12, opacity: 0.7, fontWeight: 400 }}>
            Para completar una OT, firma y guarda su hoja de rutina.
          </span>
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn-ghost" onClick={onLimpiar} disabled={!!cargando}>
            Limpiar
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setConfirmar('en_progreso')}
            disabled={!!cargando}
          >
            En progreso
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setConfirmar('completada')}
            disabled={!!cargando}
          >
            Completar
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setConfirmar('cancelada')}
            disabled={!!cargando}
          >
            Cancelar
          </button>
        </div>
      </div>

      {confirmar && (
        <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(() => setConfirmar(null))}>
          <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="detail-head">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} style={{ color: '#e08600' }} />
                Confirmar cambio por lote
              </h3>
            </div>

            <p style={{ marginTop: 8 }}>
              Vas a cambiar <strong>{ids.length}</strong> orden(es) de trabajo a{' '}
              <strong>{ETIQUETA[confirmar as Exclude<EstadoOT, 'pendiente'>]}</strong>.
            </p>

            {confirmar === 'completada' && (
              <div className="alert-error" style={{ marginTop: 4 }}>
                ⚠️ <strong>Importante:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  <li>Ninguna acta (hoja de rutina) quedará <strong>firmada</strong>.</li>
                  <li>
                    Una vez <strong>completada</strong>, ya <strong>no podrás gestionar</strong> el
                    checklist de la rutina.
                  </li>
                </ul>
                <div style={{ marginTop: 6 }}>
                  Para dejar el acta firmada, usa <strong>"Ver hoja de rutina → Firmar y
                  guardar"</strong> en cada OT.
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button type="button" className="btn-ghost" onClick={() => setConfirmar(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={() => aplicar(confirmar)}>
                Sí, continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
