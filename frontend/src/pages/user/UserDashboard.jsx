import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import '../../styles/admin.css'
import '../../styles/user.css'

const DEPT_ICONS  = { Cashier: '💰', Clinic: '🏥', Auditing: '📋' }

const PURPOSES = {
  Cashier:  ['Enrollment Downpayment', 'Tuition Payment', 'Others'],
  Auditing: ['Scholarship Concern', 'Financial Statement', 'Others'],
  Clinic:   ['Medical Certificate', 'Health Consultation', 'Others'],
}
const DEFAULT_PURPOSES = ['Enrollment Downpayment', 'Tuition Payment', 'Others']

function StatusBadge({ status }) {
  const cls = {
    waiting: 'bq-badge bq-badge-waiting', called: 'bq-badge bq-badge-called',
    serving: 'bq-badge bq-badge-serving', completed: 'bq-badge bq-badge-completed',
    cancelled: 'bq-badge bq-badge-cancelled',
  }
  const labels = { waiting: 'Waiting', called: 'Called', serving: 'Serving', completed: 'Completed', cancelled: 'Cancelled' }
  return <span className={cls[status] || cls.waiting}>{labels[status] || status}</span>
}

const UserDashboard = () => {
  const navigate   = useNavigate()
  const user       = JSON.parse(localStorage.getItem('user') || '{}')

  const [queues,   setQueues]   = useState([])
  const [myEntry,  setMyEntry]  = useState(null)
  const [position, setPosition] = useState(null)  // how many ahead
  const [joining,  setJoining]  = useState(null)
  const [purpose,  setPurpose]  = useState('')
  const [toast,    setToast]    = useState(null)
  const [busy,     setBusy]     = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 4000) }

  const load = useCallback(async () => {
    try {
      const [q, e] = await Promise.all([
        api.get('/queues'),
        api.get('/entries/my'),
      ])
      if (Array.isArray(q.data)) setQueues(q.data)
      const entry = e.data?._id ? e.data : null
      setMyEntry(entry)

      // Calculate position in queue
      if (entry && entry.queue?._id) {
        try {
          const qEntries = await api.get(`/entries/queue/${entry.queue._id}`)
          if (Array.isArray(qEntries.data)) {
            const waiting = qEntries.data.filter(x => x.status === 'waiting')
            const idx = waiting.findIndex(x => x._id === entry._id)
            setPosition(idx >= 0 ? idx : null)   // 0 = next up
          }
        } catch { setPosition(null) }
      } else {
        setPosition(null)
      }
    } catch { setMyEntry(null); setPosition(null) }
  }, [])

  useEffect(() => { load() }, [load])

  // Live polling every 5 seconds
  useEffect(() => {
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [load])

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest('.bq-user-btn') && !e.target.closest('.bq-dropdown')) setDropOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const openJoin = (q) => {
    setPurpose('')
    setJoining(q)
  }

  const confirmJoin = async () => {
    if (!joining) return
    setBusy(true)
    try {
      const res = await api.post('/entries/join', { queueId: joining._id, purpose })
      showToast('You have joined the queue!')
      setJoining(null)
      load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to join queue')
    } finally { setBusy(false) }
  }

  const cancel = async () => {
    try {
      await api.delete('/entries/cancel')
      showToast('Queue cancelled.')
      load()
    } catch (err) { showToast(err.response?.data?.message || 'Failed to cancel') }
  }

  const handleLogout = () => {
    localStorage.removeItem('bq_token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const deptName = (q) => q.department?.name || q.name?.replace(' Queue', '') || 'Queue'

  return (
    <div className="bq-app">
      {/* Sidebar */}
      <div className="user-sidebar">
        <div className="user-sidebar-logo">
          <span className="user-logo-icon">🍌</span>
          <span className="user-logo-text">BananaQue</span>
        </div>
        <nav className="user-sidebar-nav">
          <button className="user-nav-btn active">
            <span className="user-nav-icon">📊</span>Dashboard
          </button>
          <button className="user-nav-btn" onClick={() => navigate('/history')}>
            <span className="user-nav-icon">🕐</span>History
          </button>
        </nav>
      </div>

      {/* Main */}
      <div className="bq-main">
        {/* Topbar */}
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

        {/* Content */}
        <div className="user-content">
          <h2 className="bq-page-title">Dashboard</h2>
          <p className="bq-page-subtitle">
            Select a queue to <span style={{ color: '#f5a623', fontWeight: 600 }}>join</span> or view your active queues.
          </p>

          {/* Queue cards */}
          <div className="user-queue-grid">
            {queues.map(q => {
              const name  = deptName(q)
              const icon  = DEPT_ICONS[name] || '🏢'
              const avail = q.isActive
              return (
                <button
                  key={q._id}
                  className="user-queue-card"
                  disabled={!avail || !!myEntry}
                  onClick={() => avail && !myEntry && openJoin(q)}
                >
                  <span className="user-card-icon">{icon}</span>
                  <span className="user-card-label">{name} Queue</span>
                  {!avail && <span className="user-card-unavail">Unavailable</span>}
                </button>
              )
            })}
            <button className="user-queue-card" onClick={() => navigate('/history')}>
              <span className="user-card-icon">🕐</span>
              <span className="user-card-label">View History</span>
            </button>
          </div>

          {/* Active Queue */}
          <h3 className="user-active-title">Your Active Queues</h3>
          {!myEntry ? (
            <p className="bq-muted">
              No active queues. Select one above to <span style={{ color: '#f5a623' }}>join</span>.
            </p>
          ) : (
            <div className="user-entry-card">
              <div className="user-entry-top">
                <div>
                  <div className="user-entry-number">#{myEntry.queueNumber}</div>
                  <div className="user-entry-service">
                    Service: <b>{myEntry.queue?.name?.replace(' Queue', '') || myEntry.queue?.department?.name || '—'}</b>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={myEntry.status} />
                  {position !== null && myEntry.status === 'waiting' && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#a89fd8' }}>
                      {position === 0
                        ? <span style={{ color: '#f5a623', fontWeight: 700 }}>⚡ You're next!</span>
                        : <span>{position} {position === 1 ? 'person' : 'people'} ahead of you</span>
                      }
                    </div>
                  )}
                  {myEntry.status === 'called' && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#4caf50', fontWeight: 700 }}>
                      📢 Please proceed to the counter!
                    </div>
                  )}
                </div>
              </div>
              <button className="user-cancel-btn" onClick={cancel}>
                ✕ Cancel Queue
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Join Modal */}
      {joining && (
        <div className="user-modal-overlay" onClick={(e) => e.target === e.currentTarget && setJoining(null)}>
          <div className="user-modal">
            <button className="user-modal-close" onClick={() => setJoining(null)}>✕</button>
            <div className="user-modal-title">
              {DEPT_ICONS[deptName(joining)] || '🏢'} Join {deptName(joining)} Queue
            </div>
            <p className="user-modal-sub">Fill in the details below before joining the queue.</p>

            <label className="user-modal-label">Name</label>
            <input
              className="user-modal-input"
              value={user?.name || user?.email || ''}
              readOnly
              placeholder="Enter your name"
            />

            <label className="user-modal-label">Purpose</label>
            <select
              className="user-modal-input"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
            >
              <option value="">Select a purpose</option>
              {(PURPOSES[deptName(joining)] || DEFAULT_PURPOSES).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <button
              className="user-modal-confirm"
              onClick={confirmJoin}
              disabled={busy}
            >
              {busy ? 'Joining...' : 'Confirm & Join Queue'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="user-toast">
          <span className="user-toast-icon">✔</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}

export default UserDashboard