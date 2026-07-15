import express from "express";
import jwt from "jsonwebtoken";
import { query } from "./db.js";

let installed = false;
let installing = false;
let schemaReady = false;
let schemaPromise = null;

function clampInterval(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) return 5;
  return Math.min(60, Math.max(2, Math.round(seconds)));
}

async function ensureSchema() {
  await query(`CREATE TABLE IF NOT EXISTS carousel_settings (
    id TINYINT UNSIGNED NOT NULL DEFAULT 1,
    interval_seconds TINYINT UNSIGNED NOT NULL DEFAULT 5,
    updated_by BIGINT UNSIGNED NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_carousel_settings_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
  )`);
  await query("INSERT IGNORE INTO carousel_settings (id, interval_seconds) VALUES (1, 5)");
}

async function ready() {
  if (schemaReady) return;
  if (!schemaPromise) {
    schemaPromise = ensureSchema()
      .then(() => { schemaReady = true; })
      .finally(() => { schemaPromise = null; });
  }
  await schemaPromise;
}

async function requireAdmin(req, res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: "Admin sign in required." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rows = await query(
      "SELECT id, role, status FROM users WHERE id = ? LIMIT 1",
      [decoded.id],
    );
    if (!rows.length || rows[0].status !== "active" || rows[0].role !== "admin") {
      return res.status(403).json({ message: "Admin access required." });
    }
    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
    next(error);
  }
}

function installRoutes(app) {
  if (installed || installing) return;
  installing = true;

  app.get("/api/carousel-settings", async (_req, res, next) => {
    try {
      await ready();
      const rows = await query(
        "SELECT interval_seconds, updated_at FROM carousel_settings WHERE id = 1 LIMIT 1",
      );
      res.json({
        intervalSeconds: clampInterval(rows[0]?.interval_seconds),
        updatedAt: rows[0]?.updated_at || null,
      });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/carousel-settings", requireAdmin, async (req, res, next) => {
    try {
      await ready();
      const raw = Number(req.body?.intervalSeconds);
      if (!Number.isFinite(raw) || raw < 2 || raw > 60) {
        return res.status(400).json({ message: "Choose an auto-scroll interval from 2 to 60 seconds." });
      }
      const intervalSeconds = clampInterval(raw);
      await query(
        `INSERT INTO carousel_settings (id, interval_seconds, updated_by)
         VALUES (1, ?, ?)
         ON DUPLICATE KEY UPDATE interval_seconds = VALUES(interval_seconds), updated_by = VALUES(updated_by)`,
        [intervalSeconds, req.user.id],
      );
      res.json({
        intervalSeconds,
        message: "Homepage carousel timing saved.",
      });
    } catch (error) {
      next(error);
    }
  });

  installed = true;
  installing = false;
}

const previousUse = express.application.use;
express.application.use = function carouselSettingsAwareUse(...args) {
  const result = previousUse.apply(this, args);
  const middleware = args.length === 1 && typeof args[0] === "function" ? args[0] : null;
  if (!installed && !installing && middleware?.name === "jsonParser") {
    installRoutes(this);
  }
  return result;
};
