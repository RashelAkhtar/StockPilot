import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";

import dashboardRouter from "./routes/dashboard.js";
import productRouter from "./routes/product.js";
import salesRouter from "./routes/sales.js";
import authRouter from "./routes/auth.js";

// load .env located next to this file (backend/.env) so server works even when started from repo root
const envPath = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  ".env",
);
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS with explicit options
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// API routes
app.use("/api/dashboard", dashboardRouter);
app.use("/api/product", productRouter);
app.use("/api/sales", salesRouter);
app.use("/api/auth", authRouter);

// 404 handler for undefined routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: "Route not found", path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res
    .status(500)
    .json({ error: "Internal server error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
