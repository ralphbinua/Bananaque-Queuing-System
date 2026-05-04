import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/admin.css'

const ADMIN_LINKS = [
  { id: 'dashboard', label: 'Dashboard',            icon: '📊', path: '/admin' },
  { id: 'cashier',   label: 'Cashier',              icon: '💰', path: '/admin/queue/cashier' },
  { id: 'auditing',  label: 'Auditing',             icon: '📋', path: '/admin/queue/auditing' },
  { id: 'clinic',    label: 'Clinic',               icon: '🏥', path: '/admin/queue/clinic' },
  { id: 'monitor',   label: 'Monitor Transactions', icon: '📊', path: '/admin/transactions' },
  { id: 'service',   label: 'Manage Service',       icon: '⚙️', path: '/admin/service' },
  { id: 'users',     label: 'Manage Users',         icon: '👥', path: '/admin/users' },
]

const AdminLayout = ({ children, title }) => {
  const navigate  = useNavigate()
  const location  = useLocation()
  const user      = JSON.parse(localStorage.getItem('user') || '{}')
  const [dropOpen, setDropOpen] = React.useState(false)

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.bq-user-btn') && !e.target.closest('.bq-dropdown')) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('bq_token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="bq-app">
      {/* Sidebar */}
      <div className="bq-sidebar">
        <div className="bq-sidebar-logo">
          <span className="bq-logo-icon">🍌</span>
          <span className="bq-logo-text">BananaQue</span>
        </div>
        <nav className="bq-sidebar-nav">
          {ADMIN_LINKS.map(link => (
            <button
              key={link.id}
              className={`bq-nav-btn${isActive(link.path) ? ' active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              <span className="bq-nav-icon">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </nav>
        <div className="bq-sidebar-footer">v1.0 · Admin</div>
      </div>

      {/* Main area */}
      <div className="bq-main">
        <div className="bq-topbar">
          <div className="bq-topbar-title">
            <span className="bq-topbar-accent" />
            {title || 'BananaQue'}
          </div>

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
