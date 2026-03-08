import { useEffect, useMemo, useState } from "react";
import "../styles/HistoryTable.css";

function HistoryTable() {
  const API = import.meta.env.VITE_API;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date"); // date, amount, profit
  const [filterStatus, setFilterStatus] = useState("all"); // all, paid, partial, unpaid
  const numberFormatter = useMemo(() => new Intl.NumberFormat("en-IN"), []);
  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API}/api/sales/history`, {
          credentials: "include",
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Failed to fetch history");
        }

        const mapped = (Array.isArray(json) ? json : []).map((r) => ({
          orderId: r.order_id,
          customersName: r.customers_name || "Walk-in Customer",
          customersPhone: r.customers_phone || "-",
          createdAt: r.created_at,
          totalProducts: Number(r.total_products || 0),
          orderProfit: Number(r.order_profit || 0),
          totalAmount: Number(r.total_amount || 0),
          amountPaid: Number(r.amount_paid || 0),
          amountDue: Number(r.amount_due || 0),
          items: Array.isArray(r.items)
            ? r.items.map((i) => ({
                productName: i.productName || "Unknown",
                quantity: Number(i.quantity || 0),
                totalProfit: Number(i.totalProfit || 0),
              }))
            : [],
        }));

        setRows(mapped);
      } catch (err) {
        setError(err.message || "Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [API]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    let filtered = rows.filter((row) => {
      if (!q) return true;
      const customer = String(row.customersName || "").toLowerCase();
      const phone = String(row.customersPhone || "").toLowerCase();
      const products = row.items
        .map((i) => String(i.productName || "").toLowerCase())
        .join(" ");
      return customer.includes(q) || phone.includes(q) || products.includes(q);
    });

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((row) => {
        if (filterStatus === "paid") return row.amountDue === 0;
        if (filterStatus === "partial") return row.amountDue > 0 && row.amountPaid > 0;
        if (filterStatus === "unpaid") return row.amountPaid === 0;
        return true;
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "amount") {
        return b.totalAmount - a.totalAmount;
      }
      if (sortBy === "profit") {
        return b.orderProfit - a.orderProfit;
      }
      return 0;
    });
  }, [rows, search, sortBy, filterStatus]);

  const getPaymentStatus = (amountPaid, amountDue, totalAmount) => {
    if (amountDue === 0) return "Paid";
    if (amountPaid === 0) return "Unpaid";
    return "Partial";
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Paid":
        return "status-badge paid";
      case "Unpaid":
        return "status-badge unpaid";
      case "Partial":
        return "status-badge partial";
      default:
        return "status-badge";
    }
  };

  if (loading) return <p className="loading">Loading order history...</p>;
  if (error) return <p className="history-error">{error}</p>;

  return (
    <div className="history-container">
      <div className="history-header-section">
        <div className="history-header-content">
          <div>
            <h2 className="history-page-title">Order History</h2>
            <p className="history-page-subtitle">View and manage all your sales orders</p>
          </div>
          <div className="history-stats">
            <div className="stat-box">
              <span className="stat-label">Total Orders</span>
              <span className="stat-value">{rows.length}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">₹{moneyFormatter.format(rows.reduce((sum, r) => sum + r.totalAmount, 0))}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Total Profit</span>
              <span className="stat-value">₹{moneyFormatter.format(rows.reduce((sum, r) => sum + r.orderProfit, 0))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="history-controls">
        <div className="search-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search by customer name, phone, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by: Latest</option>
            <option value="amount">Sort by: Amount</option>
            <option value="profit">Sort by: Profit</option>
          </select>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="history-empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" stroke="var(--text-muted)" strokeWidth="1.5" opacity="0.3" fill="none"/>
            <path d="M24 16V24L30 30" stroke="var(--text-muted)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round"/>
          </svg>
          <p className="history-empty">No recorded orders found.</p>
        </div>
      ) : (
        <div className="history-grid">
          {filteredRows.map((row) => {
            const paymentStatus = getPaymentStatus(row.amountPaid, row.amountDue, row.totalAmount);
            return (
              <article key={row.orderId} className="history-card">
                <div className="card-header">
                  <div className="order-info">
                    <div className="order-id-section">
                      <span className="order-id-label">Order</span>
                      <h3 className="order-id">#{row.orderId}</h3>
                    </div>
                    <div className="order-date">
                      {new Date(row.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <span className={getStatusBadgeClass(paymentStatus)}>
                    {paymentStatus}
                  </span>
                </div>

                <div className="customer-section">
                  <div className="customer-header">
                    <h4 className="customer-name">{row.customersName}</h4>
                  </div>
                  <p className="customer-phone">📞 {row.customersPhone}</p>
                </div>

                <div className="items-section">
                  <div className="items-header">
                    <span className="items-title">Items ({row.totalProducts})</span>
                  </div>
                  <ul className="history-items">
                    {row.items.slice(0, 3).map((item, idx) => (
                      <li key={`${row.orderId}-${idx}`} className="item-row">
                        <div className="item-name-qty">
                          <span className="item-name">{item.productName}</span>
                          <span className="item-qty">×{numberFormatter.format(Number(item.quantity))}</span>
                        </div>
                        <span className="item-profit">
                          ₹{moneyFormatter.format(Number(item.totalProfit))}
                        </span>
                      </li>
                    ))}
                    {row.items.length > 3 && (
                      <li className="item-more">
                        +{row.items.length - 3} more item{row.items.length - 3 > 1 ? "s" : ""}
                      </li>
                    )}
                  </ul>
                </div>

                <div className="card-divider"></div>

                <div className="amounts-section">
                  <div className="amount-row">
                    <span className="amount-label">Total</span>
                    <span className="amount-value total">₹{moneyFormatter.format(Number(row.totalAmount))}</span>
                  </div>
                  <div className="amount-row">
                    <span className="amount-label">Paid</span>
                    <span className="amount-value paid">₹{moneyFormatter.format(Number(row.amountPaid))}</span>
                  </div>
                  {row.amountDue > 0 && (
                    <div className="amount-row">
                      <span className="amount-label">Due</span>
                      <span className="amount-value due">₹{moneyFormatter.format(Number(row.amountDue))}</span>
                    </div>
                  )}
                  <div className="amount-row highlight">
                    <span className="amount-label">Order Profit</span>
                    <span className="amount-value profit">₹{moneyFormatter.format(Number(row.orderProfit))}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HistoryTable;
