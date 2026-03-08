import React from "react";
import { Link } from "react-router-dom";
import "../styles/Landing.css";

export default function HomePage({ user }) {
  const features = [
    {
      icon: "📦",
      title: "Smart Inventory Management",
      description: "Effortlessly track product quantities, set buying prices, and get instant low-stock alerts. Never run out of bestsellers again.",
      highlights: ["Auto-update quantities", "Real-time stock levels", "Low-stock warnings"],
    },
    {
      icon: "🛒",
      title: "Fast Sales Recording",
      description: "Build flexible multi-item orders in seconds. Capture customer details, handle partial payments, and maintain 100% data integrity.",
      highlights: ["Multi-item carts", "Customer profiles", "Payment tracking"],
    },
    {
      icon: "📊",
      title: "Powerful Business Intelligence",
      description: "Visualize what sells, what doesn't, and where your profit comes from. Make data-driven decisions with interactive dashboards.",
      highlights: ["Profit analytics", "Sales trends", "Product performance"],
    },
  ];

  const highlights = [
    {
      number: "⚡",
      label: "Live KPIs",
      description: "Real-time revenue, profit & units sold",
    },
    {
      number: "📋",
      label: "Complete History",
      description: "Customer & item-level order details",
    },
    {
      number: "🔢",
      label: "Smart Input",
      description: "Comma-friendly number handling",
    },
  ];

  const workflow = [
    {
      step: "01",
      title: "Setup Your Business",
      description: "Create your account and build your product catalog with buying prices and starting inventory.",
    },
    {
      step: "02",
      title: "Record Sales Daily",
      description: "Add customer orders with multiple items, set pricing, and process payments instantly.",
    },
    {
      step: "03",
      title: "Grow with Insights",
      description: "Track profit by product, visualize trends, and optimize your business with actionable data.",
    },
  ];

  const gallery = [
    {
      icon: "📦",
      title: "Complete Inventory Control",
      description: "Add, update, and monitor all your products in one place",
    },
    {
      icon: "🎯",
      title: "Precision Sales Recording",
      description: "Capture every sale with detailed customer and pricing information",
    },
    {
      icon: "📈",
      title: "Actionable Performance Metrics",
      description: "Understand your business with real-time analytics and trends",
    },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero card">
        <div className="landing-hero-content">
          <p className="landing-eyebrow">✨ Inventory + Sales Intelligence</p>
          <h1 className="landing-title">Run your business smarter, not harder</h1>
          <p className="landing-subtitle">
            StockPilot is your all-in-one platform for inventory management, sales tracking, and profit analysis. Get complete visibility into your business in real-time.
          </p>

          <div className="landing-cta">
            {user ? (
              <Link className="btn primary" to="/summary">
                📊 Go to Dashboard
              </Link>
            ) : (
              <>
                <Link className="btn" to="/login">
                  Sign In
                </Link>
                <Link className="btn primary" to="/register">
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          <div className="landing-highlights">
            {highlights.map((item) => (
              <div key={item.label} className="highlight-badge">
                <span className="highlight-number">{item.number}</span>
                <div className="highlight-text">
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-hero-media">
          <img
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80"
            alt="Business team reviewing dashboard analytics"
          />
        </div>
      </section>

      {/* Core Features Section */}
      <section className="landing-features">
        <div className="section-header">
          <h2>Powerful Features Built for You</h2>
          <p>Everything you need to scale your business efficiently</p>
        </div>
        <div className="features-grid">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <ul className="feature-highlights">
                {feature.highlights.map((highlight) => (
                  <li key={highlight}>
                    <span className="check-mark">✓</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing-workflow">
        <div className="section-header">
          <h2>Get Started in 3 Simple Steps</h2>
          <p>From setup to insights, launch your business platform in minutes</p>
        </div>
        <div className="workflow-grid">
          {workflow.map((item, idx) => (
            <div key={item.step} className="workflow-card card">
              <div className="workflow-step-number">{item.step}</div>
              {idx < workflow.length - 1 && <div className="workflow-arrow">→</div>}
              <div className="workflow-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery / Capabilities Section */}
      <section className="landing-capabilities">
        <div className="section-header">
          <h2>Everything at Your Fingertips</h2>
          <p>Manage your entire operation from one intuitive platform</p>
        </div>
        <div className="capabilities-grid">
          {gallery.map((item) => (
            <article key={item.title} className="capability-card card">
              <div className="capability-icon">{item.icon}</div>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-final-cta card">
        <div className="final-cta-content">
          <h2>Ready to Transform Your Business?</h2>
          <p>Join businesses managing their operations smarter with StockPilot</p>
          <div className="final-cta-buttons">
            {user ? (
              <Link className="btn primary" to="/summary">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link className="btn primary" to="/register">
                  Start Free Now
                </Link>
                <Link className="btn" to="/login">
                  Already have an account?
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
