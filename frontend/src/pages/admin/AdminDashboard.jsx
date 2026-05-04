import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import '../../styles/admin.css'

const DEPT_ICONS = {
  Cashier:  '👥',
  Clinic:   '🏥',
  Auditing: '📋',
}

const NAV_LINKS = [
  { id: 'dashboard', label: 'Dashboard',      path: '/admin' },
  { id: 'cashier',   label: 'Cashier',        path: '/admin/queue/cashier' },
  { id: 'auditing',  label: 'Auditing',       path: '/admin/queue/auditing' },
  { id: 'clinic',    label: 'Clinic',         path: '/admin/queue/clinic' },
  { id: 'service',   label: 'Manage Service', path: '/admin/service' },
  { id: 'users',     label: 'Manage Users',   path: '/admin/users' },
]

// ── Sidebar ──────────────────────────────────────────────────
function Sidebar({ activePage, onNavigate, onLogout }) {
  return (
    <div className="bq-sidebar">
      <div className="bq-sidebar-logo">BananaQue</div>
      <nav style={{ flex: 1, paddingTop: 16 }}>
        {NAV_LINKS.map(link => (
          <button
            key={link.id}
            className={`bq-nav-btn${activePage === link.id ? ' active' : ''}`}
            onClick={() => onNavigate(link.path, link.id)}
          >
            {link.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ── AdminDashboard ────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate   = useNavigate()
  const token      = localStorage.getItem('bq_token')
  const user       = JSON.parse(localStorage.getItem('user') || '{}')

  const [overview,  setOverview]  = useState([])
  const [dropOpen,  setDropOpen]  = useState(false)
  const [activePage, setActivePage] = useState('dashboard')

  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => {
    api.get('/admin/overview', authHeader)
      .then(res => { if (Array.isArray(res.data)) setOverview(res.data) })
      .catch(console.error)
  }, [token])

  const handleNavigate = (path, pageId) => {
    setActivePage(pageId)
    navigate(path)
  }

  const handleLogout = () => {
    localStorage.removeItem('bq_token')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <div className="bq-app">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {/* Main */}
      <div className="bq-main">

        {/* Top bar */}
        <div className="bq-topbar">
          <span className="bq-topbar-title">BananaQue</span>

          {/* User dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              id="admin-user-menu"
              className="bq-user-btn"
              onClick={() => setDropOpen(o => !o)}
            >
              👤 {user?.name || user?.email || 'Admin'}
              <span style={{ fontSize: 10, color: '#a89fd8' }}>▼</span>
            </button>

            {dropOpen && (
              <div className="bq-dropdown">
                <div className="bq-dropdown-header">
                  <div className="bq-dropdown-name">{user?.name || 'Admin'}</div>
                  <div className="bq-dropdown-email">{user?.email}</div>
                </div>
                <button
                  className="bq-dropdown-btn"
                  onClick={() => { setDropOpen(false); handleLogout() }}
                >
                  ↪ Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bq-content">
          <h2 className="bq-page-title">🍌 BananaQue — Admin</h2>

          {/* Management quick-access cards */}
          <div className="bq-mgmt-grid mt-3">
            <div
              id="admin-card-users"
              className="bq-mgmt-card"
              onClick={() => handleNavigate('/admin/users', 'users')}
            >
              <span style={{ fontSize: 28 }}>👥</span>
              <div className="bq-mgmt-card-title">Manage Users</div>
              <div className="bq-mgmt-card-desc">Register new accounts and view all users</div>
              <div className="bq-mgmt-card-action">Manage →</div>
            </div>

            <div
              id="admin-card-service"
              className="bq-mgmt-card"
              onClick={() => handleNavigate('/admin/service', 'service')}
            >
              <span style={{ fontSize: 28 }}>⚙️</span>
              <div className="bq-mgmt-card-title">Manage Service</div>
              <div className="bq-mgmt-card-desc">Enable or disable department services</div>
              <div className="bq-mgmt-card-action">Configure →</div>
            </div>
          </div>

          {/* Queue overview */}
          <h3 className="bq-section-title">Queue Overview</h3>
          <p className="bq-page-subtitle">Select a queue to manage.</p>

          {overview.length === 0 ? (
            <p className="bq-muted">Loading queue data...</p>
          ) : (
            <div className="bq-overview-grid">
              {overview.map(q => {
                const dname = q.department?.name || 'Queue'
                const icon  = DEPT_ICONS[dname] || '🏢'
                const queuePageId = dname.toLowerCase()

                return (
                  <div
                    key={q._id}
                    id={`admin-queue-${queuePageId}`}
                    className="bq-overview-card"
                    onClick={() => handleNavigate(`/admin/queue/${queuePageId}`, queuePageId)}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: 20 }}>{icon}</span>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#ffffff' }}>
                          {dname}
                        </span>
                      </div>
                      <span className="bq-muted">{q.waitingCount} waiting</span>
                    </div>

                    <div className="bq-muted mt-2" style={{ fontSize: 12 }}>
                      Serving:{' '}
                      {q.currentEntry
                        ? `#${String(q.currentEntry.queueNumber ?? q.currentNumber ?? 0).padStart(3, '0')} — ${q.currentEntry.customer?.email ?? ''}`
                        : 'None'}
                    </div>

                    <div className="bq-mgmt-card-action mt-2">Manage →</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard