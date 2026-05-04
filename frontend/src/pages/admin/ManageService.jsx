import React, { useState, useEffect, useCallback } from 'react'
import api from '../../lib/axios'
import AdminLayout from '../../components/AdminLayout'
import '../../styles/admin.css'

const DEPT_ICONS = { Cashier: '💰', Clinic: '🏥', Auditing: '📋' }

const ManageService = () => {
  const [queues, setQueues] = useState([])
  const [toast,  setToast]  = useState(null)

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3500) }

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
      showToast(`${q.department?.name} ${!q.isActive ? 'enabled' : 'disabled'}`)
      load()
    } catch (err) { showToast(err.response?.data?.message || 'Error') }
  }

  return (
    <AdminLayout title="⚙️ Manage Service">
      <h2 className="bq-page-title">Service Management</h2>
      <p className="bq-page-subtitle">
        Enable or <span style={{ color: '#e57373' }}>disable</span> transaction services for each department.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {queues.map(q => {
          const dname = q.department?.name || 'Queue'
          const icon  = DEPT_ICONS[dname] || '🏢'
          return (
            <div key={q._id} className="bq-toggle-row">
              <div className="bq-toggle-info">
                <span className="bq-toggle-icon">{icon}</span>
                <div>
                  <div className="bq-toggle-name">{dname}</div>
                  <div className="bq-toggle-status">
                    {q.isActive ? 'Accepting transactions' : 'Service disabled'}
                  </div>
                </div>
              </div>
              <label className="bq-toggle-switch">
                <input
                  type="checkbox"
                  checked={!!q.isActive}
                  onChange={() => toggle(q)}
                />
                <span className="bq-toggle-slider" />
              </label>
            </div>
          )
        })}
        {queues.length === 0 && <p className="bq-muted">No services found.</p>}
      </div>

      {toast && (
        <div className="bq-toast">
          <span className="bq-toast-icon">✔</span>
          <span>{toast}</span>
        </div>
      )}
    </AdminLayout>
  )
}

export default ManageService
