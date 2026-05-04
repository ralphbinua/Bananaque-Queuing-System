import React, { useState, useEffect, useCallback } from 'react'
import api from '../../lib/axios'
import AdminLayout from '../../components/AdminLayout'
import '../../styles/admin.css'

const ManageUsers = () => {
  const [customers, setCustomers] = useState([])
  const [staff,     setStaff]     = useState([])
  const [depts,     setDepts]     = useState([])
  const [tab,       setTab]       = useState('customers')
  const [form,      setForm]      = useState({ name: '', email: '', password: '', departmentId: '' })
  const [msg,       setMsg]       = useState('')
  const [busy,      setBusy]      = useState(false)

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const load = useCallback(async () => {
    try {
      const [c, st, d] = await Promise.all([
        api.get('/admin/customers'),
        api.get('/admin/staff'),
        api.get('/admin/departments'),
      ])
      if (Array.isArray(c.data))  setCustomers(c.data)
      if (Array.isArray(st.data)) setStaff(st.data)
      if (Array.isArray(d.data))  setDepts(d.data)
    } catch (err) { console.error(err) }
  }, [])

  useEffect(() => { load() }, [load])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const createStaff = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password || !form.departmentId)
      return flash('All fields are required')
    setBusy(true)
    try {
      const res = await api.post('/admin/staff', form)
      flash(`Staff ${res.data.name} created!`)
      setForm({ name: '', email: '', password: '', departmentId: '' })
      load()
    } catch (err) {
      flash(err.response?.data?.message || 'Error creating staff')
    } finally { setBusy(false) }
  }

  const deleteStaff = async (id) => {
    try { await api.delete(`/admin/staff/${id}`); flash('Staff removed'); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  const TABS = ['customers', 'staff', 'create staff']

  return (
    <AdminLayout title="Manage Users">
      <h2 className="bq-page-title">👥 Manage Users</h2>

      {msg && <div className="bq-flash">{msg}</div>}

      {/* Tab row */}
      <div className="bq-tab-row">
        {TABS.map(t => (
          <button
            key={t}
            className={`bq-tab-btn${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Customers tab */}
      {tab === 'customers' && (
        <>
          <p className="bq-muted mb-3">{customers.length} registered customers</p>
          <div className="bq-table-wrap">
            <table className="bq-table">
              <thead>
                <tr>{['Name', 'Email', 'Registered'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td colSpan={3} className="bq-muted">No customers yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Staff tab */}
      {tab === 'staff' && (
        <>
          <p className="bq-muted mb-3">{staff.length} staff members</p>
          <div className="bq-table-wrap">
            <table className="bq-table">
              <thead>
                <tr>{['Name', 'Email', 'Department', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {staff.map(st => (
                  <tr key={st._id}>
                    <td>{st.name}</td>
                    <td>{st.email}</td>
                    <td>{st.department?.name || '—'}</td>
                    <td>
                      <button className="bq-cancel-btn-sm" onClick={() => deleteStaff(st._id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr><td colSpan={4} className="bq-muted">No staff yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create Staff tab */}
      {tab === 'create staff' && (
        <div style={{ maxWidth: 420 }}>
          <p className="bq-muted mb-3">Create a new staff account and assign to a department.</p>
          <form onSubmit={createStaff}>
            <div className="mb-3">
              <label className="form-label bq-label">Full Name</label>
              <input
                type="text"
                className="form-control bq-input"
                placeholder="Full name"
                required
                value={form.name}
                onChange={update('name')}
              />
            </div>
            <div className="mb-3">
              <label className="form-label bq-label">Email</label>
              <input
                type="email"
                className="form-control bq-input"
                placeholder="staff@email.com"
                required
                value={form.email}
                onChange={update('email')}
              />
            </div>
            <div className="mb-3">
              <label className="form-label bq-label">Password</label>
              <input
                type="password"
                className="form-control bq-input"
                placeholder="Min. 6 characters"
                required
                value={form.password}
                onChange={update('password')}
              />
            </div>
            <div className="mb-3">
              <label className="form-label bq-label">Department</label>
              <select
                className="form-control bq-input"
                required
                value={form.departmentId}
                onChange={update('departmentId')}
              >
                <option value="">Select department</option>
                {depts.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="bq-yellow-btn w-100" disabled={busy}>
              {busy
                ? <><span className="spinner-border spinner-border-sm me-2" />Creating...</>
                : 'Create Staff Account'}
            </button>
          </form>
        </div>
      )}
    </AdminLayout>
  )
}

export default ManageUsers
