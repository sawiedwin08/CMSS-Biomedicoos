import type { MouseEvent } from 'react'

/**
 * Handler para el fondo (overlay) de un modal.
 * Cierra SOLO cuando la pulsación del mouse empieza directamente sobre el fondo,
 * no cuando termina ahí tras seleccionar texto dentro del modal (arrastrar y soltar).
 * Usar como: onMouseDown={cerrarAlClicFuera(onClose)}
 */
export function cerrarAlClicFuera(onClose: () => void) {
  return (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }
}
