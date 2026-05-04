import React, { useState, useEffect, useCallback } from 'react'
import api from '../../lib/axios'
import AdminLayout from '../../components/AdminLayout'
import '../../styles/admin.css'

const DEPT_ICONS = { Cashier: '💰', Clinic: '🏥', Auditing: '📋' }
const FILTERS = ['All', 'Cashier', 'Auditing', 'Clinic']

function StatusBadge({ status }) {
  return (
    <span className={`bq-badge bq-badge-${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const MonitorTransactions = () => {
  const [entries,   setEntries]   = useState([])
  const [filter,    setFilter]    = useState('All')
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch all queues, then entries for each
      const qRes = await api.get('/queues')
      if (!Array.isArray(qRes.data)) return

      const allEntries = []
      await Promise.all(
        qRes.data.map(async (q) => {
          try {
            const hRes = await api.get(`/entries/queue/${q._id}/history`)
            if (Array.isArray(hRes.data)) {
              hRes.data.forEach(e => allEntries.push({ ...e, _dept: q.department?.name }))
            }
            // also fetch active entries
            const eRes = await api.get(`/entries/queue/${q._id}`)
            if (Array.isArray(eRes.data)) {
              eRes.data.forEach(e => {
                if (!allEntries.find(x => x._id === e._id)) {
                  allEntries.push({ ...e, _dept: q.department?.name })
                }
              })
            }
          } catch (_) {}
        })
      )

      // Sort newest first
      allEntries.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      setEntries(allEntries)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'All'
    ? entries
    : entries.filter(e => e._dept === filter)

  return (
    <AdminLayout title="📊 Monitor Transactions">
      <h2 className="bq-page-title">All Transactions</h2>
      <p className="bq-page-subtitle">View all queue transactions across departments.</p>

      {/* Filter tabs */}
      <div className="bq-filter-tabs">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`bq-filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f !== 'All' && <span>{DEPT_ICONS[f] || '🏢'}</span>}
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="bq-muted">Loading transactions...</p>
      ) : (
        <div className="bq-table-wrap">
          <table className="bq-table">
            <thead>
              <tr>
                <th>#</th>
                <th>NAME</th>
                <th>DEPARTMENT</th>
                <th>STATUS</th>
                <th>DATE</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e._id}>
                  <td>
                    <b style={{ color: '#f5a623' }}>
                      {String(e.queueNumber).padStart(3, '0')}
                    </b>
                  </td>
                  <td>{e.customer?.name || e.customer?.email || '—'}</td>
                  <td>
                    <span className="bq-dept-pill">
                      {DEPT_ICONS[e._dept] || '🏢'} {e._dept || '—'}
                    </span>
                  </td>
                  <td><StatusBadge status={e.status} /></td>
                  <td style={{ color: '#a89fd8', fontSize: 12 }}>
                    {new Date(e.updatedAt || e.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="bq-muted" style={{ textAlign: 'center', padding: '28px 14px' }}>
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}

export default MonitorTransactions
