import { useNavigate } from 'react-router-dom'
import RoleLayout from './RoleLayout'

const ADMIN_NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    pageTitle: 'Administrator Dashboard',
    description: 'Monitor CrediVault resources and system activity.',
    icon: '⌂',
  },
  {
    key: 'users',
    label: 'Users',
    pageTitle: 'User Management',
    description: 'Review and manage CrediVault user accounts.',
    icon: '♙',
  },
  {
    key: 'issuers',
    label: 'Issuers',
    pageTitle: 'Issuer Management',
    description: 'Manage issuer accounts and university associations.',
    icon: '▤',
  },
  {
    key: 'institutions',
    label: 'Institutions',
    pageTitle: 'Institution Management',
    description: 'Manage universities and their credential activity.',
    icon: '▦',
  },
  {
    key: 'audit',
    label: 'Audit Logs',
    pageTitle: 'Audit Management',
    description: 'Review recorded administrative and credential activity.',
    icon: '↻',
  },
]

const ADMIN_ROUTES = {
  dashboard: '/admin',
  users: '/admin/users',
  issuers: '/admin/issuers',
  institutions: '/admin/institutions',
  audit: '/admin/audit-logs',
}

// Shared administrator shell; navigation preserves the existing route paths.
function AdminLayout({ activeKey, onLogout, headerActions, children }) {
  const navigate = useNavigate()

  const handleNavigate = (key) => {
    const path = ADMIN_ROUTES[key]
    if (path) navigate(path)
  }

  return (
    <RoleLayout
      role="ADMIN"
      navItems={ADMIN_NAV_ITEMS}
      activeKey={activeKey}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      headerActions={headerActions}
    >
      {children}
    </RoleLayout>
  )
}

export default AdminLayout
