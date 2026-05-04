import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import '../../styles/admin.css'

const DEPT_ICONS = { Cashier: '👥', Clinic: '🏥', Auditing: '📋' }

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
  const navigate  = useNavigate()
  const user      = JSON.parse(localStorage.getItem('user') || '{}')
  const [queues,  setQueues]  = useState([])
  const [myEntry, setMyEntry] = useState(null)
  const [msg,     setMsg]     = useState('')
  const [joining, setJoining] = useState(null)
  const [dropOpen, setDropOpen] = useState(false)

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const load = useCallback(async () => {
    try {
      const [q, e] = await Promise.all([
        api.get('/queues'),
        api.get('/entries/my'),
      ])
      if (Array.isArray(q.data)) setQueues(q.data)
      if (e.data?._id) setMyEntry(e.data)
      else setMyEntry(null)
    } catch { setMyEntry(null) }
  }, [])

  useEffect(() => { load() }, [load])

  const join = async (queue) => {
    try {
      const res = await api.post('/entries/join', { queueId: queue._id })
      flash(`Joined! Your number is #${res.data.queueNumber}`)
      setJoining(null)
      load()
    } catch (err) { flash(err.response?.data?.message || 'Failed to join queue') }
  }

  const cancel = async () => {
    try {
      await api.delete('/entries/cancel')
      flash('Queue cancelled.')
      load()
    } catch (err) { flash(err.response?.data?.message || 'Failed to cancel') }
  }

  const handleLogout = () => {
    localStorage.removeItem('bq_token')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <div className="bq-app">
      {/* Sidebar */}
      <div className="bq-sidebar-user">
        <div className="bq-sidebar-logo">BananaQue</div>
        <nav style={{ flex: 1, paddingTop: 16 }}>
          <button className="bq-nav-btn active">Dashboard</button>
          <button className="bq-nav-btn" onClick={() => navigate('/history')}>History</button>
        </nav>
      </div>

      {/* Main */}
      <div className="bq-main">
        {/* Topbar */}
        <div className="bq-topbar">
          <span className="bq-topbar-title">BananaQue</span>
          <div style={{ position: 'relative' }}>
            <button className="bq-user-btn" onClick={() => setDropOpen(o => !o)}>
              👤 {user?.name || user?.email}
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
        <div className="bq-content">
          <h2 className="bq-page-title text-center">Dashboard</h2>
          <p className="bq-page-subtitle text-center">Select a queue to join or view your active queues.</p>

          {msg && <div className="bq-flash">{msg}</div>}

          {/* Queue cards */}
          <div className="bq-queue-grid">
            {queues.map(q => {
              const dname = q.department?.name || q.name.replace(' Queue', '')
              const icon  = DEPT_ICONS[dname] || '🏢'
              const avail = q.isActive
              return (
                <button
                  key={q._id}
                  className={`bq-queue-card${joining?._id === q._id ? ' selected' : ''}`}
                  disabled={!avail || !!myEntry}
                  onClick={() => avail && !myEntry && setJoining(q)}
                  style={{ opacity: avail && !myEntry ? 1 : 0.5 }}
                >
                  <span style={{ fontSize: 30, marginBottom: 8 }}>{icon}</span>
                  <div style={{ fontSize: 13, color: '#c5bef0', fontWeight: 500 }}>{dname} Queue</div>
                  {!avail && <div style={{ color: '#e53e3e', fontSize: 11, marginTop: 4 }}>Unavailable</div>}
                </button>
              )
            })}
            <button className="bq-queue-card" onClick={() => navigate('/history')}>
              <span style={{ fontSize: 30, marginBottom: 8 }}>🕐</span>
              <div style={{ fontSize: 13, color: '#c5bef0', fontWeight: 500 }}>View History</div>
            </button>
          </div>

          {/* Join modal */}
          {joining && (
            <div className="bq-join-modal">
              <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 4 }}>
                Join {joining.department?.name || joining.name.replace(' Queue', '')} Queue
              </div>
              <div className="bq-muted mb-3">Fill the details below before joining the queue.</div>
              <div className="mb-3">
                <label className="form-label bq-label">Name</label>
                <input
                  className="form-control bq-input"
                  placeholder="Your name"
                  readOnly
                  value={user?.name || user?.email || ''}
                />
              </div>
              <div className="mb-3">
                <label className="form-label bq-label">Purpose</label>
                <select className="form-control bq-input">
                  <option value="">Select a purpose</option>
                  <option>Payment</option>
                  <option>Inquiry</option>
                  <option>Consultation</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="d-flex gap-2">
                <button className="bq-yellow-btn flex-fill" onClick={() => join(joining)}>Join Queue</button>
                <button className="bq-ghost-btn flex-fill" onClick={() => setJoining(null)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Active queue */}
          <h3 style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginTop: 32, marginBottom: 12, textAlign: 'center' }}>
            Your Active Queues
          </h3>
          {!myEntry
            ? <p className="bq-muted text-center">No active queues. Select one above to join.</p>
            : (
              <div className="bq-entry-card">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 22, color: '#fff' }}>#{myEntry.queueNumber}</div>
                    <div className="bq-muted mt-1" style={{ fontSize: 13 }}>
                      Service:{' '}
                      <b style={{ color: '#f5a623' }}>
                        {myEntry.queue?.name?.replace(' Queue', '') || '—'}
                      </b>
                    </div>
                  </div>
                  <StatusBadge status={myEntry.status} />
                </div>
                <button className="bq-cancel-btn w-100 mt-3" onClick={cancel}>
                  Cancel Queue
                </button>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}

export default UserDashboard