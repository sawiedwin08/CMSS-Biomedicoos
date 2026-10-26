import {
  Boxes,
  FileText,
  Home,
  KeyRound,
  Laptop,
  LifeBuoy,
  Network,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ActasPage } from '../../features/sistemas/ActasPage'
import { ActivosPage } from '../../features/sistemas/ActivosPage'
import { CuentasCorreoPage } from '../../features/sistemas/CuentasCorreoPage'
import { InicioPage } from '../../features/sistemas/InicioPage'
import { MantenimientosPage } from '../../features/sistemas/MantenimientosPage'
import { MesaAyudaPage } from '../../features/sistemas/MesaAyudaPage'
import { contarNuevos } from '../../features/sistemas/mesaAyudaApi'
import { RedesPage } from '../../features/sistemas/RedesPage'
import { useAuth } from '../../shared/auth/AuthContext'
import { ModuleShell, type NavItem } from '../ModuleShell'

const BASE = '/m/inventario_tecnologico'

/** Opciones (secciones) del módulo Sistemas. */
const SECCIONES: { to: string; icono: LucideIcon; texto: string }[] = [
  { to: 'mesa-ayuda', icono: LifeBuoy, texto: 'Mesa de ayuda' },
  { to: 'inventario', icono: Boxes, texto: 'Inventario de activos' },
  { to: 'actas', icono: FileText, texto: 'Actas' },
  { to: 'mantenimientos', icono: Wrench, texto: 'Mantenimientos' },
  { to: 'redes', icono: Network, texto: 'Redes e infraestructura' },
  { to: 'cuentas-correo', icono: KeyRound, texto: 'Cuentas de correo' },
]

export function InventarioTecnologicoModule() {
  const { usuario, puede } = useAuth()
  const [nuevos, setNuevos] = useState(0)
  const verMesa = puede('mesa_ayuda:ver')

  useEffect(() => {
    if (!verMesa) return
    let activo = true
    const run = () =>
      contarNuevos()
        .then((n) => {
          if (activo) setNuevos(n)
        })
        .catch(() => {})
    run()
    const id = setInterval(run, 15000)
    return () => {
      activo = false
      clearInterval(id)
    }
  }, [verMesa])

  if (!usuario?.modulos.includes('inventario_tecnologico')) {
    return <Navigate to="/" replace />
  }

  const items: NavItem[] = [
    { to: '', icono: Home, texto: 'Inicio', visible: true },
    ...SECCIONES.map((s) => ({
      ...s,
      visible: true,
      badge: s.to === 'mesa-ayuda' && nuevos > 0 ? nuevos : undefined,
    })),
  ]

  return (
    <ModuleShell moduloNombre="Sistemas" moduloIcono={Laptop} basePath={BASE} items={items}>
      <Routes>
        <Route path="" element={<InicioPage />} />
        <Route path="mesa-ayuda" element={<MesaAyudaPage />} />
        <Route path="inventario" element={<ActivosPage />} />
        <Route path="actas" element={<ActasPage />} />
        <Route path="mantenimientos" element={<MantenimientosPage />} />
        <Route path="redes" element={<RedesPage />} />
        <Route path="cuentas-correo" element={<CuentasCorreoPage />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </ModuleShell>
  )
}
