import React, { useState, useEffect } from "react";
import "../styles/AddRemoveProduct.css";
import Modal from './Modal';

function AddRemoveProduct() {
    const API = import.meta.env.VITE_API;

    const [form, setForm] = useState({
        productName: "",
        buyingPrice: "",
        productQty: "",
    });
    const [modal, setModal] = useState({ open: false, title: '', message: '' });
    const [products, setProducts] = useState([]);
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API}/api/product`, { credentials: "include" });
                const json = await res.json();
                const rows = Array.isArray(json) ? json : json.data || [];
                setProducts(rows);
            } catch (err) {
                console.error('Failed to preload products', err);
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
            if (q.length === 0) return setSuggestions([]);
            const matches = products.filter(p => (p.product_name || p.productName || '').toLowerCase().includes(q)).slice(0,8);
            setSuggestions(matches);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // coerce numeric fields to numbers before sending
        const payload = {
            productName: form.productName,
            buyingPrice: Number(form.buyingPrice),
            productQty: Number(form.productQty),
        };

        const res = await fetch(`${API}/api/product`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok) {
            // notify listeners (ProductTable) to refresh
            window.dispatchEvent(new CustomEvent("product:added", { detail: data.data }));
            // reset form
            setForm({ productName: "", buyingPrice: "", productQty: "" });
        }

        // show modal with server response
        setModal({ open: true, title: res.ok ? 'Success' : 'Error', message: data.message || (res.ok ? 'Product added' : 'Failed to add product') });
    }


    return (
        <div className="add-product page">
            <h1 className="page-title">Add & Remove Product</h1>

            <div className="card">
              <form className="form" onSubmit={handleSubmit}>
                  <label>Name</label>
                  <div className="typeahead">
                    <input autoComplete="off" className="input" type="text" name="productName" placeholder="Enter product name..." onChange={handleChange} value={form.productName} required />
                    {suggestions.length > 0 && (
                        <ul className="suggestions">
                            {suggestions.map(s => (
                                <li key={s.id} onClick={() => {
                                    setForm({ ...form, productName: s.product_name, buyingPrice: s.buying_price });
                                    setSuggestions([]);
                                }}>
                                    {s.product_name} <span className="muted">(₹{s.buying_price})</span>
                                </li>
                            ))}
                        </ul>
                    )}
                  </div>

                  <label>Buying Price</label>
                  <input className="input" type="number" name="buyingPrice" placeholder="Enter buying price..." onChange={handleChange} value={form.buyingPrice} required />

                  <label>Quantity</label>
                  <input className="input" type="number" name="productQty" placeholder="Enter quantity..." onChange={handleChange} value={form.productQty} required />

                  <div className="actions">
                    <button className="btn primary" type="submit">Add Product</button>
                  </div>
              </form>
            </div>

                        {/* Product table is now on the Products page */}
                        <Modal open={modal.open} title={modal.title} onClose={() => setModal({ open: false })}>
                            <div>{modal.message}</div>
                        </Modal>
        </div>
    )
}

export default AddRemoveProduct
