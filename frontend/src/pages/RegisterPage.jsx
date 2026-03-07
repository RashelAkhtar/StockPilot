import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function RegisterPage({ setUser }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API || "http://localhost:3000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${API}/api/auth/register`, form);

      setUser(res.data.user);
      navigate("/summary");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page page">
      <div className="auth-card card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-title">Create Account</h2>

          {error && <p className="auth-error">{error}</p>}

          <label htmlFor="register-name">Name</label>
          <input
            id="register-name"
            className="input"
            type="text"
            placeholder="Enter your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            className="input"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            className="input"
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <div className="actions">
            <button className="btn primary auth-submit" type="submit">
              Register
            </button>
          </div>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link className="auth-link" to="/login">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
