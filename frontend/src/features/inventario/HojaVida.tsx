import { createPortal } from 'react-dom'

import logo from '../../assets/logo-valle-atriz.png'
import type { Equipo } from '../../entities/equipo'

// Valores fijos de la plantilla oficial (GDB-HV1).
const NIT = '830504400-8'
const VIGENCIA = '2025'
const VERSION = '1'
const CODIGO = 'GDB-HV1'

const v = (x: string | number | null | undefined) => (x != null && x !== '' ? String(x) : '')
const lista = (a: string[] | null | undefined) => (a && a.length ? a.join(', ') : '')
const x = (b: boolean) => (b ? 'X' : '')

function Encabezado({ pagina }: { pagina: number }) {
  return (
    <table className="hv-head">
      <colgroup>
        {/* logo A-D, texto E-J, etiqueta K-L, valor M-N */}
        <col style={{ width: '22.3%' }} />
        <col style={{ width: '41.7%' }} />
        <col style={{ width: '14.2%' }} />
        <col style={{ width: '21.8%' }} />
      </colgroup>
      <tbody>
        <tr>
          <td className="hv-logo" rowSpan={4}>
            <img src={logo} alt="Centro Médico Valle de Atriz" />
          </td>
          <td className="hv-emp" rowSpan={2}>
            <strong>CENTRO MEDICO VALLE DE ATRIZ</strong>
            <br />
            {NIT}
          </td>
          <td className="hv-lbl">PAGINA:</td>
          <td className="hv-val">{pagina}</td>
        </tr>
        <tr>
          <td className="hv-lbl">VIGENCIA:</td>
          <td className="hv-val">{VIGENCIA}</td>
        </tr>
        <tr>
          <td className="hv-tit" rowSpan={2}>
            HOJA DE VIDA PARA EQUIPOS BIOMEDICOS E INDUSTRIALES
          </td>
          <td className="hv-lbl">VERSIÓN:</td>
          <td className="hv-val">{VERSION}</td>
        </tr>
        <tr>
          <td className="hv-lbl">CODIGO:</td>
          <td className="hv-val">{CODIGO}</td>
        </tr>
      </tbody>
    </table>
  )
}

function Seccion({ n }: { n: string }) {
  return <div className="hv-seccion">{n}</div>
}

/** Fila etiqueta/valor para las tablas de datos. */
function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <tr>
      <td className="hv-k">{label}</td>
      <td className="hv-v">{valor}</td>
    </tr>
  )
}

