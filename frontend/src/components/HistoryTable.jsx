import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import "../styles/HistoryTable.css";

function HistoryTable() {
  const API = import.meta.env.VITE_API;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date"); // date, amount, profit
  const [filterStatus, setFilterStatus] = useState("all"); // all, paid, partial, unpaid
  const [modalInfo, setModalInfo] = useState({ open: false, row: null });
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
        if (filterStatus === "unpaid") {
          return row.amountPaid === 0 && row.amountDue > 0;
        }
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

  const getPaymentStatus = (amountPaid, amountDue) => {
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

  const openModal = (row) => {
    setModalInfo({ open: true, row });
  };

  const closeModal = () => setModalInfo({ open: false, row: null });

  return (
    <div className="history-container">
      {/* controls remain above table */}
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
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Profit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const paymentStatus = getPaymentStatus(row.amountPaid, row.amountDue);
                return (
                  <tr
                    key={row.orderId}
                    onClick={() => openModal(row)}
                    className={row.amountDue > 0 ? "has-due" : ""}
                    style={{ cursor: "pointer" }}
                  >
                    <td>#{row.orderId}</td>
                    <td>{new Date(row.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</td>
                    <td>{row.customersName}</td>
                    <td>{row.totalProducts}</td>
                    <td>₹{moneyFormatter.format(Number(row.totalAmount))}</td>
                    <td>₹{moneyFormatter.format(Number(row.amountPaid))}</td>
                    <td className={row.amountDue > 0 ? "due-cell" : ""}>₹{moneyFormatter.format(Number(row.amountDue))}</td>
                    <td>₹{moneyFormatter.format(Number(row.orderProfit))}</td>
                    <td><span className={getStatusBadgeClass(paymentStatus)}>{paymentStatus}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* detail modal */}
      <Modal
        open={modalInfo.open}
        title={modalInfo.row ? `Order #${modalInfo.row.orderId}` : "Details"}
        onClose={closeModal}
        primaryLabel="Close"
      >
        {modalInfo.row ? (
          <div className="order-detail-modal">
            <p><strong>Customer:</strong> {modalInfo.row.customersName}</p>
            <p><strong>Phone:</strong> {modalInfo.row.customersPhone || '-'} </p>
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {modalInfo.row.items.map((itm, idx) => (
                  <tr key={idx}>
                    <td>{itm.productName}</td>
                    <td>{numberFormatter.format(itm.quantity)}</td>
                    <td>₹{moneyFormatter.format(itm.totalProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default HistoryTable;
