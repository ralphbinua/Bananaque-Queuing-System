import React, { useState, useEffect, useCallback } from 'react'
import api from '../../lib/axios'
import AdminLayout from '../../components/AdminLayout'
import '../../styles/admin.css'

const ManageService = () => {
  const [queues, setQueues] = useState([])
  const [msg,    setMsg]    = useState('')

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const load = useCallback(async () => {
    try {
      const res = await api.get('/queues')
      if (Array.isArray(res.data)) setQueues(res.data)
    } catch (err) { console.error(err) }
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (q) => {
    try {
      await api.put(`/queues/${q._id}`, { isActive: !q.isActive })
      flash(`${q.department?.name} queue ${!q.isActive ? 'enabled' : 'disabled'}`)
      load()
    } catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  const reset = async (q) => {
    try {
      await api.post(`/queues/${q._id}/reset`)
      flash(`${q.department?.name} queue reset`)
      load()
    } catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  const DEPT_ICONS = { Cashier: '👥', Clinic: '🏥', Auditing: '📋' }

  return (
    <AdminLayout title="Manage Service">
      <h2 className="bq-page-title">⚙️ Manage Service</h2>
      <p className="bq-page-subtitle">Enable or disable department queues.</p>

      {msg && <div className="bq-flash">{msg}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {queues.map(q => {
          const dname = q.department?.name || 'Queue'
          return (
            <div key={q._id} className="bq-serving-card" style={{ marginBottom: 0 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>
                  {DEPT_ICONS[dname] || '🏢'} {dname}
                </div>
                <div className="bq-muted mt-1" style={{ fontSize: 12 }}>
                  Status:{' '}
                  <b style={{ color: q.isActive ? '#4caf50' : '#e53e3e' }}>
                    {q.isActive ? 'Active' : 'Disabled'}
                  </b>
                  &nbsp;|&nbsp; Current: #{q.currentNumber}
                  &nbsp;|&nbsp; Next: #{q.nextNumber}
                </div>
              </div>
              <div className="d-flex gap-2">
                <button className="bq-ghost-btn" style={{ fontSize: 12 }} onClick={() => reset(q)}>
                  Reset
                </button>
                <button
                  className="bq-ghost-btn"
                  style={{
                    fontSize: 12,
                    borderColor: q.isActive ? '#e53e3e' : '#4caf50',
                    color:       q.isActive ? '#e53e3e' : '#4caf50',
                  }}
                  onClick={() => toggle(q)}
                >
                  {q.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          )
        })}
        {queues.length === 0 && <p className="bq-muted">No queues found.</p>}
      </div>
    </AdminLayout>
  )
}

export default ManageService
