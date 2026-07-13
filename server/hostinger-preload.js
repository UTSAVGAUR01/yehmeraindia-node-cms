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
let healthRoutesInstalled = false;

const requiredCatalogColumns = {
  posts: [
    "id", "author_id", "title", "slug", "excerpt", "content", "cover_image",
    "image_alt", "keywords", "category", "status", "featured", "published_at",
    "created_at", "updated_at",
  ],
  books: [
    "id", "author_id", "title", "description", "purchase_url", "cover_image",
    "image_prompt", "keywords", "status", "published_at", "created_at", "updated_at",
  ],
  play_events: [
    "id", "author_id", "play_title", "event_title", "description", "venue",
    "event_at", "ticket_url", "keywords", "status", "published_at", "created_at",
    "updated_at",
  ],
  social_videos: [
    "id", "author_id", "title", "description", "video_url", "platform", "keywords",
    "related_type", "related_id", "status", "published_at", "created_at", "updated_at",
  ],
};

function installHealthRoutes(app) {
  app.get("/api/health/database", async (_req, res) => {
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

  app.get("/api/health/catalog", async (_req, res) => {
    try {
      const { query } = await import("./db.js");
      const tables = Object.keys(requiredCatalogColumns);
      const rows = await query(
        `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, COLUMN_TYPE AS column_type
           FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN (${tables.map(() => "?").join(",")})
          ORDER BY TABLE_NAME, ORDINAL_POSITION`,
        tables,
      );

      const present = new Map();
      for (const row of rows) {
        if (!present.has(row.table_name)) present.set(row.table_name, new Map());
        present.get(row.table_name).set(row.column_name, row.column_type);
      }

      const checks = {};
      let ready = true;
      for (const [table, required] of Object.entries(requiredCatalogColumns)) {
        const columns = present.get(table) || new Map();
        const missingColumns = required.filter((column) => !columns.has(column));
        checks[table] = {
          exists: present.has(table),
          missingColumns,
          columnTypes: Object.fromEntries(columns),
        };
        if (!present.has(table) || missingColumns.length) ready = false;
      }

      return res.status(ready ? 200 : 500).json({
        connected: true,
        ready,
        database: process.env.DB_NAME || null,
        checks,
      });
    } catch (error) {
      return res.status(503).json({
        connected: false,
        ready: false,
        code: String(error?.code || "UNKNOWN").slice(0, 80),
      });
    }
  });
}

express.application.use = function patchedUse(...args) {
  if (!healthRoutesInstalled && args[0] === "/api") {
    healthRoutesInstalled = true;
    installHealthRoutes(this);
  }

  if (args.length === 1 && typeof args[0] === "function" && args[0].length === 4) {
    const originalErrorHandler = args[0];
    const wrappedErrorHandler = function catalogAwareErrorHandler(error, req, res, next) {
      const code = String(error?.code || "");
      const connectionCodes = new Set(["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "PROTOCOL_CONNECTION_LOST"]);
      const isCatalogRoute = /^\/api\/(admin\/)?(books|play-events|videos|posts)(\/|$)/.test(req.path || "");

      if (isCatalogRoute && code.startsWith("ER_") && !connectionCodes.has(code)) {
        return res.status(500).json({
          message: "The catalog request was rejected by the database schema.",
          code: code.slice(0, 80),
        });
      }

      return originalErrorHandler(error, req, res, next);
    };
    return originalUse.call(this, wrappedErrorHandler);
  }

  return originalUse.apply(this, args);
};
