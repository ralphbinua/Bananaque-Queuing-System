import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/admin.css'

const ADMIN_LINKS = [
  { id: 'dashboard', label: 'Dashboard',      path: '/admin' },
  { id: 'cashier',   label: 'Cashier',        path: '/admin/queue/cashier' },
  { id: 'auditing',  label: 'Auditing',       path: '/admin/queue/auditing' },
  { id: 'clinic',    label: 'Clinic',         path: '/admin/queue/clinic' },
  { id: 'service',   label: 'Manage Service', path: '/admin/service' },
  { id: 'users',     label: 'Manage Users',   path: '/admin/users' },
]

const AdminLayout = ({ children, title }) => {
  const navigate  = useNavigate()
  const location  = useLocation()
  const user      = JSON.parse(localStorage.getItem('user') || '{}')
  const [dropOpen, setDropOpen] = React.useState(false)

  const handleLogout = () => {
    localStorage.removeItem('bq_token')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <div className="bq-app">
      {/* Sidebar */}
      <div className="bq-sidebar">
        <div className="bq-sidebar-logo">BananaQue</div>
        <nav style={{ flex: 1, paddingTop: 16 }}>
          {ADMIN_LINKS.map(link => (
            <button
              key={link.id}
              className={`bq-nav-btn${location.pathname === link.path ? ' active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main area */}
      <div className="bq-main">
        <div className="bq-topbar">
          <span className="bq-topbar-title">{title || 'BananaQue'}</span>

          <div style={{ position: 'relative' }}>
            <button className="bq-user-btn" onClick={() => setDropOpen(o => !o)}>
              👤 {user?.name || user?.email || 'Admin'}
              <span style={{ fontSize: 10, color: '#a89fd8' }}>▼</span>
            </button>
            {dropOpen && (
              <div className="bq-dropdown">
                <div className="bq-dropdown-header">
                  <div className="bq-dropdown-name">{user?.name || 'Admin'}</div>
                  <div className="bq-dropdown-email">{user?.email}</div>
                </div>
                <button className="bq-dropdown-btn" onClick={() => { setDropOpen(false); handleLogout() }}>
                  ↪ Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bq-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
