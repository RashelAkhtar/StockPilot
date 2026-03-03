import pool from "../config/db.js";
import {
  buildSummaryQuery,
  buildProductRankingQuery,
  buildTrendQuery
} from "./dashboard.queries.js";

export async function getSummary(cfg, userId) {
  const { text, values } = buildSummaryQuery(cfg, userId);
  const result = await pool.query(text, values);
  return result.rows[0];
}

export async function getTopProducts(cfg, userId) {
  const { text, values } = buildProductRankingQuery(cfg, userId, 'DESC');
  const result = await pool.query(text, values);
  return result.rows;
}

export async function getLeastProducts(cfg, userId) {
  const { text, values } = buildProductRankingQuery(cfg, userId, 'ASC');
  const result = await pool.query(text, values);
  return result.rows;
}

export async function getSalesTrend(cfg, userId) {
  const { text, values } = buildTrendQuery(cfg, userId, 'quantity');
  const result = await pool.query(text, values);
  return result.rows;
}

export async function getProfitTrend(cfg, userId) {
  const { text, values } = buildTrendQuery(cfg, userId, 'total_profit');
  const result = await pool.query(text, values);
  return result.rows;
}
