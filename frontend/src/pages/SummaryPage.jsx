import React from "react";
import DashboardSummary from "../components/DashboardSummary";
import { Link } from "react-router-dom";

export default function SummaryPage({ user, error }) {
  return (
    <div className="page">
      <div>
        {error && <p>{error}</p>}

        {user ? (
          <DashboardSummary />
        ) : (
          <div className="auth-gate card">
            <h2 className="auth-gate-title">Please log in or register.</h2>
            <div className="auth-gate-actions">
              <Link className="btn" to="/login">Login</Link>
              <Link className="btn primary" to="/register">Register</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
