import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "./db.js";

let installed = false;
let installing = false;

const clean = (value, max = 500) => String(value || "").trim().slice(0, max);

function validPassword(value) {
  const password = String(value || "");
  return password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
}

async function columnExists(table, column) {
  const rows = await query(
    `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.total || 0) > 0;
}

async function ensureProfileSchema() {
  if (!(await columnExists("users", "password_changed_at"))) {
    await query("ALTER TABLE users ADD COLUMN password_changed_at DATETIME NULL");
  }
}

async function requireMember(req, res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: "Sign in required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rows = await query(
      "SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1",
      [decoded.id],
    );
    if (!rows.length || rows[0].status !== "active") {
      return res.status(401).json({ message: "This account is not active." });
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

function publicUser(user) {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

function installProfileRoutes(app) {
  if (installed || installing) return;
  installing = true;

  let schemaReady = false;
  let schemaPromise = null;

  async function requirePasswordSchema(res) {
    if (schemaReady) return true;
    if (!schemaPromise) {
      schemaPromise = ensureProfileSchema()
        .then(() => { schemaReady = true; })
        .finally(() => { schemaPromise = null; });
    }
    try {
      await schemaPromise;
      return true;
    } catch (error) {
      console.error("Profile schema initialization failed:", error.code || error.message);
      res.status(503).json({
        message: "Password change is temporarily unavailable because the database could not be prepared.",
        code: String(error.code || "PROFILE_SCHEMA_ERROR").slice(0, 80),
      });
      return false;
    }
  }

  app.get("/api/profile", requireMember, async (req, res, next) => {
    try {
      res.json({ user: publicUser(req.user) });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/profile", requireMember, async (req, res, next) => {
    try {
      const name = clean(req.body?.name, 120);
      if (name.length < 2) {
        return res.status(400).json({ message: "Name must contain at least 2 characters." });
      }

      await query("UPDATE users SET name = ? WHERE id = ?", [name, req.user.id]);
      const rows = await query(
        "SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1",
        [req.user.id],
      );
      res.json({ user: publicUser(rows[0]), message: "Profile name updated." });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/profile/password", requireMember, async (req, res, next) => {
    try {
      if (!(await requirePasswordSchema(res))) return;
      const currentPassword = String(req.body?.currentPassword || "");
      const newPassword = String(req.body?.newPassword || "");
      const confirmPassword = String(req.body?.confirmPassword || "");

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "Complete all password fields." });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "The new passwords do not match." });
      }
      if (!validPassword(newPassword)) {
        return res.status(400).json({
          message: "Use at least 10 characters with uppercase, lowercase and a number.",
        });
      }
      if (currentPassword === newPassword) {
        return res.status(400).json({ message: "Choose a new password different from the current password." });
      }

      const rows = await query("SELECT password FROM users WHERE id = ? LIMIT 1", [req.user.id]);
      if (!rows.length || !(await bcrypt.compare(currentPassword, rows[0].password))) {
        return res.status(400).json({ message: "Current password is incorrect." });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await query(
        "UPDATE users SET password = ?, password_changed_at = NOW() WHERE id = ?",
        [passwordHash, req.user.id],
      );
      await query(
        "UPDATE auth_codes SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL",
        [req.user.id],
      ).catch(() => {});
      await query(
        "UPDATE password_reset_tokens SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL",
        [req.user.id],
      ).catch(() => {});
      await query(
        "UPDATE password_reset_codes SET consumed_at = NOW(), reset_token_hash = NULL WHERE user_id = ? AND consumed_at IS NULL",
        [req.user.id],
      ).catch(() => {});

      res.json({ message: "Password changed successfully. Please sign in again." });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/profile/journal-messages", requireMember, async (req, res, next) => {
    try {
      const rows = await query(
        `SELECT m.id, m.message, m.is_read, m.created_at,
                p.id AS post_id, p.title AS post_title, p.slug AS post_slug,
                a.id AS author_id, a.name AS author_name
           FROM author_messages m
           JOIN posts p ON p.id = m.post_id
           LEFT JOIN users a ON a.id = m.author_id
          WHERE m.viewer_id = ?
          ORDER BY m.created_at DESC, m.id DESC`,
        [req.user.id],
      );

      res.json(rows.map((row) => ({
        id: String(row.id),
        message: row.message,
        isReadByAuthor: Boolean(row.is_read),
        createdAt: row.created_at,
        postId: String(row.post_id),
        postTitle: row.post_title,
        postSlug: row.post_slug,
        authorId: row.author_id ? String(row.author_id) : null,
        authorName: row.author_name || "Yeh Mera India",
      })));
    } catch (error) {
      next(error);
    }
  });

  installed = true;
  installing = false;
}

const previousUse = express.application.use;
express.application.use = function profileAwareUse(...args) {
  const result = previousUse.apply(this, args);
  const middleware = args.length === 1 && typeof args[0] === "function" ? args[0] : null;
  if (!installed && !installing && middleware?.name === "jsonParser") {
    installProfileRoutes(this);
  }
  return result;
};
