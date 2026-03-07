import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/Header.css";

function Header({ user, setUser }) {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API || "http://localhost:3000";
  const [lowStockItems, setLowStockItems] = useState([]);

  const handleLogOut = async () => {
    await axios.post(`${API}/api/auth/logout`);
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    const fetchLowStock = async () => {
      if (!user) {
        setLowStockItems([]);
        return;
      }

      try {
        const res = await fetch(`${API}/api/product`, { credentials: "include" });
        const json = await res.json();
        const rows = Array.isArray(json) ? json : json.data || [];

        const low = rows
          .map((r) => ({
            productName: r.product_name ?? r.productName ?? "Unknown",
            quantity: Number(r.quantity ?? r.productQty ?? 0),
          }))
          .filter((p) => p.quantity <= 3);

        setLowStockItems(low);
      } catch {
        setLowStockItems([]);
      }
    };

    fetchLowStock();

    const onChanged = () => fetchLowStock();
    window.addEventListener("product:added", onChanged);
    window.addEventListener("product:sold", onChanged);

    const id = setInterval(fetchLowStock, 60000);
    return () => {
      window.removeEventListener("product:added", onChanged);
      window.removeEventListener("product:sold", onChanged);
      clearInterval(id);
    };
  }, [API, user]);

  const lowStockMessage = useMemo(() => {
    if (!lowStockItems.length) return "";
    const preview = lowStockItems
      .slice(0, 3)
      .map((p) => `${p.productName} (${p.quantity})`)
      .join(", ");
    const extra = lowStockItems.length > 3 ? ` +${lowStockItems.length - 3} more` : "";
    return `Stock is about to get empty: ${preview}${extra}.`;
  }, [lowStockItems]);

  return (
    <header className="app-header card">
      {user && lowStockItems.length > 0 && (
        <div className="stock-alert" role="status" aria-live="polite">
          <span className="stock-alert-icon" aria-hidden="true">🔔</span>
          <span>{lowStockMessage}</span>
        </div>
      )}

      <div className="header-main">
        <div className="brand">
          <h1>
            <NavLink to="/" className="brand-link">
              StockPilot
            </NavLink>
          </h1>
        </div>
        <nav className="nav-actions">
          {user ? (
            <>
              <NavLink to="/" className={({ isActive }) => (isActive ? "btn active" : "btn")}>
                Summary
              </NavLink>
              <NavLink to="/products" className={({ isActive }) => (isActive ? "btn active" : "btn")}>
                Products
              </NavLink>
              <NavLink to="/sales" className={({ isActive }) => (isActive ? "btn active" : "btn")}>
                Record Sales
              </NavLink>
              <NavLink to="/history" className={({ isActive }) => (isActive ? "btn active" : "btn")}>
                History
              </NavLink>
              <button className="btn" onClick={handleLogOut}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => (isActive ? "btn active" : "btn")}>
                Login
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => (isActive ? "btn active" : "btn")}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
