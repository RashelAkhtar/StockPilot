import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const { customersName = null, customersPhone = null } = req.body;

    // Accept new cart payload (`items`) and keep backward compatibility
    // with older single-product payload shape.
    const items = Array.isArray(req.body.items) && req.body.items.length
      ? req.body.items
      : (req.body.productId
          ? [{
              productId: req.body.productId,
              sellingPrice: req.body.sellingPrice,
              quantity: req.body.quantity,
            }]
          : []);

    if (!items.length) {
      return res.status(400).json({ error: "At least one cart item is required" });
    }

    const orderInsert = await pool.query(
      `INSERT INTO orders (user_id, customers_name, customers_phone)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userId, customersName || null, customersPhone || null],
    );

    const orderId = orderInsert.rows[0].id;
    const processedItems = [];

    for (const item of items) {
      const productId = Number(item.productId);
      const sellingPrice = Number(item.sellingPrice);
      const quantity = Number(item.quantity);

      if (!Number.isInteger(productId) || productId <= 0) {
        throw new Error("Invalid product id in cart");
      }
      if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
        throw new Error("Invalid selling price in cart");
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Invalid quantity in cart");
      }

      const productResult = await pool.query(
        `SELECT id, buying_price, quantity
         FROM product_list
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [productId, userId],
      );

      const product = productResult.rows[0];

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }
      if (Number(product.quantity) < quantity) {
        throw new Error(`Insufficient stock for product ${productId}`);
      }

      const buyingPrice = Number(product.buying_price);
      const profitPerUnit = sellingPrice - buyingPrice;
      const totalProfit = profitPerUnit * quantity;

      await pool.query(
        `INSERT INTO order_items
         (order_id, product_id, selling_price, quantity, profit_per_unit, total_profit)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, productId, sellingPrice, quantity, profitPerUnit, totalProfit],
      );

      // Keep the existing sales table in sync so existing dashboard/table APIs
      // continue to work without additional migrations.
      await pool.query(
        `INSERT INTO sales
         (user_id, product_id, selling_price, quantity, profit_per_unit, total_profit, customers_name, customers_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          productId,
          sellingPrice,
          quantity,
          profitPerUnit,
          totalProfit,
          customersName || null,
          customersPhone || null,
        ],
      );

      await pool.query(
        `UPDATE product_list
         SET
           quantity = quantity - $1,
           total_sold = COALESCE(total_sold, 0) + $1,
           total_profit = COALESCE(total_profit, 0) + $2,
           last_sold_price = $3
         WHERE id = $4 AND user_id = $5`,
        [quantity, totalProfit, sellingPrice, productId, userId],
      );

      processedItems.push({
        productId,
        quantity,
        sellingPrice,
        profitPerUnit,
        totalProfit,
      });
    }

    res.status(201).json({
      message: "Order recorded",
      orderId,
      items: processedItems,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to record order" });
  }
});

// GET sales list
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT * FROM sales WHERE user_id = $1 ORDER BY sold_at DESC",
      [userId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});

export default router;
