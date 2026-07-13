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
const originalPut = express.application.put;
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

function normalizeKeywords(value) {
  const source = Array.isArray(value) ? value : String(value || "").split(/[,\n]+/);
  return [...new Set(source.map((item) => String(item).trim().replace(/^#+/, "")).filter(Boolean))]
    .slice(0, 30)
    .map((item) => item.slice(0, 60))
    .join(", ");
}

function normalizeExternalUrl(value, label) {
  const text = String(value || "").trim();
  if (!text) throw Object.assign(new Error(`${label} is required.`), { statusCode: 400 });
  if (text.length > 2000)
    throw Object.assign(new Error(`${label} is too long.`), { statusCode: 400 });
  try {
    const url = new URL(text);
    if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw Object.assign(new Error(`${label} must be a complete http or https link.`), {
      statusCode: 400,
    });
  }
}

function mapBook(row) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description || "",
    purchaseUrl: row.purchase_url || "",
    coverImage: row.cover_image || "",
    imagePrompt: row.image_prompt || "",
    keywords: String(row.keywords || "").split(/[,\n]+/).map((item) => item.trim()).filter(Boolean),
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorId: row.author_id ? String(row.author_id) : null,
    authorName: row.author_name || "",
  };
}

function sendCatalogDatabaseError(error, res, next) {
  const code = String(error?.code || "");
  const messages = {
    ER_NET_PACKET_TOO_LARGE: "The cover image is too large for the database. Upload a smaller WebP or JPEG image and try again.",
    ER_DATA_TOO_LONG: "One of the book fields is too large for the database column.",
    ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: "The book contains a value that does not match the database field type.",
    ER_BAD_NULL_ERROR: "A required book field is missing.",
    ER_NO_REFERENCED_ROW_2: "The assigned author account no longer exists.",
    ER_ROW_IS_REFERENCED_2: "This book is referenced by another record and cannot be changed that way.",
  };

  if (error?.statusCode)
    return res.status(error.statusCode).json({ message: error.message });

  if (code.startsWith("ER_")) {
    return res.status(code === "ER_NET_PACKET_TOO_LARGE" ? 413 : 422).json({
      message: messages[code] || `The book could not be saved because MariaDB returned ${code}.`,
      code: code.slice(0, 80),
    });
  }

  return next(error);
}

express.application.put = function patchedPut(path, ...handlers) {
  if (path === "/api/admin/books/:id" && handlers.length) {
    const routeIndex = handlers.length - 1;
    handlers[routeIndex] = async function reliableBookUpdate(req, res, next) {
      try {
        const { query } = await import("./db.js");
        const rows = await query("SELECT * FROM books WHERE id = ? LIMIT 1", [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: "Book not found." });

        const existing = rows[0];
        const canManage = req.user?.role === "admin" ||
          (req.user?.role === "author" && String(existing.author_id) === String(req.user.id));
        if (!canManage)
          return res.status(403).json({ message: "You can only update your own books." });

        const body = req.body || {};
        const title = String(body.title || "").trim();
        const description = String(body.description || "").trim();
        if (!title || !description)
          return res.status(400).json({ message: "Book title and description are required." });
        if (title.length > 220)
          return res.status(400).json({ message: "Book title must be 220 characters or fewer." });

        const purchaseUrl = normalizeExternalUrl(body.purchaseUrl, "Purchase link");
        const status = body.status === "published" ? "published" : "draft";
        const imagePrompt = String(body.imagePrompt || "");
        const keywords = normalizeKeywords(body.keywords);
        const requestedCover = Object.prototype.hasOwnProperty.call(body, "coverImage")
          ? String(body.coverImage || "")
          : String(existing.cover_image || "");
        const coverChanged = requestedCover !== String(existing.cover_image || "");

        if (coverChanged && Buffer.byteLength(requestedCover, "utf8") > 7 * 1024 * 1024) {
          return res.status(413).json({
            message: "The new cover image is too large. Upload a smaller WebP or JPEG image under 5 MB.",
          });
        }

        const assignments = [
          "title = ?",
          "description = ?",
          "purchase_url = ?",
          "image_prompt = ?",
          "keywords = ?",
          "status = ?",
        ];
        const params = [title, description, purchaseUrl, imagePrompt, keywords, status];

        // Do not resend a large stored data URL when only text or status changed.
        if (coverChanged) {
          assignments.push("cover_image = ?");
          params.push(requestedCover);
        }

        assignments.push(
          "published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, NOW()) ELSE NULL END",
        );
        params.push(status, req.params.id);

        await query(`UPDATE books SET ${assignments.join(", ")} WHERE id = ?`, params);
        const savedRows = await query(
          `SELECT b.*, u.name AS author_name
             FROM books b
             LEFT JOIN users u ON u.id = b.author_id
            WHERE b.id = ? LIMIT 1`,
          [req.params.id],
        );
        return res.json(mapBook(savedRows[0]));
      } catch (error) {
        return sendCatalogDatabaseError(error, res, next);
      }
    };
  }

  return originalPut.call(this, path, ...handlers);
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
        return res.status(code === "ER_NET_PACKET_TOO_LARGE" ? 413 : 422).json({
          message: `The catalog request failed with MariaDB code ${code}.`,
          code: code.slice(0, 80),
        });
      }

      return originalErrorHandler(error, req, res, next);
    };
    return originalUse.call(this, wrappedErrorHandler);
  }

  return originalUse.apply(this, args);
};
