export function buildSummaryQuery(cfg, userId) {
  const baseQuery = `
    SELECT
      COALESCE(SUM(s.selling_price * s.quantity), 0)::numeric AS total_revenue,
      COALESCE(SUM(s.total_profit), 0)::numeric AS total_profit,
      COALESCE(SUM(s.quantity), 0)::int AS total_sold,
      (SELECT COUNT(*) FROM product_list WHERE user_id = $1)::int AS total_products,
      (SELECT COALESCE(SUM(buying_price * quantity),0)::numeric FROM product_list WHERE user_id = $1) AS inventory_value
    FROM sales s
  `;

  if (!cfg) {
    return { text: `${baseQuery} WHERE s.user_id = $1`, values: [userId] };
  }

  return {
    text: `${baseQuery} WHERE s.user_id = $1 AND s.sold_at >= now() - $2::interval`,
    values: [userId, cfg.interval]
  };
}

export function buildProductRankingQuery(cfg, userId, order = 'DESC') {
  const base = `
    SELECT
      p.id,
      p.product_name,
      COALESCE(SUM(s.quantity), 0)::int AS total_sold
    FROM product_list p
    LEFT JOIN sales s
      ON p.id = s.product_id
      AND s.user_id = $1
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
      AND s.sold_at >= now() - $2::interval
      WHERE p.user_id = $1
      ${groupOrderLimit}
    `,
    values: [userId, cfg.interval]
  };
}

export function buildTrendQuery(cfg, userId, column) {
  if (!cfg) {
    return {
      text: `
        SELECT
          to_char(date_trunc('month', sold_at), 'YYYY-MM') AS date,
          COALESCE(SUM(${column}), 0) AS value
        FROM sales
        WHERE user_id = $1
        GROUP BY date_trunc('month', sold_at)
        ORDER BY date
      `,
      values: [userId]
    };
  }

  return {
    text: `
        SELECT
          to_char(date_trunc('${cfg.groupBy}', sold_at), '${cfg.format}') AS date,
          COALESCE(SUM(${column}), 0) AS value
        FROM sales
        WHERE user_id = $1
          AND sold_at >= now() - $2::interval
        GROUP BY date_trunc('${cfg.groupBy}', sold_at)
        ORDER BY date
      `,
    values: [userId, cfg.interval]
  };
}
