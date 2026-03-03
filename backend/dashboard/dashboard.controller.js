import { getRangeConfig } from "./dashboard.utils.js";
import {
  getSummary,
  getTopProducts,
  getLeastProducts,
  getSalesTrend,
  getProfitTrend
} from "./dashboard.service.js";

export async function summary(req, res) {
  try {
    const cfg = getRangeConfig(req.query.range);
    const data = await getSummary(cfg, req.user.id);
    res.json(data);
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
}

export async function topProducts(req, res) {
  try {
    const cfg = getRangeConfig(req.query.range);
    const data = await getTopProducts(cfg, req.user.id);
    res.json(data);
  } catch (err) {
    console.error("Top products error:", err);
    res.status(500).json({ error: "Failed to fetch top products" });
  }
}

export async function leastProducts(req, res) {
  try {
    const cfg = getRangeConfig(req.query.range);
    const data = await getLeastProducts(cfg, req.user.id);
    res.json(data);
  } catch (err) {
    console.error("Least products error:", err);
    res.status(500).json({ error: "Failed to fetch least products" });
  }
}

export async function salesTrend(req, res) {
  try {
    const cfg = getRangeConfig(req.query.range);
    const data = await getSalesTrend(cfg, req.user.id);
    res.json(data);
  } catch (err) {
    console.error("Sales trend error:", err);
    res.status(500).json({ error: "Failed to fetch sales trend" });
  }
}

export async function profitTrend(req, res) {
  try {
    const cfg = getRangeConfig(req.query.range);
    const data = await getProfitTrend(cfg, req.user.id);
    res.json(data);
  } catch (err) {
    console.error("Profit trend error:", err);
    res.status(500).json({ error: "Failed to fetch profit trend" });
  }
}
