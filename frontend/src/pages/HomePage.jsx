import React from "react";
import { Link } from "react-router-dom";
import "../styles/Landing.css";

export default function HomePage({ user }) {
  const gallery = [
    {
      title: "Track Every Product",
      image:
        "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Record Sales Faster",
      image:
        "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Monitor Performance",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  return (
    <div className="landing-page">
      <section className="landing-hero card">
        <div className="landing-hero-content">
          <p className="landing-eyebrow">Inventory + Sales Intelligence</p>
          <h1 className="landing-title">Run your business from one clean dashboard</h1>
          <p className="landing-subtitle">
            StockPilot helps you manage inventory, record sales orders, and track
            profit trends with real-time visibility.
          </p>

          <div className="landing-cta">
            {user ? (
              <Link className="btn primary" to="/summary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link className="btn" to="/login">
                  Login
                </Link>
                <Link className="btn primary" to="/register">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="landing-stats">
            <div>
              <strong>Live KPIs</strong>
              <span>Revenue, profit, units sold</span>
            </div>
            <div>
              <strong>Order History</strong>
              <span>Customer + item-level details</span>
            </div>
            <div>
              <strong>Smart Input</strong>
              <span>Comma-friendly number handling</span>
            </div>
          </div>
        </div>

        <div className="landing-hero-media">
          <img
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80"
            alt="Business team reviewing dashboard analytics"
          />
        </div>
      </section>

      <section className="landing-info">
        <article className="landing-info-card card">
          <h3>Product Management</h3>
          <p>
            Add products, update quantity automatically, maintain buying price,
            and receive low-stock alerts before inventory runs out.
          </p>
        </article>
        <article className="landing-info-card card">
          <h3>Sales Workflow</h3>
          <p>
            Build multi-item carts, capture customer details, validate stock,
            and record orders atomically to keep data consistent.
          </p>
        </article>
        <article className="landing-info-card card">
          <h3>Business Analytics</h3>
          <p>
            Visualize top and least sold products, time-based trends, and
            profitability from a single summary workspace.
          </p>
        </article>
      </section>

      <section className="landing-workflow card">
        <h2>How it works</h2>
        <div className="landing-steps">
          <div>
            <span>01</span>
            <p>Create your account and add product inventory.</p>
          </div>
          <div>
            <span>02</span>
            <p>Record daily sales with customer and pricing details.</p>
          </div>
          <div>
            <span>03</span>
            <p>Use summary cards, charts, and history to drive decisions.</p>
          </div>
        </div>
      </section>

      <section className="landing-gallery">
        {gallery.map((item) => (
          <article key={item.title} className="landing-gallery-item card">
            <img src={item.image} alt={item.title} loading="lazy" />
            <h4>{item.title}</h4>
          </article>
        ))}
      </section>
    </div>
  );
}
