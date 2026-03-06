import React from "react";
import { Link } from "react-router-dom";
import HistoryTable from "../components/HistoryTable";

export default function HistoryPage({ user, error }) {
  return (
    <div className="page">
      {error && <p>{error}</p>}

      {user ? (
        <HistoryTable />
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
  );
}
