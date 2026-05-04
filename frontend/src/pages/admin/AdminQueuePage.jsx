import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../lib/axios'
import AdminLayout from '../../components/AdminLayout'
import '../../styles/admin.css'

const DEPT_ICONS = { Cashier: '💰', Clinic: '🏥', Auditing: '📋' }
const toTitle = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

function StatusBadge({ status }) {
  return (
    <span className={`bq-badge bq-badge-${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const AdminQueuePage = () => {
  const { dept }   = useParams()
  const deptName   = toTitle(dept || '')
  const icon       = DEPT_ICONS[deptName] || '🏢'

  const [tab,     setTab]     = useState('queue')
  const [queue,   setQueue]   = useState(null)
  const [entries, setEntries] = useState([])
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [toast,   setToast]   = useState(null)
  const [msg,     setMsg]     = useState('')

  const flash     = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 4000) }

  const load = useCallback(async () => {
    try {
      const res = await api.get('/queues')
      if (!Array.isArray(res.data)) return
      const q = res.data.find(x => x.department?.name === deptName)
      if (!q) return
      setQueue(q)
      const eRes = await api.get(`/entries/queue/${q._id}`)
      if (Array.isArray(eRes.data)) {
        setEntries(eRes.data.filter(x => x.status === 'waiting'))
        setCurrent(eRes.data.find(x => x.status === 'called' || x.status === 'serving') || null)
      }
      try {
        const hRes = await api.get(`/entries/queue/${q._id}/history`)
        if (Array.isArray(hRes.data)) setHistory(hRes.data)
      } catch (_) {}
    } catch (err) { console.error(err) }
  }, [deptName])

  useEffect(() => { load() }, [load])

  // Poll every 5s
  useEffect(() => {
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [load])

  const callNext = async () => {
    if (!queue) return
    try {
      const res = await api.post(`/admin/call-next/${queue._id}`)
      const num = res.data.currentNumber ? `#${String(res.data.currentNumber).padStart(3, '0')}` : ''
      showToast(`Now serving ${num}`)
      load()
    } catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  const complete = async (id) => {
    const num = current ? `#${String(current.queueNumber).padStart(3, '0')}` : ''
    try { await api.post(`/admin/complete/${id}`); showToast(`Completed ${num}`); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  const cancelServing = async (id) => {
    const num = current ? `#${String(current.queueNumber).padStart(3, '0')}` : ''
    try { await api.delete(`/admin/entry/${id}`); showToast(`Cancelled ${num}`); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  const skip = async (id) => {
    try { await api.post(`/admin/complete/${id}`); showToast('Skipped'); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  const remove = async (id) => {
    try { await api.delete(`/admin/entry/${id}`); flash('Cancelled'); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  const inProgressCount = current ? 1 : 0

  return (
    <AdminLayout title={`${icon} ${deptName} Queue`}>
      {msg && <div className="bq-flash">{msg}</div>}

      {/* Tabs */}
      <div className="bq-tab-row">
        <button
          className={`bq-tab-btn${tab === 'queue' ? ' active' : ''}`}
          onClick={() => setTab('queue')}
        >
          Queue Management
        </button>
        <button
          className={`bq-tab-btn${tab === 'history' ? ' active' : ''}`}
          onClick={() => setTab('history')}
        >
          History
        </button>
      </div>

      {/* ── Queue Management Tab ── */}
      {tab === 'queue' && (
        <>
          {/* Now Serving Card */}
          <div className="bq-serving-card">
            <div className="bq-serving-top">
              <div className="bq-serving-info">
                <div className="bq-serving-label">
                  <span className={`bq-serving-dot${current ? ' active' : ''}`} />
                  NOW SERVING
                </div>
                {current ? (
                  <div className="bq-serving-detail">
                    <span className="bq-serving-big-number">
                      #{String(current.queueNumber).padStart(3, '0')}
                    </span>
                    <div className="bq-serving-meta">
                      <div className="bq-serving-email">
                        {current.customer?.email || current.customer?.name || '—'}
                      </div>
                      <div className="bq-serving-sub">
                        {deptName} · Called at {new Date(current.updatedAt || current.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bq-serving-idle">No one being served</div>
                )}
              </div>

              <div className="bq-serving-buttons">
                {current ? (
                  <>
                    <button className="bq-complete-btn" onClick={() => complete(current._id)}>
                      ✓ Complete
                    </button>
                    <button className="bq-cancel-serving-btn" onClick={() => cancelServing(current._id)}>
                      ✗ Cancel
                    </button>
                  </>
                ) : (
                  <button className="bq-yellow-btn" onClick={callNext}>
                    📢 Call Next
                  </button>
                )}
              </div>
            </div>

            <div className="bq-serving-stats">
              <div className="bq-stat">
                <div className="bq-stat-value">{entries.length}</div>
                <div className="bq-stat-label">WAITING</div>
              </div>
              <div className="bq-stat-divider" />
              <div className="bq-stat">
                <div className="bq-stat-value">{inProgressCount}</div>
                <div className="bq-stat-label">IN PROGRESS</div>
              </div>
            </div>
          </div>

          {/* Waiting List */}
          <div className="bq-waiting-header">
            <h3 className="bq-waiting-title">Waiting List</h3>
            <span className="bq-queue-count">{entries.length} in queue</span>
          </div>

          <div className="bq-waiting-list">
            {entries.length === 0 ? (
              <div className="bq-clear-card">
                <span className="bq-clear-icon">✅</span>
                <span className="bq-clear-text">Queue is clear</span>
              </div>
            ) : (
              entries.map((e, idx) => (
                <div className="bq-waiting-item" key={e._id}>
                  <div className="bq-waiting-left">
                    <span className="bq-position">#{idx + 1}</span>
                    <span className="bq-q-number">{String(e.queueNumber).padStart(3, '0')}</span>
                    <div className="bq-customer-info">
                      <div className="bq-customer-email">{e.customer?.email || e.customer?.name || '—'}</div>
                      <div className="bq-customer-time">
                        Joined at {new Date(e.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="bq-waiting-actions">
                    <button className="bq-skip-btn" onClick={() => skip(e._id)}>Skip</button>
                    <button className="bq-cancel-btn-sm" onClick={() => remove(e._id)}>Cancel</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── History Tab ── */}
      {tab === 'history' && (
        <>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 14 }}>
            Transaction History
          </h3>
          {history.length === 0 ? (
            <div className="bq-empty">No history yet.</div>
          ) : (
            <div className="bq-table-wrap">
              <table className="bq-table">
                <thead>
                  <tr>
                    {['#', 'Customer', 'Status', 'Date'].map(h => <th key={h}>{h}</th>)}
                  </tr>
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
          )}
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="bq-toast">
          <span className="bq-toast-icon">✔</span>
          <span>{toast}</span>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminQueuePage
