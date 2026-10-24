import { cerrarAlClicFuera } from '../../shared/ui/overlay'

/** Modal de visualización de un PDF (o archivo) en un iframe. */
export function VisorPdfModal({
  url,
  titulo,
  onCerrar,
}: {
  url: string
  titulo: string
  onCerrar: () => void
}) {
  return (
    <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(onCerrar)}>
      <div
        className="modal card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 920, width: '92%' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <h3 style={{ margin: 0 }}>{titulo}</h3>
          <button className="btn-ghost" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
        <iframe
          src={url}
          title={titulo}
          style={{ width: '100%', height: '78vh', border: '1px solid var(--borde)' }}
        />
      </div>
    </div>
  )
}
