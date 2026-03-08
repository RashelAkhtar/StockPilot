import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token)
      return res.status(401).json({ message: "Not authorized, no access token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await pool.query(
      `SELECT id, name, email FROM users WHERE id = $1`,
      [decoded.id],
    );

    if (user.rows.length === 0)
      return res.status(401).json({ message: "Not authorized, user not found" });

    req.user = user.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Access token expired", code: "TOKEN_EXPIRED" });
    }
    console.error(err);
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};
