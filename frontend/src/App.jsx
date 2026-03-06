import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import "./styles/Tokens.css";
import "./styles/Base.css";
import "./styles/UI.css";
import "./styles/Animations.css";
import "./styles/Auth.css";

import Header from "./components/Header";
import SummaryPage from "./pages/SummaryPage";
import ProductsPage from "./pages/ProductsPage";
import SalesPage from "./pages/SalesPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./components/NotFound";
import "./styles/HistoryTable.css";

axios.defaults.withCredentials = true;

function App() {
  const API = import.meta.env.VITE_API || "http://localhost:3000";
  const [user, setUser] = useState(null);
  const [error] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API}/api/auth/me`);

        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [API]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <BrowserRouter>
      <div className="app-container">
        <Header user={user} setUser={setUser} />
        <Routes>
          <Route path="/" element={<SummaryPage user={user} error={error} />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <LoginPage setUser={setUser} />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" /> : <RegisterPage setUser={setUser} />}
          />
          <Route path="/products" element={<ProductsPage user={user} error={error} />} />
          <Route path="/sales" element={<SalesPage user={user} error={error} />} />
          <Route path="/history" element={<HistoryPage user={user} error={error} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
