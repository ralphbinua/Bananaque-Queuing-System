import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import '../../styles/admin.css'

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
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/entries/my/history')
      .then(res => { if (Array.isArray(res.data)) setHistory(res.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bq-app">
      {/* Sidebar */}
      <div className="bq-sidebar-user">
        <div className="bq-sidebar-logo">BananaQue</div>
        <nav style={{ flex: 1, paddingTop: 16 }}>
          <button className="bq-nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="bq-nav-btn active">History</button>
        </nav>
      </div>

      {/* Main */}
      <div className="bq-main">
        <div className="bq-topbar">
          <span className="bq-topbar-title">BananaQue</span>
        </div>

        <div className="bq-content">
          <h2 className="bq-page-title">History</h2>
          <p className="bq-page-subtitle">Your past queue entries.</p>

          {loading && <p className="bq-muted">Loading...</p>}

          {!loading && history.length === 0 && (
            <p className="bq-muted">No history yet.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(e => (
              <div key={e._id} className="bq-history-card">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>
                    {e.queue?.name?.replace(' Queue', '') || '—'} — #{String(e.queueNumber).padStart(3, '0')}
                  </div>
                  <div className="bq-muted mt-1" style={{ fontSize: 12 }}>
                    {new Date(e.createdAt).toLocaleDateString()}
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
