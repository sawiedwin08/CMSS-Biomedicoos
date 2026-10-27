import { useState } from 'react'

interface Opcion {
  value: string
  label: string
}

/**
 * Desplegable propio (no nativo) que muestra un máximo de `maxVisible` opciones
 * y deja el resto accesible con scroll. El <select> nativo no permite limitar
 * cuántas opciones muestra el popup, por eso se usa este componente.
 */
export function SelectScroll({
  value,
  onChange,
  options,
  placeholder = '— Selecciona —',
  maxVisible = 5,
}: {
  value: string
  onChange: (v: string) => void
  options: Opcion[]
  placeholder?: string
  maxVisible?: number
}) {
  const [open, setOpen] = useState(false)
  const seleccionada = options.find((o) => o.value === value)

  function elegir(v: string) {
    onChange(v)
    setOpen(false)
  }

  return (
    <div className="select-scroll">
      <button
        type="button"
        className="select-scroll-btn"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={seleccionada ? '' : 'muted'}>
          {seleccionada ? seleccionada.label : placeholder}
        </span>
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <>
          <div className="select-scroll-overlay" onClick={() => setOpen(false)} />
          {/* ~40px por opción: limita la altura a maxVisible opciones y el resto va con scroll */}
          <div className="select-scroll-panel" style={{ maxHeight: maxVisible * 40 }}>
            <button
              type="button"
              className={`select-scroll-opt${value === '' ? ' sel' : ''}`}
              onClick={() => elegir('')}
            >
              {placeholder}
            </button>
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`select-scroll-opt${o.value === value ? ' sel' : ''}`}
                onClick={() => elegir(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
