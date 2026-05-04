import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import '../../styles/admin.css'
import '../../styles/user.css'

function StatusBadge({ status }) {
  const cls = {
    waiting: 'bq-badge bq-badge-waiting', called: 'bq-badge bq-badge-called',
    serving: 'bq-badge bq-badge-serving', completed: 'bq-badge bq-badge-completed',
    cancelled: 'bq-badge bq-badge-cancelled',
  }
  const labels = { waiting: 'Waiting', called: 'Called', serving: 'Serving', completed: 'Completed', cancelled: 'Cancelled' }
  return <span className={cls[status] || cls.waiting}>{labels[status] || status}</span>
}

const CustomerHistory = () => {
  const navigate  = useNavigate()
  const user      = JSON.parse(localStorage.getItem('user') || '{}')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [dropOpen, setDropOpen] = useState(false)

  useEffect(() => {
    api.get('/entries/my/history')
      .then(res => { if (Array.isArray(res.data)) setHistory(res.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('bq_token')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <div className="bq-app">
      {/* Sidebar */}
      <div className="user-sidebar">
        <div className="user-sidebar-logo">
          <span className="user-logo-icon">🍌</span>
          <span className="user-logo-text">BananaQue</span>
        </div>
        <nav className="user-sidebar-nav">
          <button className="user-nav-btn" onClick={() => navigate('/dashboard')}>
            <span className="user-nav-icon">📊</span>Dashboard
          </button>
          <button className="user-nav-btn active">
            <span className="user-nav-icon">🕐</span>History
          </button>
        </nav>
      </div>

      {/* Main */}
      <div className="bq-main">
        <div className="user-topbar">
          <div className="user-topbar-title">
            <span className="user-topbar-accent" />
            BananaQue
          </div>
          <div style={{ position: 'relative' }}>
            <button className="bq-user-btn" onClick={() => setDropOpen(o => !o)}>
              👤 {user?.name || user?.email || 'User'}
              <span style={{ fontSize: 10, color: '#a89fd8' }}>▼</span>
            </button>
            {dropOpen && (
              <div className="bq-dropdown">
                <div className="bq-dropdown-header">
                  <div className="bq-dropdown-name">{user?.name || 'Customer'}</div>
                  <div className="bq-dropdown-email">{user?.email}</div>
                </div>
                <button className="bq-dropdown-btn" onClick={() => { setDropOpen(false); handleLogout() }}>
                  ↪ Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="user-content">
          <h2 className="bq-page-title">History</h2>
          <p className="bq-page-subtitle">Your past queue entries.</p>

          {loading && <p className="bq-muted">Loading...</p>}

          {!loading && history.length === 0 && (
            <div className="bq-clear-card" style={{ marginTop: 24 }}>
              <span className="bq-clear-icon">📋</span>
              <span className="bq-clear-text">No history yet.</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(e => (
              <div key={e._id} style={{
                background: '#1e1a4a',
                border: '1px solid #2e2a6e',
                borderRadius: 12,
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>
                    {e.queue?.name?.replace(' Queue', '') || '—'} — #{String(e.queueNumber).padStart(3, '0')}
                  </div>
                  <div className="bq-muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {new Date(e.createdAt).toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerHistory
