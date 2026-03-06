import axios from "axios";
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/Header.css";

function Header({ user, setUser }) {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API || "http://localhost:3000";

  const handleLogOut = async () => {
    await axios.post(`${API}/api/auth/logout`);
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="app-header card">
      <div className="brand">
        <h1>
          <NavLink to="/" className="brand-link">
            Business Dashboard
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
    </header>
  );
}

export default Header;
