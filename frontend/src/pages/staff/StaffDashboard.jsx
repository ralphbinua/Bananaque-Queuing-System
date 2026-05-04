import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import '../../styles/admin.css'
import '../../styles/staff.css'

const DEPT_ICONS = { Cashier: '💰', Clinic: '🏥', Auditing: '📋' }

const StaffDashboard = () => {
  const navigate  = useNavigate()
  const user      = JSON.parse(localStorage.getItem('user') || '{}')

  const [queue,   setQueue]   = useState(null)
  const [entries, setEntries] = useState([])
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [tab,     setTab]     = useState('queue')
  const [msg,     setMsg]     = useState('')
  const [sideNav, setSideNav] = useState('dashboard')
  const [dropOpen, setDropOpen] = useState(false)
  const [toast,   setToast]   = useState(null)
  const [newPass, setNewPass] = useState('')
  const [confPass, setConfPass] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [passBusy, setPassBusy] = useState(false)

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 4000) }

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

  // Polling for live updates
  useEffect(() => {
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
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

  const skip = async (id) => {
    try { await api.post(`/admin/complete/${id}`); showToast('Skipped'); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  const cancelServing = async (id) => {
    const num = current ? `#${String(current.queueNumber).padStart(3, '0')}` : ''
    try { await api.delete(`/admin/entry/${id}`); showToast(`Cancelled ${num}`); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  const remove = async (id) => {
    try { await api.delete(`/admin/entry/${id}`); flash('Cancelled'); load() }
    catch (err) { flash(err.response?.data?.message || 'Error') }
  }

  const handleLogout = () => {
    localStorage.removeItem('bq_token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const changePassword = async () => {
    setPassMsg('')
    if (!newPass || newPass.length < 6) { setPassMsg('Password must be at least 6 characters'); return }
    if (newPass !== confPass) { setPassMsg('Passwords do not match'); return }
    setPassBusy(true)
    try {
      const res = await api.put('/auth/change-password', { newPassword: newPass, confirmPassword: confPass })
      showToast(res.data.message || 'Password updated')
      setNewPass(''); setConfPass('')
    } catch (err) {
      setPassMsg(err.response?.data?.message || 'Failed to update password')
    } finally { setPassBusy(false) }
  }

  const deptName = user?.department?.name || 'Your'
  const icon     = DEPT_ICONS[deptName] || '🏢'

  const inProgressCount = current ? 1 : 0

  return (
    <div className="bq-app">
      {/* ── Sidebar ─────────────────────────── */}
      <div className="staff-sidebar">
        <div className="staff-sidebar-logo">
          <span className="staff-logo-icon">🍌</span>
          <span className="staff-logo-text">BananaQue</span>
        </div>

        <nav className="staff-sidebar-nav">
          <button
            className={`staff-nav-item${sideNav === 'dashboard' ? ' active' : ''}`}
            onClick={() => setSideNav('dashboard')}
          >
            <span className="staff-nav-icon">📊</span>
            Dashboard
          </button>
          <button
            className={`staff-nav-item${sideNav === 'account' ? ' active' : ''}`}
            onClick={() => setSideNav('account')}
          >
            <span className="staff-nav-icon">👤</span>
            My Account
          </button>
        </nav>

        <div className="staff-sidebar-footer">
          v1.0 · BQUE
        </div>
      </div>

      {/* ── Main ────────────────────────────── */}
      <div className="staff-main">

        {/* Topbar */}
        <div className="staff-topbar">
          <div className="staff-topbar-title">
            <span className="staff-topbar-accent"></span>
            {sideNav === 'account'
              ? <span>👤 My Account</span>
              : <span>{icon} {deptName} — Staff</span>
            }
          </div>
          <div style={{ position: 'relative' }}>
            <button
              className="bq-user-btn"
              onClick={() => setDropOpen(o => !o)}
            >
              👤 {user?.name || user?.email || 'Staff'}
              <span style={{ fontSize: 10, color: '#a89fd8' }}>▼</span>
            </button>

            {dropOpen && (
              <div className="bq-dropdown">
                <div className="bq-dropdown-header">
                  <div className="bq-dropdown-name">{user?.name || 'Staff'}</div>
                  <div className="bq-dropdown-email">{user?.email}</div>
                </div>
                <button
                  className="bq-dropdown-btn"
                  onClick={() => { setDropOpen(false); handleLogout() }}
                >
                  ↪ Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="staff-content">

          {msg && <div className="bq-flash">{msg}</div>}

          {/* ── Dashboard View ────────────── */}
          {sideNav === 'dashboard' && (
            <>
              {/* Tabs */}
              <div className="staff-tabs">
                <button
                  className={`staff-tab${tab === 'queue' ? ' active' : ''}`}
                  onClick={() => setTab('queue')}
                >
                  Queue Management
                </button>
                <button
                  className={`staff-tab${tab === 'history' ? ' active' : ''}`}
                  onClick={() => setTab('history')}
                >
                  History
                </button>
              </div>

              {/* ── Queue Management Tab ──── */}
              {tab === 'queue' && (
                <>
                  {/* Now Serving Card */}
                  <div className="staff-serving-card">
                    <div className="staff-serving-top">
                      <div className="staff-serving-info">
                        <div className="staff-serving-label">
                          <span className={`staff-dot${current ? ' active' : ''}`}></span>
                          NOW SERVING
                        </div>
                        {current ? (
                          <div className="staff-serving-detail">
                            <span className="staff-serving-big-number">
                              #{String(current.queueNumber).padStart(3, '0')}
                            </span>
                            <div className="staff-serving-meta">
                              <div className="staff-serving-email">
                                {current.customer?.email || current.customer?.name || '—'}
                              </div>
                              <div className="staff-serving-sub">
                                {deptName} · Called at {new Date(current.updatedAt || current.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="staff-serving-name">
                            No one being served
                          </div>
                        )}
                      </div>
                      <div className="staff-serving-buttons">
                        {current ? (
                          <>
                            <button
                              className="staff-call-btn"
                              onClick={() => complete(current._id)}
                            >
                              ✓ Complete
                            </button>
                            <button
                              className="staff-cancel-serving-btn"
                              onClick={() => cancelServing(current._id)}
                            >
                              ✗ Cancel
                            </button>
                          </>
                        ) : (
                          <button className="staff-call-btn" onClick={callNext}>
                            📢 Call Next
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="staff-serving-stats">
                      <div className="staff-stat">
                        <div className="staff-stat-value">{entries.length}</div>
                        <div className="staff-stat-label">WAITING</div>
                      </div>
                      <div className="staff-stat-divider"></div>
                      <div className="staff-stat">
                        <div className="staff-stat-value">{inProgressCount}</div>
                        <div className="staff-stat-label">IN PROGRESS</div>
                      </div>
                    </div>
                  </div>

                  {/* Waiting List */}
                  <div className="staff-waiting-header">
                    <h3 className="staff-waiting-title">Waiting List</h3>
                    <span className="staff-queue-count">
                      {entries.length} in queue
                    </span>
                  </div>

                  <div className="staff-waiting-list">
                    {entries.length === 0 ? (
                      <div className="staff-clear-card">
                        <span className="staff-clear-icon">✅</span>
                        <span className="staff-clear-text">Queue is clear</span>
                      </div>
                    ) : (
                      entries.map((e, idx) => (
                        <div className="staff-waiting-item" key={e._id}>
                          <div className="staff-waiting-left">
                            <span className="staff-position">
                              #{idx + 1}
                            </span>
                            <span className="staff-q-number">
                              {String(e.queueNumber).padStart(3, '0')}
                            </span>
                            <div className="staff-customer-info">
                              <div className="staff-customer-email">
                                {e.customer?.email || e.customer?.name || '—'}
                              </div>
                              <div className="staff-customer-time">
                                Joined at {new Date(e.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <div className="staff-waiting-actions">
                            <button className="staff-skip-btn" onClick={() => skip(e._id)}>
                              Skip
                            </button>
                            <button className="staff-cancel-btn" onClick={() => remove(e._id)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* ── History Tab ──────────── */}
              {tab === 'history' && (
                <>
                  <h3 className="staff-section-title">Transaction History</h3>
                  {history.length === 0 ? (
                    <div className="staff-empty">No history yet.</div>
                  ) : (
                    <div className="bq-table-wrap">
                      <table className="bq-table">
                        <thead>
                          <tr>
                            {['#', 'Customer', 'Status', 'Date'].map(h =>
                              <th key={h}>{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {history.map(e => (
                            <tr key={e._id}>
                              <td>
                                <b style={{ color: '#f5a623' }}>#{e.queueNumber}</b>
                              </td>
                              <td>{e.customer?.email || '—'}</td>
                              <td>
                                <span className={`bq-badge bq-badge-${e.status}`}>
                                  {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                                </span>
                              </td>
                              <td>{new Date(e.updatedAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── My Account View ───────────── */}
          {sideNav === 'account' && (
            <div className="staff-account-wrapper">
              {/* Account Information */}
              <div className="staff-account-card">
                <h3 className="staff-section-title">Account Information</h3>
                <div className="staff-account-field">
                  <div className="staff-field-label">Email</div>
                  <div className="staff-field-value">{user?.email || '—'}</div>
                </div>
                <div className="staff-account-field">
                  <div className="staff-field-label">Role</div>
                  <div className="staff-field-value" style={{ textTransform: 'capitalize' }}>
                    {user?.role || 'staff'}
                  </div>
                </div>
                <div className="staff-account-field">
                  <div className="staff-field-label">Department</div>
                  <div className="staff-field-value">{icon} {deptName}</div>
                </div>
              </div>

              {/* Change Password */}
              <div className="staff-account-card">
                <h3 className="staff-section-title">Change Password</h3>

                {passMsg && (
                  <div style={{
                    background: 'rgba(229,115,115,0.12)',
                    border: '1px solid #e57373',
                    borderRadius: 8,
                    color: '#e57373',
                    fontSize: 13,
                    padding: '8px 12px',
                    marginBottom: 14,
                  }}>{passMsg}</div>
                )}

                <div className="staff-pass-field">
                  <label className="staff-pass-label">New Password</label>
                  <input
                    type="password"
                    className="staff-pass-input"
                    placeholder="Min. 6 characters"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                  />
                </div>
                <div className="staff-pass-field">
                  <label className="staff-pass-label">Confirm Password</label>
                  <input
                    type="password"
                    className="staff-pass-input"
                    placeholder="Re-enter password"
                    value={confPass}
                    onChange={e => setConfPass(e.target.value)}
                  />
                </div>
                <button
                  className="staff-update-pass-btn"
                  onClick={changePassword}
                  disabled={passBusy}
                >
                  {passBusy ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Toast Notification ──────────── */}
      {toast && (
        <div className="staff-toast">
          <span className="staff-toast-icon">✔</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}

export default StaffDashboard
