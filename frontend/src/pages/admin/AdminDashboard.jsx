import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import AdminLayout from '../../components/AdminLayout'
import '../../styles/admin.css'

const DEPT_ICONS = { Cashier: '💰', Clinic: '🏥', Auditing: '📋' }

const AdminDashboard = () => {
  const navigate  = useNavigate()
  const [overview, setOverview] = useState([])

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/overview')
      if (Array.isArray(res.data)) setOverview(res.data)
    } catch (err) { console.error(err) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <AdminLayout title="BananaQue — Admin">
      {/* Management section */}
      <h2 className="bq-page-title">Management</h2>
      <p className="bq-page-subtitle">Administrative tools and settings.</p>

      <div className="bq-mgmt-grid">
        <div
          id="admin-card-users"
          className="bq-mgmt-card"
          onClick={() => navigate('/admin/users')}
        >
          <span style={{ fontSize: 26 }}>👥</span>
          <div className="bq-mgmt-card-title">Manage Users</div>
          <div className="bq-mgmt-card-desc">Register new accounts and view all users</div>
          <div className="bq-mgmt-card-action">Manage →</div>
        </div>

        <div
          id="admin-card-service"
          className="bq-mgmt-card"
          onClick={() => navigate('/admin/service')}
        >
          <span style={{ fontSize: 26 }}>⚙️</span>
          <div className="bq-mgmt-card-title">Manage Service</div>
          <div className="bq-mgmt-card-desc">Enable or disable department services</div>
          <div className="bq-mgmt-card-action">Configure →</div>
        </div>

        <div
          id="admin-card-monitor"
          className="bq-mgmt-card"
          onClick={() => navigate('/admin/transactions')}
        >
          <span style={{ fontSize: 26 }}>📊</span>
          <div className="bq-mgmt-card-title">Monitor Transaction</div>
          <div className="bq-mgmt-card-desc">View all queue transactions across departments</div>
          <div className="bq-mgmt-card-action">View →</div>
        </div>
      </div>

      {/* Queue Overview */}
      <h3 className="bq-section-title">Queue Overview</h3>
      <p className="bq-page-subtitle">Select a queue to manage.</p>

      {overview.length === 0 ? (
        <p className="bq-muted">Loading queue data...</p>
      ) : (
        <div className="bq-overview-grid">
          {overview.map(q => {
            const dname = q.department?.name || 'Queue'
            const icon  = DEPT_ICONS[dname] || '🏢'
            const slug  = dname.toLowerCase()
            return (
              <div
                key={q._id}
                id={`admin-queue-${slug}`}
                className="bq-overview-card"
                onClick={() => navigate(`/admin/queue/${slug}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#ffffff' }}>{dname}</span>
                  </div>
                  <span className="bq-muted">{q.waitingCount} waiting</span>
                </div>
                <div className="bq-muted" style={{ fontSize: 12, marginTop: 8 }}>
                  Serving:{' '}
                  {q.currentEntry
                    ? `#${String(q.currentEntry.queueNumber ?? q.currentNumber ?? 0).padStart(3, '0')} — ${q.currentEntry.customer?.email ?? ''}`
                    : 'None'}
                </div>
                <div className="bq-mgmt-card-action" style={{ marginTop: 8 }}>Manage →</div>
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminDashboard