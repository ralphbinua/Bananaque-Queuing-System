import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import "../styles/SignUpPage.css";

const LogInPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  // Helper to update state
  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);

    try {
      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      // Backend returns { token, user }
      localStorage.setItem("bq_token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const role = res.data.user.role;
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "staff") {
        navigate("/staff/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 400) {
        setMsg(err.response?.data?.message || "Invalid email or password");
      } else {
        setMsg("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

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
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-3">
            <label htmlFor="login-email" className="form-label bq-label">
              Email
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className="form-label bq-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="form-control bq-input"
              placeholder="••••••"
              required
              value={form.password}
              onChange={update('password')}
            />
          </div>

          {/* Error alert */}
          {msg && (
            <div
              className="py-2 px-3 mb-3"
              role="alert"
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
            id="login-submit"
            type="submit"
            className="btn bq-btn w-100 py-2 mt-1"
            disabled={busy}
          >
            {busy ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                Please wait...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Switch to sign up */}
        <div className="text-center mt-4">
          <button
            type="button"
            className="bq-link"
            onClick={() => navigate('/signup')}
          >
            Don't have an account? Register
          </button>
        </div>

      </div>
    </div>
  );
};

export default LogInPage;