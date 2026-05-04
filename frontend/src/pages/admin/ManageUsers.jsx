import React, { useState, useEffect, useCallback } from 'react'
import api from '../../lib/axios'
import AdminLayout from '../../components/AdminLayout'
import '../../styles/admin.css'

const DEPT_ICONS = { Cashier: '💰', Clinic: '🏥', Auditing: '📋' }

const ManageUsers = () => {
  const [users,  setUsers]  = useState([])
  const [depts,  setDepts]  = useState([])
  const [tab,    setTab]    = useState('all')
  const [form,   setForm]   = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'staff', departmentId: ''
  })
  const [toast,  setToast]  = useState(null)
  const [busy,   setBusy]   = useState(false)

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3500) }

  const load = useCallback(async () => {
    try {
      // Fetch staff, admins (may be same endpoint returning all), and departments
      const results = await Promise.allSettled([
        api.get('/admin/staff'),
        api.get('/admin/admins'),
        api.get('/admin/departments'),
      ])
      const staffData  = results[0].status === 'fulfilled' && Array.isArray(results[0].value.data) ? results[0].value.data : []
      const adminData  = results[1].status === 'fulfilled' && Array.isArray(results[1].value.data) ? results[1].value.data : []
      const deptsData  = results[2].status === 'fulfilled' && Array.isArray(results[2].value.data) ? results[2].value.data : []

      // Merge and deduplicate by _id
      const merged = [...staffData]
      adminData.forEach(a => { if (!merged.find(x => x._id === a._id)) merged.push(a) })
      setUsers(merged)
      setDepts(deptsData)
    } catch (err) { console.error(err) }
  }, [])

  useEffect(() => { load() }, [load])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const createUser = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password)
      return showToast('Username, email and password are required')
    if (form.password !== form.confirmPassword)
      return showToast('Passwords do not match')
    if (form.password.length < 6)
      return showToast('Password must be at least 6 characters')
    setBusy(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        departmentId: form.departmentId || undefined,
      }
      const res = await api.post('/admin/staff', payload)
      showToast(`Account for ${res.data.name || res.data.email} created!`)
      setForm({ name: '', email: '', password: '', confirmPassword: '', role: 'staff', departmentId: '' })
      load()
      setTab('all')
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating account')
    } finally { setBusy(false) }
  }



  return (
    <AdminLayout title="👥 Manage Users">
      {/* Tabs */}
      <div className="bq-tab-row">
        <button
          className={`bq-tab-btn${tab === 'all' ? ' active' : ''}`}
          onClick={() => setTab('all')}
        >
          All Users
        </button>
        <button
          className={`bq-tab-btn${tab === 'register' ? ' active' : ''}`}
          onClick={() => setTab('register')}
        >
          Register New User
        </button>
      </div>

      {/* ── All Users ── */}
      {tab === 'all' && (
        <>
          <h2 className="bq-page-title">Admin &amp; Staff Accounts</h2>
          <p className="bq-page-subtitle">All admin and staff accounts in the system.</p>

          <div className="bq-table-wrap">
            <table className="bq-table">
              <thead>
                <tr>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>DEPARTMENT</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>{u.email}</td>
                    <td style={{ textTransform: 'capitalize', color: '#a89fd8' }}>{u.role || 'staff'}</td>
                    <td>
                      {u.department?.name
                        ? <span className="bq-dept-pill">{DEPT_ICONS[u.department.name] || '🏢'} {u.department.name}</span>
                        : '—'}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="bq-muted" style={{ textAlign: 'center', padding: '28px 14px' }}>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Register New User ── */}
      {tab === 'register' && (
        <div className="mu-register-wrap">
          <div className="mu-register-card">
            <h2 className="mu-register-title">Register New User</h2>
            <p className="mu-register-sub">Add a new admin or staff member to the system.</p>

            <form onSubmit={createUser}>
              <div className="bq-input-group">
                <label className="bq-label">Username</label>
                <input
                  type="text"
                  className="bq-input"
                  placeholder="Username"
                  required
                  value={form.name}
                  onChange={update('name')}
                />
              </div>
              <div className="bq-input-group">
                <label className="bq-label">Email</label>
                <input
                  type="email"
                  className="bq-input"
                  placeholder="user@example.com"
                  required
                  value={form.email}
                  onChange={update('email')}
                />
              </div>
              <div className="bq-input-group">
                <label className="bq-label">Password</label>
                <input
                  type="password"
                  className="bq-input"
                  placeholder="Min. 6 characters"
                  required
                  value={form.password}
                  onChange={update('password')}
                />
              </div>
              <div className="bq-input-group">
                <label className="bq-label">Confirm Password</label>
                <input
                  type="password"
                  className="bq-input"
                  placeholder="Re-enter password"
                  required
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                />
              </div>
              <div className="bq-input-group">
                <label className="bq-label">Role</label>
                <select className="bq-input" value={form.role} onChange={update('role')}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="bq-input-group">
                <label className="bq-label">Department</label>
                <select className="bq-input" value={form.departmentId} onChange={update('departmentId')}>
                  <option value="">Select department</option>
                  {depts.map(d => (
                    <option key={d._id} value={d._id}>
                      {DEPT_ICONS[d.name] || ''} {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="bq-yellow-btn"
                style={{ width: '100%', marginTop: 4 }}
                disabled={busy}
              >
                {busy ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="bq-toast">
          <span className="bq-toast-icon">✔</span>
          <span>{toast}</span>
        </div>
      )}
    </AdminLayout>
  )
}

export default ManageUsers
