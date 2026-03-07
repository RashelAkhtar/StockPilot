export function buildSummaryQuery(cfg, userId) {
  const baseQuery = `
    SELECT
      COALESCE(SUM(oi.selling_price * oi.quantity), 0)::numeric AS total_revenue,
      COALESCE(SUM(oi.total_profit), 0)::numeric AS total_profit,
      COALESCE(SUM(oi.quantity), 0)::int AS total_sold,
      (SELECT COUNT(*) FROM product_list WHERE user_id = $1)::int AS total_products,
      (SELECT COALESCE(SUM(buying_price * quantity),0)::numeric FROM product_list WHERE user_id = $1) AS inventory_value
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
  `;

  if (!cfg) {
    return { text: `${baseQuery} WHERE o.user_id = $1`, values: [userId] };
  }

  return {
    text: `${baseQuery} WHERE o.user_id = $1 AND o.created_at >= now() - $2::interval`,
    values: [userId, cfg.interval]
  };
}

export function buildProductRankingQuery(cfg, userId, order = 'DESC') {
  const base = `
    SELECT
      p.id,
      p.product_name,
      COALESCE(SUM(CASE WHEN o.id IS NOT NULL THEN oi.quantity ELSE 0 END), 0)::int AS total_sold
    FROM product_list p
    LEFT JOIN order_items oi
      ON p.id = oi.product_id
    LEFT JOIN orders o
      ON o.id = oi.order_id
      AND o.user_id = $1
  `;

  const groupOrderLimit = `
    GROUP BY p.id, p.product_name
    ORDER BY total_sold ${order}
    LIMIT 10
  `;

  if (!cfg) {
    return {
      text: `${base} WHERE p.user_id = $1 ${groupOrderLimit}`,
      values: [userId]
    };
  }

  return {
    text: `
      ${base}
      AND o.created_at >= now() - $2::interval
      WHERE p.user_id = $1
      ${groupOrderLimit}
    `,
    values: [userId, cfg.interval]
  };
}

export function buildTrendQuery(cfg, userId, column) {
  const columnMap = {
    quantity: "oi.quantity",
    total_profit: "oi.total_profit",
  };
  const columnExpr = columnMap[column] ?? "oi.quantity";

  if (!cfg) {
    return {
      text: `
        SELECT
          to_char(date_trunc('month', o.created_at), 'YYYY-MM') AS date,
          COALESCE(SUM(${columnExpr}), 0) AS value
        FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = $1
        GROUP BY date_trunc('month', o.created_at)
        ORDER BY date
      `,
      values: [userId]
    };
  }

    return {
      text: `
        SELECT
          to_char(date_trunc('${cfg.groupBy}', o.created_at), '${cfg.format}') AS date,
          COALESCE(SUM(${columnExpr}), 0) AS value
        FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = $1
          AND o.created_at >= now() - $2::interval
        GROUP BY date_trunc('${cfg.groupBy}', o.created_at)
        ORDER BY date
      `,
    values: [userId, cfg.interval]
  };
}
