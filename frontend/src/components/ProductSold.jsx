import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductTable from "./ProductTable";
import Modal from "./Modal";
import "../styles/ProductSold.css";

function ProductSold() {
  const API = import.meta.env.VITE_API;

  const parseLooseNumber = (value) => {
    if (value === null || value === undefined) return NaN;
    const normalized = String(value).replace(/,/g, "").trim();
    if (!normalized) return NaN;
    return Number(normalized);
  };

  const [form, setForm] = useState({
    productId: "",
    productName: "",
    buyingPrice: "",
    sellingPrice: "",
    productQty: "",
    customersName: "",
    customersPhone: "",
    amountPaid: "",
  });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    variant: "success",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API}/api/product`, {
          credentials: "include",
        });
        const json = await res.json();

        const rows = (Array.isArray(json) ? json : json.data || []).map(
          (r) => ({
            id: Number(r.id),
            productName: r.product_name ?? r.productName,
            buyingPrice: Number(r.buying_price ?? r.buyingPrice ?? 0),
            productQty: Number(r.quantity ?? r.productQty ?? 0),
          }),
        );

        setProducts(rows);
      } catch (err) {
        console.log("Failed to fetch product: ", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [API]);

  const inventoryMap = useMemo(() => {
    const map = new Map();
    for (const p of products) map.set(Number(p.id), p);
    return map;
  }, [products]);

  const getCartQtyForProduct = (productId) =>
    cart
      .filter((item) => Number(item.productId) === Number(productId))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const resetProductSelection = () => {
    setForm((prev) => ({
      ...prev,
      productId: "",
      productName: "",
      buyingPrice: "",
      sellingPrice: "",
      productQty: "",
    }));
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const addToCart = () => {
    const productId = Number(form.productId);
    const sellingPrice = parseLooseNumber(form.sellingPrice);
    const quantity = parseLooseNumber(form.productQty);

    if (!Number.isInteger(productId) || productId <= 0) {
      setModal({
        open: true,
        title: "Warning",
        message: "Please select a product",
        variant: "error",
      });
      return;
    }

    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      setModal({
        open: true,
        title: "Warning",
        message: "Please enter a valid selling price",
        variant: "error",
      });
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setModal({
        open: true,
        title: "Warning",
        message: "Quantity must be a whole number greater than 0",
        variant: "error",
      });
      return;
    }

    const selectedProduct = inventoryMap.get(productId);
    if (!selectedProduct) {
      setModal({
        open: true,
        title: "Error",
        message: "Selected product is not available",
        variant: "error",
      });
      return;
    }

    const alreadyInCart = getCartQtyForProduct(productId);
    const availableStock = Number(selectedProduct.productQty || 0);
    if (alreadyInCart + quantity > availableStock) {
      setModal({
        open: true,
        title: "Stock limit",
        message: `Only ${availableStock - alreadyInCart} more unit(s) can be added for ${selectedProduct.productName}.`,
        variant: "error",
      });
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex(
        (item) => Number(item.productId) === productId,
      );
      if (idx === -1) {
        return [
          ...prev,
          {
            productId,
            productName: selectedProduct.productName,
            buyingPrice: Number(selectedProduct.buyingPrice || 0),
            sellingPrice,
            quantity,
          },
        ];
      }

      const next = [...prev];
      next[idx] = {
        ...next[idx],
        quantity: Number(next[idx].quantity) + quantity,
        sellingPrice,
      };
      return next;
    });

    resetProductSelection();
  };

  const removeCartItem = (productId) => {
    setCart((prev) =>
      prev.filter((item) => Number(item.productId) !== Number(productId)),
    );
  };

  const clearCart = () => setCart([]);

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "productName") {
      const q = String(value || "").toLowerCase();
      if (q.length === 0) {
        setSuggestions([]);
        setActiveIndex(-1);
        return;
      }
      const matches = products
        .filter((p) => (p.productName || "").toLowerCase().includes(q))
        .slice(0, 8);
      setSuggestions(matches);
      setActiveIndex(matches.length ? 0 : -1);
    }
  };

  const selectSuggestion = (s) => {
    setForm((prev) => ({
      ...prev,
      productId: s.id,
      productName: s.productName,
      buyingPrice: s.buyingPrice,
    }));
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      if (!suggestions || suggestions.length === 0) return;
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      if (!suggestions || suggestions.length === 0) return;
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      if (suggestions.length > 0 && activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
        return;
      }
      e.preventDefault();
      if (!isSubmitting) addToCart();
      return;
    }
    if (e.key === "Escape") {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  };

  const handleAddToCartOnEnter = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!isSubmitting) addToCart();
  };

  const cartTotals = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        const qty = Number(item.quantity || 0);
        const buy = Number(item.buyingPrice || 0);
        const sell = Number(item.sellingPrice || 0);
        acc.units += qty;
        acc.revenue += sell * qty;
        acc.profit += (sell - buy) * qty;
        return acc;
      },
      { units: 0, revenue: 0, profit: 0 },
    );
  }, [cart]);
  const parsedAmountPaid = useMemo(() => {
    const parsed = parseLooseNumber(form.amountPaid);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
  }, [form.amountPaid]);
  const amountDue = useMemo(
    () => Math.max(0, Number(cartTotals.revenue || 0) - parsedAmountPaid),
    [cartTotals.revenue, parsedAmountPaid],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!cart.length) {
      setModal({
        open: true,
        title: "Warning",
        message: "Cart is empty. Add at least one product.",
        variant: "error",
      });
      return;
    }

    const rawAmountPaid = String(form.amountPaid || "").trim();
    const amountPaidInput = parseLooseNumber(form.amountPaid);
    if (
      rawAmountPaid.length > 0 &&
      (!Number.isFinite(amountPaidInput) || amountPaidInput < 0)
    ) {
      setModal({
        open: true,
        title: "Warning",
        message: "Please enter a valid non-negative amount paid",
        variant: "error",
      });
      return;
    }

    const payload = {
      customersName: form.customersName?.trim() || null,
      customersPhone: form.customersPhone?.trim() || null,
      amountPaid: parsedAmountPaid,
      items: cart.map((item) => ({
        productId: Number(item.productId),
        sellingPrice: Number(item.sellingPrice),
        quantity: Number(item.quantity),
      })),
    };

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API}/api/sales`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setModal({
          open: true,
          title: "Error",
          message: json.error || "Failed to record order",
          variant: "error",
        });
        return;
      }

      window.dispatchEvent(new CustomEvent("product:sold"));

      // Update local stock snapshot so the user can continue adding orders without refresh.
      setProducts((prev) => {
        const soldById = new Map();
        for (const item of payload.items) {
          soldById.set(
            item.productId,
            Number(soldById.get(item.productId) || 0) +
              Number(item.quantity || 0),
          );
        }

        return prev.map((p) => {
          const sold = Number(soldById.get(Number(p.id)) || 0);
          if (!sold) return p;
          return {
            ...p,
            productQty: Math.max(0, Number(p.productQty || 0) - sold),
          };
        });
      });

      setCart([]);
      setForm({
        productId: "",
        productName: "",
        buyingPrice: "",
        sellingPrice: "",
        productQty: "",
        customersName: "",
        customersPhone: "",
        amountPaid: "",
      });
      setModal({
        open: true,
        title: "Success",
        message: json.message || "Order recorded successfully",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      setModal({
        open: true,
        title: "Error",
        message: "Failed to record order",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p className="loading">Loading products...</p>;
  if (products.length === 0) {
    return (
      <div className="product-sold page">
        <div
          className="card"
          style={{ textAlign: "center", padding: "2rem 1.5rem" }}
        >
          <h3 style={{ marginBottom: "0.5rem" }}>No sales recorded yet.</h3>
          <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
            Start by recording your first product sale.
          </p>
          <Link className="btn primary" to="/products">
            Go to Product Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-sold page">
      <h1 className="page-title">💰 Product Sold</h1>

      <div className="card">
        <form className="form" onSubmit={handleSubmit}>
          <div className="input-field">
            <div className="customer-section">
              <label>Customer Details</label>

              <label>Customer's name</label>
              <input
                className="input"
                type="text"
                name="customersName"
                placeholder="Customer's name..."
                onChange={handleChange}
                value={form.customersName}
                disabled={isSubmitting}
              />

              <label>Customer's Phone No</label>
              <input
                className="input"
                type="number"
                name="customersPhone"
                placeholder="Customer's Phone No..."
                onChange={handleChange}
                value={form.customersPhone}
                disabled={isSubmitting}
              />

              <label>Amount Paid</label>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                name="amountPaid"
                placeholder="Enter paid amount..."
                onChange={handleChange}
                value={form.amountPaid}
                disabled={isSubmitting}
              />

              <label>Amount Due</label>
              <input
                className="input"
                type="text"
                value={amountDue.toFixed(2)}
                disabled
              />
            </div>

            <div className="product-section">
              <label>Product Details</label>
              <div className="typeahead">
                <input
                  autoComplete="off"
                  className="input"
                  type="text"
                  name="productName"
                  placeholder="Search products..."
                  value={form.productName}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  disabled={isSubmitting}
                />

                {suggestions.length > 0 && (
                  <ul className="suggestions" role="listbox">
                    {suggestions.map((s, idx) => (
                      <li
                        key={s.id}
                        role="option"
                        aria-selected={activeIndex === idx}
                        className={activeIndex === idx ? "active" : ""}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => selectSuggestion(s)}
                      >
                        {s.productName}
                        <span className="muted">
                          (Buy: ₹{s.buyingPrice}, Stock: {s.productQty})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <label>Buying Price (per unit)</label>
              <input
                className="input"
                type="number"
                name="buyingPrice"
                placeholder="Buying price..."
                value={form.buyingPrice}
                disabled
              />

              <label>Selling Price (per unit)</label>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                name="sellingPrice"
                onChange={handleChange}
                onKeyDown={handleAddToCartOnEnter}
                placeholder="Enter selling price..."
                value={form.sellingPrice}
                disabled={isSubmitting}
              />

              <label>Quantity</label>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                name="productQty"
                onChange={handleChange}
                onKeyDown={handleAddToCartOnEnter}
                placeholder="Enter quantity..."
                value={form.productQty}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="actions">
            <button className="btn" type="button" onClick={addToCart} disabled={isSubmitting}>
              Add Product
            </button>
          </div>

          <div className="cart-preview">
            <div className="cart-header-row">
              <h3>Cart Items ({cart.length})</h3>
              <button
                className="btn danger"
                type="button"
                onClick={clearCart}
                disabled={!cart.length || isSubmitting}
              >
                Clear Cart
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="cart-empty">No product added yet.</p>
            ) : (
              <>
                <ul className="cart-list">
                  {cart.map((item) => (
                    <li key={item.productId} className="cart-item">
                      <div>
                        <strong>{item.productName}</strong>
                        <p>
                          Qty: {item.quantity} | Sell: ₹{item.sellingPrice} |
                          Profit/Unit: ₹
                          {(
                            Number(item.sellingPrice) - Number(item.buyingPrice)
                          ).toFixed(2)}
                        </p>
                      </div>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => removeCartItem(item.productId)}
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="cart-summary">
                  <span>Total Units: {cartTotals.units}</span>
                  <span>Revenue: ₹{cartTotals.revenue.toFixed(2)}</span>
                  <span>Profit: ₹{cartTotals.profit.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div className="actions">
            <button
              className="btn primary"
              type="submit"
              disabled={!cart.length || isSubmitting}
            >
              {isSubmitting ? "Recording..." : "Record Order"}
            </button>
          </div>
        </form>
      </div>

      <div>
        <ProductTable />
      </div>

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

export default ProductSold;
