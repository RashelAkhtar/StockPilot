import React, { useState, useEffect } from "react";
import "../styles/AddRemoveProduct.css";
import Modal from "./Modal";

function AddRemoveProduct() {
  const API = import.meta.env.VITE_API;
  const parseLooseNumber = (value) => {
    if (value === null || value === undefined) return NaN;
    const normalized = String(value).replace(/,/g, "").trim();
    if (!normalized) return NaN;
    return Number(normalized);
  };

  const [form, setForm] = useState({
    productName: "",
    buyingPrice: "",
    productQty: "",
  });
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    variant: "success",
  });
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API}/api/product`, {
          credentials: "include",
        });
        const json = await res.json();
        const rows = Array.isArray(json) ? json : json.data || [];
        setProducts(rows);
      } catch (err) {
        console.error("Failed to preload products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [API]);

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setForm({ ...form, [name]: value });

    if (name === "productName") {
      const q = String(value || "").toLowerCase();
      if (q.length === 0) return setSuggestions([]);
      const matches = products
        .filter((p) =>
          (p.product_name || p.productName || "").toLowerCase().includes(q),
        )
        .slice(0, 8);
      setSuggestions(matches);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    // coerce numeric fields to numbers before sending
    const buyingPrice = parseLooseNumber(form.buyingPrice);
    const productQty = parseLooseNumber(form.productQty);

    if (!Number.isFinite(buyingPrice) || buyingPrice < 0) {
      setModal({
        open: true,
        title: "Warning",
        message: "Please enter a valid buying price",
        variant: "error",
      });
      return;
    }

    if (!Number.isInteger(productQty) || productQty <= 0) {
      setModal({
        open: true,
        title: "Warning",
        message: "Quantity must be a whole number greater than 0",
        variant: "error",
      });
      return;
    }

    const payload = {
      productName: form.productName,
      buyingPrice,
      productQty,
    };

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API}/api/product`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // notify listeners (ProductTable) to refresh
        window.dispatchEvent(
          new CustomEvent("product:added", { detail: data.data }),
        );
        // reset form
        setForm({ productName: "", buyingPrice: "", productQty: "" });
      }

      // show modal with server response
      setModal({
        open: true,
        title: res.ok ? "Success" : "Error",
        message:
          data.message ||
          (res.ok ? "Product added successfully" : "Failed to add product"),
        variant: res.ok ? "success" : "error",
      });
    } catch (err) {
      console.error(err);
      setModal({
        open: true,
        title: "Error",
        message: "Failed to add product",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p className="loading">Loading products...</p>;

  return (
    <div className="add-product page">
      <h1 className="page-title">Add & Remove Product</h1>

      <div className="card">
        <form className="form" onSubmit={handleSubmit}>
          <label>Name</label>
          <div className="typeahead">
            <input
              autoComplete="off"
              className="input"
              type="text"
              name="productName"
              placeholder="Enter product name..."
              onChange={handleChange}
              value={form.productName}
              disabled={isSubmitting}
              required
            />
            {suggestions.length > 0 && (
              <ul className="suggestions">
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    onClick={() => {
                      if (isSubmitting) return;
                      setForm({
                        ...form,
                        productName: s.product_name,
                        buyingPrice: s.buying_price,
                      });
                      setSuggestions([]);
                    }}
                  >
                    {s.product_name}{" "}
                    <span className="muted">(₹{s.buying_price})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label>Buying Price</label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            name="buyingPrice"
            placeholder="Enter buying price..."
            onChange={handleChange}
            value={form.buyingPrice}
            disabled={isSubmitting}
            required
          />

          <label>Quantity</label>
          <input
            className="input"
            type="text"
            inputMode="numeric"
            name="productQty"
            placeholder="Enter quantity..."
            onChange={handleChange}
            value={form.productQty}
            disabled={isSubmitting}
            required
          />

          <div className="actions">
            <button className="btn primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      {/* Product table is now on the Products page */}
      <Modal
        open={modal.open}
        title={modal.title}
        variant={modal.variant}
        onClose={() => setModal((prev) => ({ ...prev, open: false }))}
      >
        <div>{modal.message}</div>
      </Modal>
    </div>
  );
}

export default AddRemoveProduct;
