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

const StaffDashboard = () => {
  const navigate  = useNavigate()
  const user      = JSON.parse(localStorage.getItem('user') || '{}')

  const [queue,   setQueue]   = useState(null)
  const [entries, setEntries] = useState([])
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [tab,     setTab]     = useState('queue')
  const [msg,     setMsg]     = useState('')

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const load = useCallback(async () => {
    try {
      const qRes = await api.get('/queues')
      if (!Array.isArray(qRes.data)) return
      const deptName = user?.department?.name
      const q = qRes.data.find(x => x.department?.name === deptName) || qRes.data[0]
      if (!q) return
      setQueue(q)
      const eRes = await api.get(`/entries/queue/${q._id}`)
      if (Array.isArray(eRes.data)) {
        setEntries(eRes.data.filter(x => x.status === 'waiting'))
        setCurrent(eRes.data.find(x => x.status === 'called' || x.status === 'serving') || null)
      }
      const hRes = await api.get(`/entries/queue/${q._id}/history`)
      if (Array.isArray(hRes.data)) setHistory(hRes.data)
    } catch (err) { console.error(err) }
  }, [user?.department?.name])

  useEffect(() => { load() }, [load])

  const callNext = async () => {
    if (!queue) return
    try { const res = await api.post(`/admin/call-next/${queue._id}`); flash(res.data.message || 'Called next'); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }
  const complete = async (id) => {
    try { await api.post(`/admin/complete/${id}`); flash('Completed'); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }
  const remove = async (id) => {
    try { await api.delete(`/admin/entry/${id}`); flash('Removed'); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  const handleLogout = () => {
    localStorage.removeItem('bq_token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const deptName = user?.department?.name || 'Your'
  const icon     = DEPT_ICONS[deptName] || '🏢'

  return (
    <div className="bq-app">
      {/* Sidebar */}
      <div className="bq-sidebar-user">
        <div className="bq-sidebar-logo">BananaQue</div>
        <nav style={{ flex: 1, paddingTop: 16 }}>
          <button className="bq-nav-btn active">Dashboard</button>
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #3b3475' }}>
          <button
            className="bq-nav-btn"
            style={{ color: '#e57373', padding: 0 }}
            onClick={handleLogout}
          >
            ↪ Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="bq-main">
        <div className="bq-topbar">
          <span className="bq-topbar-title">BananaQue</span>
        </div>

        <div className="bq-content">
          <h2 className="bq-page-title">{icon} {deptName} — Staff</h2>

          {msg && <div className="bq-flash">{msg}</div>}

          {/* Tabs */}
          <div className="bq-tab-row">
            {['queue', 'history'].map(t => (
              <button
                key={t}
                className={`bq-tab-btn${tab === t ? ' active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'queue' ? 'Queue Management' : 'History'}
              </button>
            ))}
          </div>

          {/* Queue Management tab */}
          {tab === 'queue' && (
            <>
              <div className="bq-serving-card">
                <div>
                  <div className="bq-muted" style={{ fontSize: 12 }}>Currently Serving</div>
                  {current
                    ? <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>
                        #{String(current.queueNumber).padStart(3, '0')}{' '}
                        <span className="bq-muted" style={{ fontSize: 14, fontWeight: 400 }}>
                          {current.customer?.email}
                        </span>
                      </div>
                    : <div style={{ fontSize: 18, color: '#4a4080', fontWeight: 700 }}>No one serving</div>
                  }
                </div>
                <div className="bq-muted">{entries.length} waiting</div>
              </div>

              <div className="d-flex gap-2 mb-4">
                <button
                  className="bq-ghost-btn flex-fill"
                  onClick={() => current && complete(current._id)}
                  disabled={!current}
                >
                  ✓ Complete
                </button>
                <button className="bq-yellow-btn flex-fill" onClick={callNext}>
                  Serve Next
                </button>
              </div>

              <h3 style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 12 }}>
                Waiting List
              </h3>
              {entries.length === 0
                ? <p className="bq-muted">No customers waiting.</p>
                : (
                  <div className="bq-table-wrap">
                    <table className="bq-table">
                      <thead>
                        <tr>{['#', 'Email', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {entries.map(e => (
                          <tr key={e._id}>
                            <td><b style={{ color: '#f5a623' }}>{String(e.queueNumber).padStart(3, '0')}</b></td>
                            <td>{e.customer?.email || '—'}</td>
                            <td><StatusBadge status={e.status} /></td>
                            <td><button className="bq-cancel-btn-sm" onClick={() => remove(e._id)}>Cancel</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </>
          )}

          {/* History tab */}
          {tab === 'history' && (
            <>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 12 }}>
                Transaction History
              </h3>
              {history.length === 0
                ? <p className="bq-muted">No history yet.</p>
                : (
                  <div className="bq-table-wrap">
                    <table className="bq-table">
                      <thead>
                        <tr>{['#', 'Customer', 'Status', 'Date'].map(h => <th key={h}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {history.map(e => (
                          <tr key={e._id}>
                            <td><b style={{ color: '#f5a623' }}>#{e.queueNumber}</b></td>
                            <td>{e.customer?.email || '—'}</td>
                            <td><StatusBadge status={e.status} /></td>
                            <td>{new Date(e.updatedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard
