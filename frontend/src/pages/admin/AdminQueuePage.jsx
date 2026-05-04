import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../lib/axios'
import AdminLayout from '../../components/AdminLayout'
import '../../styles/admin.css'

const DEPT_ICONS = { Cashier: '👥', Clinic: '🏥', Auditing: '📋' }

// Capitalize first letter of URL param → "cashier" → "Cashier"
const toTitle = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

function StatusBadge({ status }) {
  const map = {
    waiting:   'bq-badge bq-badge-waiting',
    called:    'bq-badge bq-badge-called',
    serving:   'bq-badge bq-badge-serving',
    completed: 'bq-badge bq-badge-completed',
    cancelled: 'bq-badge bq-badge-cancelled',
  }
  const labels = { waiting: 'Waiting', called: 'Called', serving: 'Serving', completed: 'Completed', cancelled: 'Cancelled' }
  return <span className={map[status] || map.waiting}>{labels[status] || status}</span>
}

const AdminQueuePage = () => {
  const { dept }   = useParams()
  const deptName   = toTitle(dept || '')

  const [queue,   setQueue]   = useState(null)
  const [entries, setEntries] = useState([])
  const [current, setCurrent] = useState(null)
  const [msg,     setMsg]     = useState('')

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

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
    } catch (err) { console.error(err) }
  }, [deptName])

  useEffect(() => { load() }, [load])

  const callNext    = async () => {
    if (!queue) return
    try {
      const res = await api.post(`/admin/call-next/${queue._id}`)
      flash(res.data.message || 'Called next')
      load()
    } catch (err) { flash(err.response?.data?.message || 'Error') }
  }
  const complete    = async (id) => {
    try { await api.post(`/admin/complete/${id}`); flash('Marked as completed'); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }
  const remove      = async (id) => {
    try { await api.delete(`/admin/entry/${id}`); flash('Entry removed'); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }
  const toggleQueue = async () => {
    if (!queue) return
    try { await api.put(`/queues/${queue._id}`, { isActive: !queue.isActive }); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  return (
    <AdminLayout title={`${deptName} Queue`}>
      {/* Header row */}
      <div className="d-flex justify-content-between align-items-center mb-1">
        <h2 className="bq-page-title mb-0">
          {DEPT_ICONS[deptName] || '🏢'} {deptName} Queue
        </h2>
        {queue && (
          <button
            className="bq-ghost-btn"
            style={{
              fontSize: 12, padding: '6px 14px',
              borderColor: queue.isActive ? '#e53e3e' : '#4caf50',
              color:       queue.isActive ? '#e53e3e' : '#4caf50',
            }}
            onClick={toggleQueue}
          >
            {queue.isActive ? 'Disable Queue' : 'Enable Queue'}
          </button>
        )}
      </div>

      {msg && <div className="bq-flash">{msg}</div>}

      {/* Serving card */}
      <div className="bq-serving-card">
        <div>
          <div className="bq-muted" style={{ fontSize: 12 }}>Currently Serving</div>
          {current
            ? <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
                #{String(current.queueNumber).padStart(3, '0')}{' '}
                <span className="bq-muted" style={{ fontSize: 13, fontWeight: 400 }}>
                  {current.customer?.email}
                </span>
              </div>
            : <div style={{ fontSize: 16, color: '#4a4080', fontWeight: 600 }}>No one currently serving</div>
          }
        </div>
        <div className="bq-muted">{entries.length} waiting</div>
      </div>

      {/* Action buttons */}
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

      {/* Waiting list */}
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
                    <td>
                      <button className="bq-cancel-btn-sm" onClick={() => remove(e._id)}>Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </AdminLayout>
  )
}

export default AdminQueuePage
