import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function LoginPage({ setUser }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API || "http://localhost:3000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, form);

      setUser(res.data.user);
      navigate("/summary");
    } catch {
      setError("Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page page">
      <div className="auth-card card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-title">Sign In</h2>

          {error && <p className="auth-error">{error}</p>}

          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="input"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="input"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <div className="actions">
            <button className="btn primary auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </div>

          <p className="auth-switch">
            New here?{" "}
            <Link className="auth-link" to="/register">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
