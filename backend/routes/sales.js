import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// Record a sale: insert into `sales` and decrement product quantity inside a transaction
router.post("/", async (req, res) => {
    const { productId, sellingPrice, quantity } = req.body;

    if (!productId || sellingPrice == null || quantity == null) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const result = await client.query(
            "SELECT id, buying_price, quantity FROM product_list WHERE id = $1 FOR UPDATE",
            [productId]
        );

        const product = result.rows[0];
        if (!product) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Product not found" });
        }

        if (Number(product.quantity) < Number(quantity)) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Insufficient stock" });
        }

        const profitPerUnit = Number(sellingPrice) - Number(product.buying_price);
        const totalProfit = profitPerUnit * Number(quantity);

        // insert sale record (sales table must be created separately)
        const insertSale = await client.query(
            `INSERT INTO sales (product_id, selling_price, quantity, profit_per_unit, total_profit)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [productId, sellingPrice, quantity, profitPerUnit, totalProfit]
        );

        // decrement inventory; do not touch aggregate columns unless they exist
        await client.query(
            "UPDATE product_list SET quantity = quantity - $1 WHERE id = $2",
            [quantity, productId]
        );

        await client.query("COMMIT");

        // fetch updated product quantity to return to client
        const updated = await pool.query(
            "SELECT id, product_name, buying_price, quantity FROM product_list WHERE id = $1",
            [productId]
        );

        res.status(201).json({ message: "Sale recorded", sale: insertSale.rows[0], product: updated.rows[0] });
    } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error(err);
        res.status(500).json({ error: "Failed to record sale" });
    } finally {
        client.release();
    }
});

// GET sales list
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM sales ORDER BY sold_at DESC");
        // return rows directly (frontend accepts array or {data: []})
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch sales" });
    }
});

export default router;
