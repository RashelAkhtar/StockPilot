import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// range mapping: maps frontend range keys to interval and grouping choices
const RANGE_MAP = {
    '1d': { interval: '1 day', trunc: "date_trunc('hour', sold_at)", fmt: "YYYY-MM-DD HH24:00" },
    '7d': { interval: '7 days', trunc: "date_trunc('day', sold_at)", fmt: "YYYY-MM-DD" },
    '1m': { interval: '30 days', trunc: "date_trunc('day', sold_at)", fmt: "YYYY-MM-DD" },
    '3m': { interval: '90 days', trunc: "date_trunc('week', sold_at)", fmt: "YYYY-MM-DD" },
    '6m': { interval: '180 days', trunc: "date_trunc('month', sold_at)", fmt: "YYYY-MM" },
    '1y': { interval: '1 year', trunc: "date_trunc('month', sold_at)", fmt: "YYYY-MM" },
    '2y': { interval: '2 years', trunc: "date_trunc('month', sold_at)", fmt: "YYYY-MM" },
    'all': null
};

router.get("/summary", async (req, res) => {
    try {
        const rangeKey = req.query.range || '1m';
        const cfg = RANGE_MAP[rangeKey];

        let result;
        if (!cfg) {
            // all time
            result = await pool.query(
                `SELECT
                    COALESCE(SUM(s.selling_price * s.quantity), 0)::numeric AS total_revenue,
                    COALESCE(SUM(s.total_profit), 0)::numeric AS total_profit,
                    COALESCE(SUM(s.quantity), 0)::int AS total_sold,
                    (SELECT COUNT(*) FROM product_list)::int AS total_products,
                    (SELECT COALESCE(SUM(buying_price * quantity),0)::numeric FROM product_list) AS inventory_value
                FROM sales s`
            );
        } else {
            result = await pool.query(
                `SELECT
                    COALESCE(SUM(s.selling_price * s.quantity), 0)::numeric AS total_revenue,
                    COALESCE(SUM(s.total_profit), 0)::numeric AS total_profit,
                    COALESCE(SUM(s.quantity), 0)::int AS total_sold,
                    (SELECT COUNT(*) FROM product_list)::int AS total_products,
                    (SELECT COALESCE(SUM(buying_price * quantity),0)::numeric FROM product_list) AS inventory_value
                FROM sales s
                WHERE s.sold_at >= now() - $1::interval`,
                [cfg.interval]
            );
        }

    res.json(result.rows[0] || { total_revenue: 0, total_profit: 0, total_sold: 0, inventory_value: 0 });
    } catch (err) {
        console.error("GET /dashboard/summary error:", err);
        res.status(500).json({ err: "Failed to fetch summary" });
    }
});

router.get("/top-products", async (req, res) => {
    try {
        const rangeKey = req.query.range || '1m';
        const cfg = RANGE_MAP[rangeKey];

        let result;
        if (!cfg) {
            result = await pool.query(
                `SELECT
                    p.id,
                    p.product_name,
                    COALESCE(SUM(s.quantity), 0)::int AS total_sold
                FROM product_list p
                LEFT JOIN sales s ON p.id = s.product_id
                GROUP BY p.id, p.product_name
                ORDER BY total_sold DESC
                LIMIT 10`
            );
        } else {
            result = await pool.query(
                `SELECT
                    p.id,
                    p.product_name,
                    COALESCE(SUM(s.quantity), 0)::int AS total_sold
                FROM product_list p
                LEFT JOIN sales s ON p.id = s.product_id AND s.sold_at >= now() - $1::interval
                GROUP BY p.id, p.product_name
                ORDER BY total_sold DESC
                LIMIT 10`,
                [cfg.interval]
            );
        }

        res.json(result.rows);
    } catch (err) {
        console.error("GET /dashboard/top-products error:", err);
        res.status(500).json({ err: "Failed to fetch top products" });
    }
});

router.get("/least-products", async (req, res) => {
    try {
        const rangeKey = req.query.range || '1m';
        const cfg = RANGE_MAP[rangeKey];

        let result;
        if (!cfg) {
            result = await pool.query(
                `SELECT
                    p.id,
                    p.product_name,
                    COALESCE(SUM(s.quantity), 0)::int AS total_sold
                FROM product_list p
                LEFT JOIN sales s ON p.id = s.product_id
                GROUP BY p.id, p.product_name
                ORDER BY total_sold ASC
                LIMIT 10`
            );
        } else {
            result = await pool.query(
                `SELECT
                    p.id,
                    p.product_name,
                    COALESCE(SUM(s.quantity), 0)::int AS total_sold
                FROM product_list p
                LEFT JOIN sales s ON p.id = s.product_id AND s.sold_at >= now() - $1::interval
                GROUP BY p.id, p.product_name
                ORDER BY total_sold ASC
                LIMIT 10`,
                [cfg.interval]
            );
        }

        res.json(result.rows);
    } catch (err) {
        console.error("GET /dashboard/least-products error:", err);
        res.status(500).json({ err: "Failed to fetch least products" });
    }
});

router.get("/sales-trend", async (req, res) => {
    try {
        const rangeKey = req.query.range || '1m';
        const cfg = RANGE_MAP[rangeKey];

        let result;
        if (!cfg) {
            // all time: group by month to keep series compact
            result = await pool.query(
                `SELECT
                    to_char(date_trunc('month', sold_at), 'YYYY-MM') AS date,
                    COALESCE(SUM(quantity),0)::int AS total_sold
                 FROM sales
                 GROUP BY date_trunc('month', sold_at)
                 ORDER BY date`
            );
        } else {
            // build query using cfg.trunc and cfg.fmt
            const q = `SELECT to_char(${cfg.trunc}, '${cfg.fmt}') AS date, COALESCE(SUM(quantity),0)::int AS total_sold
                       FROM sales
                       WHERE sold_at >= now() - $1::interval
                       GROUP BY ${cfg.trunc}
                       ORDER BY date`;
            result = await pool.query(q, [cfg.interval]);
        }

        res.json(result.rows);
    } catch (err) {
        console.error("GET /dashboard/sales-trend error:", err);
        res.status(500).json({ err: "Failed to fetch sales trend" });
    }
});

router.get("/profit-trend", async (req, res) => {
    try {
        const rangeKey = req.query.range || '1m';
        const cfg = RANGE_MAP[rangeKey];

        let result;
        if (!cfg) {
            result = await pool.query(
                `SELECT
                    to_char(date_trunc('month', sold_at), 'YYYY-MM') AS date,
                    COALESCE(SUM(total_profit),0)::numeric AS profit
                 FROM sales
                 GROUP BY date_trunc('month', sold_at)
                 ORDER BY date`
            );
        } else {
            const q = `SELECT to_char(${cfg.trunc}, '${cfg.fmt}') AS date, COALESCE(SUM(total_profit),0)::numeric AS profit
                       FROM sales
                       WHERE sold_at >= now() - $1::interval
                       GROUP BY ${cfg.trunc}
                       ORDER BY date`;
            result = await pool.query(q, [cfg.interval]);
        }

        res.json(result.rows);
    } catch (err) {
        console.error("GET /dashboard/profit-trend error:", err);
        res.status(500).json({ err: "Failed to fetch profit trend" });
    }
});

export default router;