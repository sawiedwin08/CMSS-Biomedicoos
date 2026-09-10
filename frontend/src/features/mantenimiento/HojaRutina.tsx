import { X, Printer, Plus, Trash2, Save, Trash } from 'lucide-react'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { useState } from 'react'
import logo from '../../assets/logo-valle-atriz.png'
import type { OTRead, ChecklistEquipoRead } from './mantenimientoApi'
import { actualizarOrdenTrabajo } from './mantenimientoApi'

interface HojaRutinaProps {
  ot: OTRead
  equipo: {
    nombre: string
    marca?: string
    modelo?: string
    serial_fabricante: string
    numero_activo?: string
    sede_nombre?: string
    servicio_nombre?: string
    piso?: string
    periodicidad_mantenimiento?: string
  }
  checklist: ChecklistEquipoRead | null
  ejecucion: Record<number, string>
  onClose: () => void
}

interface Repuesto {
  id: string
  codigo: string
  descripcion: string
  cantidad: string
  causa: string
}

const v = (x: string | number | null | undefined) => (x != null && x !== '' ? String(x) : '')

export function HojaRutina({
  ot,
  equipo,
  checklist,
  ejecucion,
  onClose,
}: HojaRutinaProps) {
  const [falla, setFalla] = useState(ot.descripcion || '')
  const [diagnostico, setDiagnostico] = useState(ot.observaciones || '')
  const [tipoMant, setTipoMant] = useState({
    preventivo: ot.tipo === 'preventivo',
    correctivo: ot.tipo === 'correctivo',
    diagnostico: false,
    instalacion: false,
    capacitacion: false,
    otro: false,
  })
  const [repuestos, setRepuestos] = useState<Repuesto[]>([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null)
  const [observaciones, setObservaciones] = useState<Record<number, string>>({})
  const [pasoObsModal, setPasoObsModal] = useState<{ id: number; desc: string } | null>(null)

  // Firmas - Recibe a satisfacción
  const [firmaIzq, setFirmaIzq] = useState({ nombre: '', cargo: '', cc: '', invima: '', tarjeta: '', imagen: '' })
  // Firmas - Entrega
  const [firmaDer, setFirmaDer] = useState({ nombre: '', cargo: '', cc: '', invima: '', tarjeta: '', imagen: '' })

  const canvasIzqRef = useRef<HTMLCanvasElement>(null)
  const canvasDerRef = useRef<HTMLCanvasElement>(null)

  const formatearFecha = (fechaISO: string | null): string => {
    if (!fechaISO) return ''
    const fecha = new Date(fechaISO)
    return fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const ubicacion = [equipo.sede_nombre, equipo.servicio_nombre, equipo.piso]
    .filter(Boolean)
    .join(' / ')

  // Parsear observaciones guardadas del checklist
  const parseObservaciones = () => {
    if (ot.observaciones && checklist?.pasos) {
      const obsMap: Record<number, string> = {}
      checklist.pasos.forEach((paso) => {
        const patron = new RegExp(`${paso.descripcion}:\\s*([^\n]+)`)
        const match = ot.observaciones?.match(patron)
        if (match) {
          obsMap[paso.id] = match[1].trim()
        }
      })
      setObservaciones(obsMap)
    }
  }

  const dibujarFirma = (e: React.MouseEvent, canvas: React.RefObject<HTMLCanvasElement>, esIzq: boolean) => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx || !canvas.current) return

    const rect = canvas.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)

    const handleMouseMove = (me: MouseEvent) => {
      const mx = me.clientX - rect.left
      const my = me.clientY - rect.top
      ctx.lineTo(mx, my)
      ctx.stroke()
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      const img = canvas.current?.toDataURL()
      if (img) {
        if (esIzq) setFirmaIzq({...firmaIzq, imagen: img})
        else setFirmaDer({...firmaDer, imagen: img})
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const cargarFirma = (e: React.ChangeEvent<HTMLInputElement>, esIzq: boolean) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const img = evt.target?.result as string
      if (esIzq) setFirmaIzq({...firmaIzq, imagen: img})
      else setFirmaDer({...firmaDer, imagen: img})
    }
    reader.readAsDataURL(file)
  }

  const limpiarFirma = (esIzq: boolean) => {
    const canvas = esIzq ? canvasIzqRef : canvasDerRef
    const ctx = canvas.current?.getContext('2d')
    if (ctx && canvas.current) {
      ctx.clearRect(0, 0, canvas.current.width, canvas.current.height)
      if (esIzq) setFirmaIzq({...firmaIzq, imagen: ''})
      else setFirmaDer({...firmaDer, imagen: ''})
    }
  }


  const agregarRepuesto = () => {
    setRepuestos([...repuestos, {
      id: Date.now().toString(),
      codigo: '',
      descripcion: '',
      cantidad: '',
      causa: '',
    }])
  }

  const eliminarRepuesto = (id: string) => {
    setRepuestos(repuestos.filter(r => r.id !== id))
  }

  const actualizarRepuesto = (id: string, campo: keyof Repuesto, valor: string) => {
    setRepuestos(repuestos.map(r => r.id === id ? { ...r, [campo]: valor } : r))
  }

  const guardarDatos = async () => {
    setGuardando(true)
    setMensaje(null)
    try {
      const repuestosString = repuestos
        .map(r => {
          const partes = [r.codigo, r.descripcion, r.cantidad, r.causa]
            .filter(p => p && p.trim())
          return partes.join('|')
        })
        .filter(r => r)
        .join('; ')

      // Construir observaciones con las notas del checklist
      let obsCompletas = diagnostico || ''
      const obsChecklist = Object.entries(observaciones)
        .filter(([_, obs]) => obs && obs.trim())
        .map(([pasoId, obs]) => {
          const paso = checklist?.pasos.find(p => p.id === Number(pasoId))
          return `${paso?.descripcion}: ${obs}`
        })
        .join('\n')

      if (obsChecklist) {
        obsCompletas = obsCompletas ? `${obsCompletas}\n\n${obsChecklist}` : `${obsChecklist}`
      }

      const datosActualizar: any = {
        descripcion: falla || undefined,
        observaciones: obsCompletas || undefined,
      }

      if (repuestos.length > 0) {
        datosActualizar.repuestos = repuestosString
      }

      console.log('Datos a enviar:', datosActualizar)

      await actualizarOrdenTrabajo(ot.id, datosActualizar)

      setMensaje({ tipo: 'exito', texto: '✅ Datos guardados correctamente' })
      setTimeout(() => setMensaje(null), 3000)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: '❌ Error al guardar los datos' })
      console.error(err)
    } finally {
      setGuardando(false)
    }
  }

  return createPortal(
    <div className="hr-overlay">
      <div className="hr-barra no-print" style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
        <button className="btn-primary btn-ico" onClick={guardarDatos} disabled={guardando}>
          <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar'}
        </button>
        <button className="btn-primary btn-ico" onClick={() => window.print()}>
          <Printer size={16} /> Imprimir / Guardar como PDF
        </button>
        <button className="btn-ghost" onClick={onClose}>
          <X size={18} />
        </button>
        {mensaje && (
          <div style={{
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            backgroundColor: mensaje.tipo === 'exito' ? '#d4edda' : '#f8d7da',
            color: mensaje.tipo === 'exito' ? '#155724' : '#721c24',
            marginLeft: '12px'
          }}>
            {mensaje.texto}
          </div>
        )}
      </div>

      <div className="hr-doc" onClick={(e) => e.stopPropagation()}>
        {/* ========== PÁGINA 1: RUTINA DE MANTENIMIENTO ========== */}
        <section className="hr-pagina">
          {/* ENCABEZADO */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2px' }}>
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '50%' }} />
              <col style={{ width: '32%' }} />
            </colgroup>
            <tbody>
              <tr style={{ height: '60px' }}>
                <td style={{ border: '1px solid #666', padding: '4px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <img src={logo} alt="Logo" style={{ maxHeight: '55px', maxWidth: '95%' }} />
                </td>
                <td style={{ border: '1px solid #666', padding: '6px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px', fontWeight: 'bold' }}>
                  RUTINA DE MANTENIMIENTO<br />
                  <span style={{ fontSize: '9px', fontWeight: 'normal' }}>Protocolo de mantenimiento de equipo biomédico • Centro Médico Valle de Atriz</span>
                </td>
                <td style={{ border: '1px solid #666', padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
                  <div style={{ marginBottom: '3px' }}><strong>VERSION: 01</strong></div>
                  <div style={{ borderTop: '1px solid #666', paddingTop: '2px', marginBottom: '3px' }}><strong>Pagina: 1</strong></div>
                  <div style={{ borderTop: '1px solid #666', paddingTop: '2px', fontSize: '8px', fontWeight: 'bold', color: '#003366' }}>PROCESO: GESTION DE LA TECNOLOGIA BIOMEDICA</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* DATOS DE EQUIPO */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2px', fontSize: '9px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0', width: '18%' }}>EQUIPO</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', width: '32%' }}>{v(equipo.nombre)}</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0', width: '18%' }}>PERIORIDAD</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', width: '32%' }}>{v(equipo.periodicidad_mantenimiento)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>MARCA</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>{v(equipo.marca)}</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>VERSION</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>1.0</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>MODELO</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>{v(equipo.modelo)}</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>FECHA</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>{formatearFecha(ot.fecha_programada)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>SERIE</td>
                <td colSpan={3} style={{ border: '1px solid #666', padding: '3px 5px' }}>{v(equipo.serial_fabricante)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>INVENTARIO</td>
                <td colSpan={3} style={{ border: '1px solid #666', padding: '3px 5px' }}>{v(equipo.numero_activo)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>UBICACION</td>
                <td colSpan={3} style={{ border: '1px solid #666', padding: '3px 5px' }}>{ubicacion}</td>
              </tr>
            </tbody>
          </table>

          {/* LEYENDA */}
          <div style={{ fontSize: '8px', padding: '3px 5px', border: '1px solid #666', borderTop: 'none', backgroundColor: '#f5f5f5', marginBottom: '2px' }}>
            R: Realizado,  NR: No realizado,   PA: Presenta Anomalía
          </div>

          {/* TABLA DE ACTIVIDADES */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2px', fontSize: '11px', fontFamily: 'Arial, sans-serif' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e5a96', color: '#fff' }}>
                <th style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.5px' }}>ACTIVIDAD</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center', fontWeight: 'bold', width: '6%', fontSize: '11px' }}>R</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center', fontWeight: 'bold', width: '6%', fontSize: '11px' }}>NR</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'center', fontWeight: 'bold', width: '6%', fontSize: '11px' }}>PA</th>
                <th style={{ border: '1px solid #333', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.5px' }}>OBSERVACIONES</th>
              </tr>
            </thead>
            <tbody>
              {checklist?.pasos && checklist.pasos.length > 0 ? (
                checklist.pasos.map((paso, idx) => {
                  const estado = ejecucion[paso.id]
                  const obsText = observaciones[paso.id]
                  const bgColor = idx % 2 === 0 ? '#f9f9f9' : '#fff'
                  return (
                    <tr key={paso.id} style={{ height: '24px', backgroundColor: bgColor }}>
                      <td style={{ border: '1px solid #ddd', padding: '6px 6px', fontSize: '10px', lineHeight: '1.4', color: '#222', verticalAlign: 'middle' }}>{paso.descripcion}</td>
                      <td style={{ border: '1px solid #ddd', padding: '4px 2px', textAlign: 'center', fontSize: '13px', color: '#333', verticalAlign: 'middle' }}>{estado === 'R' ? '☑' : '☐'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '4px 2px', textAlign: 'center', fontSize: '13px', color: '#333', verticalAlign: 'middle' }}>{estado === 'NR' ? '☑' : '☐'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '4px 2px', textAlign: 'center', fontSize: '13px', color: '#333', verticalAlign: 'middle' }}>{estado === 'PA' ? '☑' : '☐'}</td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 4px', fontSize: '8px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'space-between' }}>
                        <span>{obsText || ''}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPasoObsModal({ id: paso.id, desc: paso.descripcion })
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0 4px',
                            fontSize: '14px',
                            color: obsText ? '#0066cc' : '#ccc',
                            flexShrink: 0,
                          }}
                          className="no-print"
                          title="Agregar observación"
                        >
                          📝
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : null}
            </tbody>
          </table>

          {/* FIRMAS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '2px', fontSize: '9px' }}>
            {/* FIRMA IZQUIERDA */}
            <div style={{ border: '1px solid #666', padding: '6px 5px', display: 'flex', flexDirection: 'column', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontWeight: 'bold', fontSize: '8px', backgroundColor: '#1e5a96', color: '#fff', padding: '3px 4px' }}>RECIBE A SATISFACCIÓN</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3px', fontSize: '7px' }}>
                <div>
                  <input type="text" placeholder="Nombre" value={firmaIzq.nombre} onChange={(e) => setFirmaIzq({...firmaIzq, nombre: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaIzq.nombre}</div>
                </div>
                <div>
                  <input type="text" placeholder="Cargo" value={firmaIzq.cargo} onChange={(e) => setFirmaIzq({...firmaIzq, cargo: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaIzq.cargo}</div>
                </div>
              </div>

              <div style={{ border: '1px dashed #999', padding: '8px 4px', textAlign: 'center', minHeight: '30px', backgroundColor: '#fafafa', position: 'relative' }}>
                {firmaIzq.imagen ? (
                  <img src={firmaIzq.imagen} alt="Firma" style={{ maxHeight: '28px', maxWidth: '100%' }} />
                ) : (
                  <span style={{ fontSize: '7px', color: '#999' }}>Firma</span>
                )}
              </div>

              <input type="file" accept="image/*" onChange={(e) => cargarFirma(e, true)} style={{ fontSize: '6px', display: 'none' }} className="no-print" id="file-firma-izq" />
              <div style={{ display: 'flex', gap: '2px' }} className="no-print">
                <label htmlFor="file-firma-izq" style={{ flex: 1, padding: '3px', fontSize: '7px', background: '#e8f0f7', border: '1px solid #1e5a96', color: '#1e5a96', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>📎 Cargar</label>
                {firmaIzq.imagen && <button onClick={() => limpiarFirma(true)} style={{ padding: '3px 6px', fontSize: '7px', background: '#ffebee', border: '1px solid #d32f2f', color: '#d32f2f', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', fontSize: '7px' }}>
                <div>
                  <input type="text" placeholder="C.C." value={firmaIzq.cc} onChange={(e) => setFirmaIzq({...firmaIzq, cc: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaIzq.cc}</div>
                </div>
                <div>
                  <input type="text" placeholder="INVIMA" value={firmaIzq.invima} onChange={(e) => setFirmaIzq({...firmaIzq, invima: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaIzq.invima}</div>
                </div>
              </div>

              <div style={{ fontSize: '7px' }}>
                <input type="text" placeholder="Tarjeta Prof." value={firmaIzq.tarjeta} onChange={(e) => setFirmaIzq({...firmaIzq, tarjeta: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaIzq.tarjeta}</div>
              </div>
            </div>

            {/* FIRMA DERECHA */}
            <div style={{ border: '1px solid #666', padding: '6px 5px', display: 'flex', flexDirection: 'column', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontWeight: 'bold', fontSize: '8px', backgroundColor: '#1e5a96', color: '#fff', padding: '3px 4px' }}>ENTREGA</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3px', fontSize: '7px' }}>
                <div>
                  <input type="text" placeholder="Nombre" value={firmaDer.nombre} onChange={(e) => setFirmaDer({...firmaDer, nombre: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaDer.nombre}</div>
                </div>
                <div>
                  <input type="text" placeholder="Cargo" value={firmaDer.cargo} onChange={(e) => setFirmaDer({...firmaDer, cargo: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaDer.cargo}</div>
                </div>
              </div>

              <div style={{ border: '1px dashed #999', padding: '8px 4px', textAlign: 'center', minHeight: '30px', backgroundColor: '#fafafa', position: 'relative' }}>
                {firmaDer.imagen ? (
                  <img src={firmaDer.imagen} alt="Firma" style={{ maxHeight: '28px', maxWidth: '100%' }} />
                ) : (
                  <span style={{ fontSize: '7px', color: '#999' }}>Firma</span>
                )}
              </div>

              <input type="file" accept="image/*" onChange={(e) => cargarFirma(e, false)} style={{ fontSize: '6px', display: 'none' }} className="no-print" id="file-firma-der" />
              <div style={{ display: 'flex', gap: '2px' }} className="no-print">
                <label htmlFor="file-firma-der" style={{ flex: 1, padding: '3px', fontSize: '7px', background: '#e8f0f7', border: '1px solid #1e5a96', color: '#1e5a96', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>📎 Cargar</label>
                {firmaDer.imagen && <button onClick={() => limpiarFirma(false)} style={{ padding: '3px 6px', fontSize: '7px', background: '#ffebee', border: '1px solid #d32f2f', color: '#d32f2f', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', fontSize: '7px' }}>
                <div>
                  <input type="text" placeholder="C.C." value={firmaDer.cc} onChange={(e) => setFirmaDer({...firmaDer, cc: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaDer.cc}</div>
                </div>
                <div>
                  <input type="text" placeholder="INVIMA" value={firmaDer.invima} onChange={(e) => setFirmaDer({...firmaDer, invima: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaDer.invima}</div>
                </div>
              </div>

              <div style={{ fontSize: '7px' }}>
                <input type="text" placeholder="Tarjeta Prof." value={firmaDer.tarjeta} onChange={(e) => setFirmaDer({...firmaDer, tarjeta: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaDer.tarjeta}</div>
              </div>
            </div>
          </div>

        </section>

      {/* MODAL DE OBSERVACIONES */}
      {pasoObsModal && (
        <div className="modal-overlay" onClick={() => setPasoObsModal(null)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <div className="detail-head">
              <h3>Observación: {pasoObsModal.desc}</h3>
              <button className="btn-ghost" onClick={() => setPasoObsModal(null)}>
                <X size={18} />
              </button>
            </div>
            <textarea
              value={observaciones[pasoObsModal.id] || ''}
              onChange={(e) => setObservaciones({ ...observaciones, [pasoObsModal.id]: e.target.value })}
              placeholder="Escriba la observación..."
              style={{
                width: '100%',
                height: '120px',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontFamily: 'inherit',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            <div className="modal-actions" style={{ marginTop: '12px' }}>
              <button className="btn-ghost" onClick={() => setPasoObsModal(null)}>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== PÁGINA 2: REPORTE DE MANTENIMIENTO ========== */}
        <section className="hr-pagina">
          {/* ENCABEZADO */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2px' }}>
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '50%' }} />
              <col style={{ width: '32%' }} />
            </colgroup>
            <tbody>
              <tr style={{ height: '60px' }}>
                <td style={{ border: '1px solid #666', padding: '4px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <img src={logo} alt="Logo" style={{ maxHeight: '55px', maxWidth: '95%' }} />
                </td>
                <td style={{ border: '1px solid #666', padding: '6px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px', fontWeight: 'bold' }}>
                  REPORTE DE MANTENIMIENTO DE EQUIPO BIOMEDICO<br />
                  <span style={{ fontSize: '9px', fontWeight: 'normal' }}>Formato de reporte de mantenimiento • Centro Médico Valle de Atriz</span>
                </td>
                <td style={{ border: '1px solid #666', padding: '4px', fontSize: '9px', verticalAlign: 'top' }}>
                  <div style={{ marginBottom: '3px' }}><strong>VERSION: 01</strong></div>
                  <div style={{ borderTop: '1px solid #666', paddingTop: '2px', marginBottom: '3px' }}><strong>Pagina: 2</strong></div>
                  <div style={{ borderTop: '1px solid #666', paddingTop: '2px', fontSize: '8px', fontWeight: 'bold', color: '#003366' }}>PROCESO: GESTION DE LA TECNOLOGIA BIOMEDICA</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* INFORMACIÓN GENERAL */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2px', fontSize: '9px' }}>
            <tbody>
              <tr style={{ backgroundColor: '#1e5a96', color: '#fff' }}>
                <td colSpan={4} style={{ border: '1px solid #666', padding: '4px 5px', fontWeight: 'bold' }}>Información General</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0', width: '15%' }}>Reporte No:</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', width: '20%' }}>{v(ot.id)}</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0', width: '15%' }}>Equipo:</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', width: '50%' }}>{v(equipo.nombre)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>Fecha:</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>{formatearFecha(ot.fecha_programada)}</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>Ciudad:</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>PASTO</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>Institución:</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>CENTRO MEDICO VALLE DE ATRIZ</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>Servicio:</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>{v(equipo.servicio_nombre)}</td>
              </tr>
            </tbody>
          </table>

          {/* DESCRIPCIÓN DEL EQUIPO */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2px', fontSize: '9px' }}>
            <tbody>
              <tr style={{ backgroundColor: '#1e5a96', color: '#fff' }}>
                <td colSpan={4} style={{ border: '1px solid #666', padding: '4px 5px', fontWeight: 'bold' }}>Descripción del equipo</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0', width: '15%' }}>Equipo:</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', width: '20%' }}>{v(equipo.nombre)}</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0', width: '15%' }}>Modelo:</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', width: '50%' }}>{v(equipo.modelo)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>Marca:</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>{v(equipo.marca)}</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>No inventario:</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>{v(equipo.numero_activo)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>Serie:</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>{v(equipo.serial_fabricante)}</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#c9dcf0' }}>Accesorios:</td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>{v(ot.repuestos)}</td>
              </tr>
            </tbody>
          </table>

          {/* TIPO DE MANTENIMIENTO */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2px', fontSize: '9px' }}>
            <tbody>
              <tr style={{ backgroundColor: '#1e5a96', color: '#fff' }}>
                <td colSpan={4} style={{ border: '1px solid #666', padding: '4px 5px', fontWeight: 'bold' }}>Tipo de mantenimiento</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', width: '25%' }} onClick={(e) => e.stopPropagation()}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={tipoMant.preventivo}
                      onChange={(e) => setTipoMant({ ...tipoMant, preventivo: e.target.checked })}
                      className="no-print"
                    />
                    <span className="no-print">Preventivo</span>
                  </label>
                  <span className="print-only">{tipoMant.preventivo ? '☑ Preventivo' : '☐ Preventivo'}</span>
                </td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', width: '25%' }} onClick={(e) => e.stopPropagation()}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={tipoMant.diagnostico}
                      onChange={(e) => setTipoMant({ ...tipoMant, diagnostico: e.target.checked })}
                      className="no-print"
                    />
                    <span className="no-print">Diagnóstico</span>
                  </label>
                  <span className="print-only">{tipoMant.diagnostico ? '☑ Diagnóstico' : '☐ Diagnóstico'}</span>
                </td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', width: '25%' }} onClick={(e) => e.stopPropagation()}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={tipoMant.capacitacion}
                      onChange={(e) => setTipoMant({ ...tipoMant, capacitacion: e.target.checked })}
                      className="no-print"
                    />
                    <span className="no-print">Capacitación</span>
                  </label>
                  <span className="print-only">{tipoMant.capacitacion ? '☑ Capacitación' : '☐ Capacitación'}</span>
                </td>
                <td style={{ border: '1px solid #666', padding: '3px 5px', width: '25%' }}>
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }} onClick={(e) => e.stopPropagation()}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={tipoMant.correctivo}
                      onChange={(e) => setTipoMant({ ...tipoMant, correctivo: e.target.checked })}
                      className="no-print"
                    />
                    <span className="no-print">Correctivo</span>
                  </label>
                  <span className="print-only">{tipoMant.correctivo ? '☑ Correctivo' : '☐ Correctivo'}</span>
                </td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }} onClick={(e) => e.stopPropagation()}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={tipoMant.instalacion}
                      onChange={(e) => setTipoMant({ ...tipoMant, instalacion: e.target.checked })}
                      className="no-print"
                    />
                    <span className="no-print">Instalación</span>
                  </label>
                  <span className="print-only">{tipoMant.instalacion ? '☑ Instalación' : '☐ Instalación'}</span>
                </td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }} onClick={(e) => e.stopPropagation()}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={tipoMant.otro}
                      onChange={(e) => setTipoMant({ ...tipoMant, otro: e.target.checked })}
                      className="no-print"
                    />
                    <span className="no-print">Otro</span>
                  </label>
                  <span className="print-only">{tipoMant.otro ? '☑ Otro' : '☐ Otro'}</span>
                </td>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}></td>
              </tr>
            </tbody>
          </table>

          {/* FALLA O PROBLEMA */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2px', fontSize: '9px' }}>
            <tbody>
              <tr style={{ backgroundColor: '#1e5a96', color: '#fff' }}>
                <td style={{ border: '1px solid #666', padding: '4px 5px', fontWeight: 'bold' }}>Falla o problema reportado:</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px', minHeight: '60px' }}>
                  <textarea
                    value={falla}
                    onChange={(e) => setFalla(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      height: '60px',
                      padding: '3px 4px',
                      border: 'none',
                      fontFamily: 'inherit',
                      fontSize: '9px',
                      boxSizing: 'border-box',
                      resize: 'none',
                      backgroundImage: 'linear-gradient(to bottom, transparent 19px, #d0d0d0 19px)',
                      backgroundSize: '100% 20px',
                      backgroundRepeat: 'repeat',
                      backgroundPosition: '0 3px',
                      backgroundColor: '#fff',
                    }}
                    className="no-print"
                  />
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '9px', lineHeight: '1.4', display: 'none' }} className="print-only">{falla}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* DIAGNÓSTICO */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2px', fontSize: '9px' }}>
            <tbody>
              <tr style={{ backgroundColor: '#1e5a96', color: '#fff' }}>
                <td style={{ border: '1px solid #666', padding: '4px 5px', fontWeight: 'bold' }}>Diagnóstico o trabajo realizado:</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #666', padding: '3px 5px' }}>
                  <textarea
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '3px 4px',
                      border: 'none',
                      fontFamily: 'inherit',
                      fontSize: '10px',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      lineHeight: '1.5',
                      backgroundImage: 'linear-gradient(to bottom, transparent 14px, #d0d0d0 14px)',
                      backgroundSize: '100% 15px',
                      backgroundRepeat: 'repeat',
                      backgroundPosition: '0 3px',
                      backgroundColor: '#fff',
                    }}
                    className="no-print"
                  />
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '10px', lineHeight: '1.5', minHeight: '60px', display: 'none' }} className="print-only">{diagnostico}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* REPUESTOS */}
          <div style={{ border: '1px solid #666', marginBottom: '2px', fontSize: '9px' }}>
            <div style={{ backgroundColor: '#1e5a96', color: '#fff', padding: '4px 5px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Repuestos / Accesorios
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  agregarRepuesto()
                }}
                style={{
                  background: '#fff',
                  border: 'none',
                  color: '#1e5a96',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                className="no-print"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#c9dcf0' }}>
                  <th style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'left', fontSize: '8px', fontWeight: 'bold' }}>Código</th>
                  <th style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'left', fontSize: '8px', fontWeight: 'bold' }}>Descripción</th>
                  <th style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'center', fontSize: '8px', fontWeight: 'bold', width: '10%' }}>Cantidad</th>
                  <th style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'left', fontSize: '8px', fontWeight: 'bold' }}>Causa</th>
                  <th style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'center', fontSize: '8px', fontWeight: 'bold', width: '8%' }} className="no-print">Acción</th>
                </tr>
              </thead>
              <tbody>
                {repuestos.map((rep) => (
                  <tr key={rep.id}>
                    <td style={{ border: '1px solid #ccc', padding: '3px 4px', fontSize: '8px' }}>
                      <input
                        type="text"
                        value={rep.codigo}
                        onChange={(e) => actualizarRepuesto(rep.id, 'codigo', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ width: '100%', border: 'none', padding: '2px', fontSize: '8px', boxSizing: 'border-box' }}
                        className="no-print"
                      />
                      <div className="print-only" style={{ fontSize: '8px' }}>{rep.codigo}</div>
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 4px', fontSize: '8px' }}>
                      <input
                        type="text"
                        value={rep.descripcion}
                        onChange={(e) => actualizarRepuesto(rep.id, 'descripcion', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ width: '100%', border: 'none', padding: '2px', fontSize: '8px', boxSizing: 'border-box' }}
                        className="no-print"
                      />
                      <div className="print-only" style={{ fontSize: '8px' }}>{rep.descripcion}</div>
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'center', fontSize: '8px' }}>
                      <input
                        type="text"
                        value={rep.cantidad}
                        onChange={(e) => actualizarRepuesto(rep.id, 'cantidad', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ width: '100%', border: 'none', padding: '2px', fontSize: '8px', boxSizing: 'border-box' }}
                        className="no-print"
                      />
                      <div className="print-only" style={{ fontSize: '8px', textAlign: 'center' }}>{rep.cantidad}</div>
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 4px', fontSize: '8px' }}>
                      <input
                        type="text"
                        value={rep.causa}
                        onChange={(e) => actualizarRepuesto(rep.id, 'causa', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ width: '100%', border: 'none', padding: '2px', fontSize: '8px', boxSizing: 'border-box' }}
                        className="no-print"
                      />
                      <div className="print-only" style={{ fontSize: '8px' }}>{rep.causa}</div>
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'center' }} className="no-print">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          eliminarRepuesto(rep.id)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#d9534f',
                          cursor: 'pointer',
                          padding: '0',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FIRMAS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '2px', fontSize: '9px', marginTop: '16px' }}>
            {/* FIRMA IZQUIERDA */}
            <div style={{ border: '1px solid #666', padding: '6px 5px', display: 'flex', flexDirection: 'column', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontWeight: 'bold', fontSize: '8px', backgroundColor: '#1e5a96', color: '#fff', padding: '3px 4px' }}>RECIBE A SATISFACCIÓN</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3px', fontSize: '7px' }}>
                <div>
                  <input type="text" placeholder="Nombre" value={firmaIzq.nombre} onChange={(e) => setFirmaIzq({...firmaIzq, nombre: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaIzq.nombre}</div>
                </div>
                <div>
                  <input type="text" placeholder="Cargo" value={firmaIzq.cargo} onChange={(e) => setFirmaIzq({...firmaIzq, cargo: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaIzq.cargo}</div>
                </div>
              </div>

              <div style={{ border: '1px dashed #999', padding: '8px 4px', textAlign: 'center', minHeight: '30px', backgroundColor: '#fafafa', position: 'relative' }}>
                {firmaIzq.imagen ? (
                  <img src={firmaIzq.imagen} alt="Firma" style={{ maxHeight: '28px', maxWidth: '100%' }} />
                ) : (
                  <span style={{ fontSize: '7px', color: '#999' }}>Firma</span>
                )}
              </div>

              <input type="file" accept="image/*" onChange={(e) => cargarFirma(e, true)} style={{ fontSize: '6px', display: 'none' }} className="no-print" id="file-firma-izq" />
              <div style={{ display: 'flex', gap: '2px' }} className="no-print">
                <label htmlFor="file-firma-izq" style={{ flex: 1, padding: '3px', fontSize: '7px', background: '#e8f0f7', border: '1px solid #1e5a96', color: '#1e5a96', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>📎 Cargar</label>
                {firmaIzq.imagen && <button onClick={() => limpiarFirma(true)} style={{ padding: '3px 6px', fontSize: '7px', background: '#ffebee', border: '1px solid #d32f2f', color: '#d32f2f', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', fontSize: '7px' }}>
                <div>
                  <input type="text" placeholder="C.C." value={firmaIzq.cc} onChange={(e) => setFirmaIzq({...firmaIzq, cc: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaIzq.cc}</div>
                </div>
                <div>
                  <input type="text" placeholder="INVIMA" value={firmaIzq.invima} onChange={(e) => setFirmaIzq({...firmaIzq, invima: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaIzq.invima}</div>
                </div>
              </div>

              <div style={{ fontSize: '7px' }}>
                <input type="text" placeholder="Tarjeta Prof." value={firmaIzq.tarjeta} onChange={(e) => setFirmaIzq({...firmaIzq, tarjeta: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaIzq.tarjeta}</div>
              </div>
            </div>

            {/* FIRMA DERECHA */}
            <div style={{ border: '1px solid #666', padding: '6px 5px', display: 'flex', flexDirection: 'column', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontWeight: 'bold', fontSize: '8px', backgroundColor: '#1e5a96', color: '#fff', padding: '3px 4px' }}>ENTREGA</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3px', fontSize: '7px' }}>
                <div>
                  <input type="text" placeholder="Nombre" value={firmaDer.nombre} onChange={(e) => setFirmaDer({...firmaDer, nombre: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaDer.nombre}</div>
                </div>
                <div>
                  <input type="text" placeholder="Cargo" value={firmaDer.cargo} onChange={(e) => setFirmaDer({...firmaDer, cargo: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaDer.cargo}</div>
                </div>
              </div>

              <div style={{ border: '1px dashed #999', padding: '8px 4px', textAlign: 'center', minHeight: '30px', backgroundColor: '#fafafa', position: 'relative' }}>
                {firmaDer.imagen ? (
                  <img src={firmaDer.imagen} alt="Firma" style={{ maxHeight: '28px', maxWidth: '100%' }} />
                ) : (
                  <span style={{ fontSize: '7px', color: '#999' }}>Firma</span>
                )}
              </div>

              <input type="file" accept="image/*" onChange={(e) => cargarFirma(e, false)} style={{ fontSize: '6px', display: 'none' }} className="no-print" id="file-firma-der" />
              <div style={{ display: 'flex', gap: '2px' }} className="no-print">
                <label htmlFor="file-firma-der" style={{ flex: 1, padding: '3px', fontSize: '7px', background: '#e8f0f7', border: '1px solid #1e5a96', color: '#1e5a96', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}>📎 Cargar</label>
                {firmaDer.imagen && <button onClick={() => limpiarFirma(false)} style={{ padding: '3px 6px', fontSize: '7px', background: '#ffebee', border: '1px solid #d32f2f', color: '#d32f2f', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', fontSize: '7px' }}>
                <div>
                  <input type="text" placeholder="C.C." value={firmaDer.cc} onChange={(e) => setFirmaDer({...firmaDer, cc: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaDer.cc}</div>
                </div>
                <div>
                  <input type="text" placeholder="INVIMA" value={firmaDer.invima} onChange={(e) => setFirmaDer({...firmaDer, invima: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                  <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaDer.invima}</div>
                </div>
              </div>

              <div style={{ fontSize: '7px' }}>
                <input type="text" placeholder="Tarjeta Prof." value={firmaDer.tarjeta} onChange={(e) => setFirmaDer({...firmaDer, tarjeta: e.target.value})} style={{ width: '100%', padding: '2px', fontSize: '7px', boxSizing: 'border-box', border: '1px solid #ddd' }} className="no-print" onClick={(e) => e.stopPropagation()} />
                <div className="print-only" style={{ fontSize: '7px', minHeight: '12px', padding: '2px' }}>{firmaDer.tarjeta}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>,
    document.body
  )
}
