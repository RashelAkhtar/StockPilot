import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM product_list ORDER BY id ASC "
        );

        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ err: "Failed to fetch data" });
    }
});

router.post("/", async (req, res) => {
    try {
        const { productName, buyingPrice, productQty } = req.body;

        if (!productName) return res.status(400).json({ err: "productName is required" });

        // check if product already exists (case-insensitive match)
        const existing = await pool.query(
            "SELECT * FROM product_list WHERE LOWER(product_name) = LOWER($1) LIMIT 1",
            [productName]
        );

        if (existing.rowCount > 0) {
            const prod = existing.rows[0];
            // coerce incoming numbers
            const addQty = Number(productQty || 0);
            const newQty = Number(prod.quantity || 0) + addQty;
            // if buyingPrice provided, update it; otherwise keep existing
            const newBuying = (buyingPrice !== undefined && buyingPrice !== null) ? buyingPrice : prod.buying_price;

            const updated = await pool.query(
                "UPDATE product_list SET quantity = $1, buying_price = $2 WHERE id = $3 RETURNING *",
                [newQty, newBuying, prod.id]
            );

            return res.status(200).json({ message: "Product updated", data: updated.rows[0] });
        }

        // insert new product when no existing match
        const result = await pool.query(
            "INSERT INTO product_list (product_name, buying_price, quantity) VALUES ($1, $2, $3) RETURNING *",
            [productName, buyingPrice, productQty]
        );

        res.status(201).json({ message: "Data saved successfully", data: result.rows[0] });
    } catch (err) {
        console.log(err);
        res.status(500).json({ err: "Database error" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM product_list WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        // return deleted row for client verification
        res.json({ message: "Product deleted successfully", data: result.rows[0] });
    } catch (err) {
        console.log(err);
        res.status(500).json({ err: "Delete failed" });
    }
});

export default router;
