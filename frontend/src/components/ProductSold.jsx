import { useEffect, useState } from "react";
import ProductTable from "./ProductTable";
import Modal from "./Modal";
import "../styles/ProductSold.css";
import "../styles/AddRemoveProduct.css"; // reuse typeahead styles

function ProductSold () {
    const API = import.meta.env.VITE_API;

    const [form, setForm] = useState({
        productId: "",
        productName: "",
        buyingPrice: "",
        sellingPrice: "",
        productQty: "",
    });
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [modal, setModal] = useState({ open: false, title: "", message: "", variant: "success" });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API}/api/product`, { credentials: "include" });
                const json = await res.json();

                const rows = (Array.isArray(json) ? json : json.data || [])
                    .map((r) => ({
                        id: r.id,
                        productName: r.product_name ?? r.productName,
                        buyingPrice: r.buying_price ?? r.buyingPrice,
                        productQty: r.quantity ?? r.productQty,
                    }));

                setProducts(rows);
            } catch (err) {
                console.log("Failed to fetch product: ", err);
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

        if (name === 'productName') {
            const q = String(value || '').toLowerCase();
            if (q.length === 0) {
                setSuggestions([]);
                setActiveIndex(-1);
                return;
            }
            const matches = products.filter(p => (p.productName || p.product_name || '').toLowerCase().includes(q)).slice(0,8);
            setSuggestions(matches);
            setActiveIndex(matches.length ? 0 : -1);
        }
    }

    const selectSuggestion = (s) => {
        setForm({ ...form, productId: s.id, productName: s.productName, buyingPrice: s.buyingPrice });
        setSuggestions([]);
        setActiveIndex(-1);
    }

    const handleKeyDown = (e) => {
        if (!suggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
            return;
        }
        if (e.key === 'Enter') {
            if (activeIndex >= 0 && activeIndex < suggestions.length) {
                e.preventDefault();
                selectSuggestion(suggestions[activeIndex]);
            }
            return;
        }
        if (e.key === 'Escape') {
            setSuggestions([]);
            setActiveIndex(-1);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.productId) {
            setModal({
                open: true,
                title: "Warning",
                message: "Please select a product",
                variant: "error",
            });
            return;
        }

        const payload = {
            productId: form.productId,
            sellingPrice: Number(form.sellingPrice),
            quantity: Number(form.productQty),
        };

        if (Number.isNaN(payload.sellingPrice) || Number.isNaN(payload.quantity)) {
            setModal({
                open: true,
                title: "Warning",
                message: "Please enter valid numeric selling price and quantity",
                variant: "error",
            });
            return;
        }

        try {
            const res = await fetch(`${API}/api/sales`, {
                method: 'POST',
                credentials: "include",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                setModal({
                    open: true,
                    title: "Error",
                    message: json.error || "Failed to record sale",
                    variant: "error",
                });
                return;
            }


            // notify product table to refresh quantities
            window.dispatchEvent(new CustomEvent('product:sold', { detail: { productId: payload.productId } }));

            // reset form
            setForm({ productId: '', productName: '', buyingPrice: '', sellingPrice: '', productQty: '' });
            setModal({
                open: true,
                title: "Success",
                message: json.message || "Sale recorded successfully",
                variant: "success",
            });
        } catch (err) {
            console.error(err);
            setModal({
                open: true,
                title: "Error",
                message: "Failed to record sale",
                variant: "error",
            });
        }
    }

    if (loading) return <p className="loading">Loading products...</p>;

    return (
        <div className="product-sold page">
            <h1 className="page-title">💰 Product Sold</h1>

            <div className="card">
              <form className="form" onSubmit={handleSubmit}>
                <label>Product</label>
                <div>
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
                        />

                        {suggestions.length > 0 && (
                            <ul className="suggestions" role="listbox">
                                {suggestions.map((s, idx) => (
                                    <li
                                        key={s.id}
                                        role="option"
                                        aria-selected={activeIndex === idx}
                                        className={activeIndex === idx ? 'active' : ''}
                                        onMouseEnter={() => setActiveIndex(idx)}
                                        onClick={() => selectSuggestion(s)}
                                    >
                                        {s.productName} <span className="muted">(₹{s.buyingPrice})</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                    <label>Buying Price (per unit)</label>
                    <input className="input" type="number" name="buyingPrice" placeholder="Buying price..." value={form.buyingPrice} disabled />

                    <label>Selling Price (per unit)</label>
                    <input className="input" type="number" name="sellingPrice" onChange={handleChange} placeholder="Enter selling price..." value={form.sellingPrice} required />

                    <label>Quantity</label>
                    <input className="input" type="number" name="productQty" onChange={handleChange} placeholder="Enter quantity..." value={form.productQty} required />

                    <div className="actions">
                        <button className="btn primary" type="submit">Record Sale</button>
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
    )
}

export default ProductSold
