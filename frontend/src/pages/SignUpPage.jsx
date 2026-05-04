import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "../styles/SignUpPage.css";
import api from '../lib/axios'

const SignUpPage = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents page reload

    if (!form.name || !form.email || !form.password || !form.confirm) {
      return setMsg('Please fill in all fields.')
    }
    if (form.password !== form.confirm) {
      return setMsg('Passwords do not match.')
    }

    setBusy(true)
    setMsg('')

    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      })

      // Backend returns { token, user }
      localStorage.setItem('bq_token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setMsg(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bq-page">
      <div className="bq-card">

        {/* Header */}
        <div className="text-center mb-4">
          <h1
            className="fw-bold mb-1"
            style={{ fontSize: 26, color: '#ffffff', letterSpacing: 0.5 }}
          >
            BananaQue
          </h1>
          <p className="mb-0" style={{ color: '#a89fd8', fontSize: 13 }}>
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-3">
            <label htmlFor="signup-name" className="form-label bq-label">
              Username
            </label>
            <input
              id="signup-name"
              type="text"
              className="form-control bq-input"
              placeholder="Your username"
              required
              value={form.name}
              onChange={update('name')}
            />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="signup-email" className="form-label bq-label">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              className="form-control bq-input"
              placeholder="you@example.com"
              required
              value={form.email}
              onChange={update('email')}
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="signup-password" className="form-label bq-label">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              className="form-control bq-input"
              placeholder="Min. 6 characters"
              required
              value={form.password}
              onChange={update('password')}
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label htmlFor="signup-confirm" className="form-label bq-label">
              Confirm Password
            </label>
            <input
              id="signup-confirm"
              type="password"
              className="form-control bq-input"
              placeholder="••••••"
              required
              value={form.confirm}
              onChange={update('confirm')}
            />
          </div>

          {/* Error alert */}
          {msg && (
            <div className="alert py-2 px-3 mb-3" role="alert"
              style={{
                background: 'rgba(229,115,115,0.12)',
                border: '1px solid #e57373',
                borderRadius: 8,
                color: '#e57373',
                fontSize: 13,
              }}
            >
              {msg}
            </div>
          )}

          {/* Submit */}
          <button
            id="signup-submit"
            type="submit"
            className="btn bq-btn w-100 py-2 mt-1"
            disabled={busy}
          >
            {busy
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Please wait...</>
              : 'Sign Up'}
          </button>
        </form>

        {/* Switch to login */}
        <div className="text-center mt-4">
          <button
            type="button"
            className="bq-link"
            onClick={() => navigate('/')}
          >
            Already have an account? Sign in
          </button>
        </div>

      </div>
    </div>
  )
}

export default SignUpPage