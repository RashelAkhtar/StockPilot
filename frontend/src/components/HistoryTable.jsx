import { useEffect, useMemo, useState } from "react";
import "../styles/HistoryTable.css";

function HistoryTable() {
  const API = import.meta.env.VITE_API;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
    if (!q) return rows;

    return rows.filter((row) => {
      const customer = String(row.customersName || "").toLowerCase();
      const phone = String(row.customersPhone || "").toLowerCase();
      const products = row.items
        .map((i) => String(i.productName || "").toLowerCase())
        .join(" ");
      return customer.includes(q) || phone.includes(q) || products.includes(q);
    });
  }, [rows, search]);

  if (loading) return <p className="loading">Loading order history...</p>;
  if (error) return <p className="history-error">{error}</p>;

  return (
    <div className="history-table-wrap card">
      <div className="history-header">
        <h2 className="page-title">Order History</h2>
        <input
          className="input"
          type="text"
          placeholder="Search customer, phone, product"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredRows.length === 0 ? (
        <p className="history-empty">No recorded orders found.</p>
      ) : (
        <div className="history-grid">
          {filteredRows.map((row) => (
            <article key={row.orderId} className="history-card">
              <div className="history-card-top">
                <h3>
                  {row.customersName} <span>#{row.orderId}</span>
                </h3>
                <p>{new Date(row.createdAt).toLocaleString()}</p>
              </div>

              <p className="history-meta">
                Phone: <strong>{row.customersPhone}</strong>
              </p>

              <ul className="history-items">
                {row.items.map((item, idx) => (
                  <li key={`${row.orderId}-${idx}`}>
                    <span>{item.productName}</span>
                    <span>Qty: {item.quantity}</span>
                    <span>Profit: ₹{item.totalProfit.toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <div className="history-totals">
                <span>Total Products: {row.totalProducts}</span>
                <span>Order Profit: ₹{row.orderProfit.toFixed(2)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryTable;
