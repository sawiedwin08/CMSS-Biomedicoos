import { Blocks, ShieldCheck, Users } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ModulosPage } from '../../features/plataforma/ModulosPage'
import { RolesPage } from '../../features/roles/RolesPage'
import { UsuariosPage } from '../../features/usuarios/UsuariosPage'
import { useAuth } from '../../shared/auth/AuthContext'
import { ModuleShell, type NavItem } from '../ModuleShell'

const BASE = '/m/admin'

export function AdminModule() {
  const { usuario, puede } = useAuth()
  if (!usuario?.modulos.includes('admin')) {
    return <Navigate to="/" replace />
  }

  const verUsuarios = puede('usuarios:ver')
  const verRoles = puede('roles:ver')
  const verModulos = puede('modulos:ver')
  const items: NavItem[] = [
    { to: 'usuarios', icono: Users, texto: 'Usuarios', visible: verUsuarios },
    { to: 'roles', icono: ShieldCheck, texto: 'Roles y permisos', visible: verRoles },
    { to: 'modulos', icono: Blocks, texto: 'Módulos', visible: verModulos },
  ]

  // Primer destino disponible según permisos.
  const inicio = verUsuarios
    ? 'usuarios'
    : verRoles
      ? 'roles'
      : verModulos
        ? 'modulos'
        : ''

  return (
    <ModuleShell
      moduloNombre="Administración"
      moduloIcono="⚙️"
      basePath={BASE}
      items={items}
    >
      <Routes>
        <Route path="" element={<Navigate to={inicio} replace />} />
        {verUsuarios && <Route path="usuarios" element={<UsuariosPage />} />}
        {verRoles && <Route path="roles" element={<RolesPage />} />}
        {verModulos && <Route path="modulos" element={<ModulosPage />} />}
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </ModuleShell>
  )
}
