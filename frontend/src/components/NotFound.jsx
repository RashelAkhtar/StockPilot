import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="not-found page">
      <div className="not-found-card card">
        <h2 className="not-found-title">404</h2>
        <p className="not-found-text">Page not found.</p>
        <Link className="btn primary" to="/">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
