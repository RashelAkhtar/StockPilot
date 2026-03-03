import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            "SELECT * FROM product_list WHERE user_id = $1 ORDER BY id ASC", [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ err: "Failed to fetch data" });
    }
});

router.post("/", async (req, res) => {
    try {
        const userId = req.user.id;
        const { productName, buyingPrice, productQty } = req.body;

        if (!productName) return res.status(400).json({ err: "productName is required" });

        // check if product already exists (case-insensitive match)
        const existing = await pool.query(
            "SELECT * FROM product_list WHERE LOWER(product_name) = LOWER($1) AND user_id = $2 LIMIT 1",
            [productName, userId]
        );

        if (existing.rowCount > 0) {
            const prod = existing.rows[0];
            // coerce incoming numbers
            const addQty = Number(productQty || 0);
            const newQty = Number(prod.quantity || 0) + addQty;
            // if buyingPrice provided, update it; otherwise keep existing
            const newBuying = (buyingPrice !== undefined && buyingPrice !== null) ? buyingPrice : prod.buying_price;

            const updated = await pool.query(
                "UPDATE product_list SET quantity = $1, buying_price = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
                [newQty, newBuying, prod.id, userId]
            );

            return res.status(200).json({ message: "Product updated", data: updated.rows[0] });
        }

        // insert new product when no existing match
        const result = await pool.query(
            "INSERT INTO product_list (product_name, buying_price, quantity, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [productName, buyingPrice, productQty, userId]
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
        const userId = req.user.id;

        const result = await pool.query(
            "DELETE FROM product_list WHERE id = $1 AND user_id = $2 RETURNING *",
            [id, userId]
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