export function HojaVida({
  equipo: e,
  fotoUrl,
  onCerrar,
}: {
  equipo: Equipo
  fotoUrl: string | null
  onCerrar: () => void
}) {
  return createPortal(
    <div className="hv-overlay">
      <div className="hv-barra no-print">
        <button className="btn-primary" onClick={() => window.print()}>
          🖨️ Imprimir / Guardar como PDF
        </button>
        <button className="btn-ghost" onClick={onCerrar}>
          Cerrar
        </button>
      </div>

      <div className="hv-doc">
        {/* ===================== PÁGINA 1 ===================== */}
        <section className="hv-pagina">
          <Encabezado pagina={1} />

          <div className="hv-fila-top">
            <div className="hv-foto">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Foto del equipo" />
              ) : (
                <span className="muted">Sin foto</span>
              )}
            </div>
            <div className="hv-desc-func">
              <Seccion n="1. DESCRIPCIÓN FUNCIONAL" />
              <div className="hv-texto">{v(e.descripcion_funcional)}</div>
              <div className="hv-dos-col par">
                <div>
                  <Seccion n="2. CLASIFICACIÓN BIOMÉDICA" />
                  <div className="hv-centro">{v(e.clase_biomedica)}</div>
                </div>
                <div>
                  <Seccion n="3. CLASIFICACIÓN POR USO" />
                  <div className="hv-centro">{v(e.clase_uso)}</div>
                </div>
              </div>
            </div>
          </div>

          <Seccion n="4. UBICACIÓN DEL EQUIPO" />
          <table className="hv-tabla">
            <colgroup>
              <col style={{ width: '15.25%' }} />
              <col style={{ width: '13.86%' }} />
              <col style={{ width: '16.56%' }} />
              <col style={{ width: '18.32%' }} />
              <col style={{ width: '9.12%' }} />
              <col style={{ width: '26.89%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="hv-k">ACTIVO:</td>
                <td>{v(e.numero_activo)}</td>
                <td className="hv-k">UBICACIÓN:</td>
                <td>{v(e.piso)}</td>
                <td className="hv-k">SERVICIO:</td>
                <td>{v(e.servicio_nombre)}</td>
              </tr>
            </tbody>
          </table>

          <Seccion n="5. DESCRIPCIÓN" />
          <table className="hv-tabla">
            <tbody>
              <Fila label="Nombre del equipo:" valor={v(e.nombre)} />
              <Fila label="Marca:" valor={v(e.marca)} />
              <Fila label="Modelo:" valor={v(e.modelo)} />
              <Fila label="Número de Serie:" valor={v(e.serial_fabricante)} />
            </tbody>
          </table>

          <div className="hv-dos-col">
            <div>
              <Seccion n="6. DATOS FABRICANTE" />
              <table className="hv-tabla">
                <tbody>
                  <Fila label="Fabricante:" valor={v(e.fabricante)} />
                  <Fila label="Año de fabricación:" valor={v(e.anio_fabricacion)} />
                  <Fila label="País de fabricación:" valor={v(e.pais_fabricante)} />
                  <Fila label="Ciudad de fabricante:" valor={v(e.ciudad_fabricante)} />
                  <Fila label="Dirección de fabricante:" valor={v(e.direccion_fabricante)} />
                  <Fila label="Teléfono de fabricante:" valor={v(e.telefono_fabricante)} />
                  <Fila label="Correo de fabricante:" valor={v(e.correo_fabricante)} />
                </tbody>
              </table>
            </div>
            <div>
              <Seccion n="7. DATOS DE REPRESENTANTE" />
              <table className="hv-tabla">
                <tbody>
                  <Fila label="Representante:" valor={v(e.representante)} />
                  <Fila label="País del representante:" valor={v(e.pais_representante)} />
                  <Fila label="Ciudad de representante:" valor={v(e.ciudad_representante)} />
                  <Fila label="Dirección del representante:" valor={v(e.direccion_representante)} />
                  <Fila label="Teléfono del representante:" valor={v(e.telefono_representante)} />
                  <Fila label="Correo del representante:" valor={v(e.correo_representante)} />
                </tbody>
              </table>
            </div>
          </div>

          <table className="hv-tabla">
            <colgroup>
              {/* Anchos tomados del Excel (A-C / D-E / F-H / I-K / L-N) */}
              <col style={{ width: '15.3%' }} />
              <col style={{ width: '13.9%' }} />
              <col style={{ width: '16.6%' }} />
              <col style={{ width: '27.4%' }} />
              <col style={{ width: '26.8%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="hv-sec" colSpan={2}>8. REGISTRO TÉCNICO</td>
                <td className="hv-sec">9. FUENTE DE ALIMENTACIÓN</td>
                <td className="hv-sec" colSpan={2}>10. REGISTRO INVIMA</td>
              </tr>
              <tr>
                <td className="hv-k">Voltaje operación (V)</td>
                <td>{v(e.voltaje_operacion)}</td>
                <td className="hv-ctr" rowSpan={3}>{lista(e.fuentes_alimentacion)}</td>
                <td className="hv-k">Número de reg INVIMA:</td>
                <td>{v(e.registro_invima)}</td>
              </tr>
              <tr>
                <td className="hv-k">Voltaje máximo (V)</td>
                <td>{v(e.voltaje_maximo)}</td>
                <td className="hv-k">Fecha de vencimiento INVIMA:</td>
                <td>{v(e.fecha_vencimiento_invima)}</td>
              </tr>
              <tr>
                <td className="hv-k">Corriente máxima (A)</td>
                <td>{v(e.corriente_maxima)}</td>
                <td className="hv-sec" colSpan={2}>12. GARANTÍA</td>
              </tr>
              <tr>
                <td className="hv-k">Corriente mínima (A)</td>
                <td>{v(e.corriente_minima)}</td>
                <td className="hv-sec">11. PLANOS</td>
                <td className="hv-k">Fecha de Inicio:</td>
                <td>{v(e.fecha_inicial_garantia)}</td>
              </tr>
              <tr>
                <td className="hv-k">Potencia consumida (W)</td>
                <td>{v(e.potencia_consumida)}</td>
                <td className="hv-ctr" rowSpan={3}>{lista(e.planos)}</td>
                <td className="hv-k">Fecha de Finalización:</td>
                <td>{v(e.fecha_final_garantia)}</td>
              </tr>
              <tr>
                <td className="hv-k">Frecuencia (Hz)</td>
                <td>{v(e.frecuencia)}</td>
                <td className="hv-sec" colSpan={2}>14. ADQUISICIÓN</td>
              </tr>
              <tr>
                <td className="hv-k">Presión</td>
                <td>{v(e.presion)}</td>
                <td className="hv-k">Modo de Adquisición:</td>
                <td>{v(e.modo_adquisicion)}</td>
              </tr>
              <tr>
                <td className="hv-k">Velocidad (m/s)</td>
                <td>{v(e.velocidad)}</td>
                <td className="hv-sec">13. MANUALES</td>
                <td className="hv-k">Fecha de Adquisición:</td>
                <td>{v(e.fecha_adquisicion)}</td>
              </tr>
              <tr>
                <td className="hv-k">Temperatura (°C)</td>
                <td>{v(e.temperatura)}</td>
                <td className="hv-ctr" rowSpan={3}>{lista(e.manuales)}</td>
                <td className="hv-k">Fecha de Instalación:</td>
                <td>{v(e.fecha_instalacion)}</td>
              </tr>
              <tr>
                <td className="hv-k">Peso (Kg)</td>
                <td>{v(e.peso)}</td>
                <td className="hv-k">Fecha de puesta en Funcionamiento:</td>
                <td>{v(e.fecha_funcionamiento)}</td>
              </tr>
              <tr>
                <td className="hv-k">Capacidad</td>
                <td>{v(e.capacidad)}</td>
                <td className="hv-sec">15. CLASIFICACIÓN POR RIESGO</td>
                <td className="hv-ctr">{v(e.clasificacion_riesgo)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ===================== PÁGINA 2 ===================== */}
        <section className="hv-pagina hv-salto">
          <Encabezado pagina={2} />

          <div className="hv-dos-col">
            <div>
              <Seccion n="16. CLASE DE TECNOLOGÍA PREDOMINANTE" />
              <div className="hv-centro">{v(e.tecnologia_predominante)}</div>
            </div>
            <div>
              <Seccion n="17. MOVILIDAD DEL EQUIPO" />
              <table className="hv-tabla">
                <colgroup>
                  <col style={{ width: '33.7%' }} />
                  <col style={{ width: '16.8%' }} />
                  <col style={{ width: '28.1%' }} />
                  <col style={{ width: '21.4%' }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="hv-k">Móvil</td>
                    <td className="hv-ctr">{x(e.equipo_movil)}</td>
                    <td className="hv-k">Fijo</td>
                    <td className="hv-ctr">{x(e.equipo_fijo)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <Seccion n="18. CALIBRACIÓN" />
          <table className="hv-tabla">
            <colgroup>
              <col style={{ width: '45.7%' }} />
              <col style={{ width: '18.3%' }} />
              <col style={{ width: '9.1%' }} />
              <col style={{ width: '15.3%' }} />
              <col style={{ width: '11.6%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="hv-k">¿El equipo requiere Calibración?</td>
                <td className="hv-k hv-ctr">SI</td>
                <td className="hv-ctr">{x(e.calibracion_si)}</td>
                <td className="hv-k hv-ctr">NO</td>
                <td className="hv-ctr">{x(e.calibracion_no)}</td>
              </tr>
            </tbody>
          </table>

          <Seccion n="18. ACCESORIOS" />
          <div className="hv-texto">{v(e.accesorios)}</div>

          <Seccion n="19. PERIODICIDAD DE MANTENIMIENTO PREVENTIVO" />
          <div className="hv-centro">{v(e.periodicidad_mantenimiento)}</div>

          <Seccion n="19. RECOMENDACIONES DEL FABRICANTE" />
          <table className="hv-tabla">
            <tbody>
              {e.recomendaciones_fabricante.length ? (
                e.recomendaciones_fabricante.map((r, i) => (
                  <tr key={i}>
                    <td className="hv-v">{r}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="hv-v">&nbsp;</td>
                </tr>
              )}
            </tbody>
          </table>

          <table className="hv-firmas">
            <tbody>
              <tr>
                <td className="hv-k">ELABORADO POR:</td>
                <td className="hv-v">Mantenimiento</td>
                <td className="hv-k">APROBADO POR:</td>
                <td className="hv-v">Gerencia</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>,
    document.body,
  )
}
