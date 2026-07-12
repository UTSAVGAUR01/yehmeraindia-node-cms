import "dotenv/config";
import express from "express";

const clean = (value) => String(value ?? "").trim();

process.env.DB_HOST = clean(process.env.DB_HOST || process.env.MYSQL_HOST || "127.0.0.1");
process.env.DB_PORT = clean(process.env.DB_PORT || process.env.MYSQL_PORT || "3306");
process.env.DB_USER = clean(process.env.DB_USER || process.env.MYSQL_USER || "");
process.env.DB_PASSWORD = String(process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? "");
process.env.DB_NAME = clean(process.env.DB_NAME || process.env.MYSQL_DATABASE || "");
process.env.DB_CONNECTION_LIMIT = clean(process.env.DB_CONNECTION_LIMIT || "5");

const originalUse = express.application.use;
let healthRouteInstalled = false;

express.application.use = function patchedUse(...args) {
  if (!healthRouteInstalled && args[0] === "/api") {
    healthRouteInstalled = true;
    this.get("/api/health/database", async (_req, res) => {
      try {
        const { query } = await import("./db.js");
        const rows = await query("SELECT DATABASE() AS database_name, NOW() AS server_time");
        return res.json({
          connected: true,
          database: rows[0]?.database_name || null,
          host: process.env.DB_HOST || null,
          port: Number(process.env.DB_PORT || 3306),
          serverTime: rows[0]?.server_time || null,
        });
      } catch (error) {
        return res.status(503).json({
          connected: false,
          code: String(error?.code || "UNKNOWN").slice(0, 80),
          database: process.env.DB_NAME || null,
          host: process.env.DB_HOST || null,
          port: Number(process.env.DB_PORT || 3306),
        });
      }
    });
  }
  return originalUse.apply(this, args);
};
