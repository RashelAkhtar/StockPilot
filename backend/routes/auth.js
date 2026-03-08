import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "../config/db.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validation/auth.validation.js";

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

// generate access token (short-lived)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "15m", // 15 minutes
  });
};

// generate refresh token (long-lived)
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

// store refresh token in database
const storeRefreshToken = async (userId, token) => {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );
};

// remove refresh token from database
const removeRefreshToken = async (token) => {
  await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [token]);
};

// Register
router.post("/register", validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (userExists.rows.length > 0)
    return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await pool.query(
    `INSERT INTO users (name, email, password) VALUES ($1, $2, $3)
        RETURNING id, name, email`,
    [name, email, hashedPassword],
  );

  const accessToken = generateAccessToken(newUser.rows[0].id);
  const refreshToken = generateRefreshToken();

  await storeRefreshToken(newUser.rows[0].id, refreshToken);

  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 min
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days

  return res.status(201).json({ user: newUser.rows[0] });
});

// Login
router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  if (user.rows.length === 0)
    return res.status(400).json({ message: "Invalid credentials" });

  const userData = user.rows[0];

  const isMatch = await bcrypt.compare(password, userData.password);

  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const accessToken = generateAccessToken(userData.id);
  const refreshToken = generateRefreshToken();

  // Remove old refresh tokens for this user
  await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userData.id]);
  await storeRefreshToken(userData.id, refreshToken);

  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

  res.json({
    user: {
      id: userData.id,
      name: userData.name,
      email: userData.email,
    },
  });
});

// Refresh token endpoint
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // Verify refresh token exists and is valid
    const tokenData = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()`,
      [refreshToken]
    );

    if (tokenData.rows.length === 0) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const userId = tokenData.rows[0].user_id;

    // Generate new tokens
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken();

    // Remove old refresh token and store new one
    await removeRefreshToken(refreshToken);
    await storeRefreshToken(userId, newRefreshToken);

    // Set new cookies
    res.cookie("accessToken", newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", newRefreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

    res.json({ message: "Tokens refreshed successfully" });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Me (return info of the logged in user from protect middleware)
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await removeRefreshToken(refreshToken);
    }

    res.cookie("accessToken", "", { ...cookieOptions, maxAge: 1 });
    res.cookie("refreshToken", "", { ...cookieOptions, maxAge: 1 });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
