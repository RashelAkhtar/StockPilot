import React from "react";
import AddRemoveProduct from "../components/AddRemoveProduct";
import ProductTable from "../components/ProductTable";
import { Link } from "react-router-dom";

export default function ProductsPage({ user, error }) {
  return (
    <div className="page">
      {error && <p>{error}</p>}

      {user ? (
        <div>
          <div style={{ display: "grid", gap: 16 }}>
            <AddRemoveProduct />
            <div className="card">
              <ProductTable />
            </div>
          </div>
        </div>
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
