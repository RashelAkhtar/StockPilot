import express from "express";
import {
  summary,
  topProducts,
  leastProducts,
  salesTrend,
  profitTrend,
} from "../dashboard/dashboard.controller.js";

const router = express.Router();

router.get("/summary", summary);
router.get("/top-products", topProducts);
router.get("/least-products", leastProducts);
router.get("/sales-trend", salesTrend);
router.get("/profit-trend", profitTrend);

export default router;
