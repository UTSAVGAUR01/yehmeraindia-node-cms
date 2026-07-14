import express from "express";
import jwt from "jsonwebtoken";
import { query } from "./db.js";

let installed = false;
let installing = false;
let schemaReady = false;
let schemaPromise = null;

const clean = (value, max = 1000) => String(value ?? "").trim().slice(0, max);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const socialColumns = [
  "instagram_url",
  "facebook_url",
  "x_url",
  "youtube_url",
  "linkedin_url",
  "website_url",
  "other_url",
];

async function columnExists(table, column) {
  const rows = await query(
    `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.total || 0) > 0;
}

async function ensureColumn(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function ensureSocialSchema() {
  await query(`CREATE TABLE IF NOT EXISTS author_profiles (
    user_id BIGINT UNSIGNED NOT NULL,
    bio TEXT NULL,
    instagram_url VARCHAR(1000) NULL,
    facebook_url VARCHAR(1000) NULL,
    x_url VARCHAR(1000) NULL,
    youtube_url VARCHAR(1000) NULL,
    linkedin_url VARCHAR(1000) NULL,
    website_url VARCHAR(1000) NULL,
    other_label VARCHAR(80) NULL,
    other_url VARCHAR(1000) NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await ensureColumn("homepage_content", "footer_instagram_url", "VARCHAR(1000) NULL");
  await ensureColumn("homepage_content", "footer_facebook_url", "VARCHAR(1000) NULL");
  await ensureColumn("homepage_content", "footer_x_url", "VARCHAR(1000) NULL");
  await ensureColumn("homepage_content", "footer_youtube_url", "VARCHAR(1000) NULL");
  await ensureColumn("homepage_content", "footer_linkedin_url", "VARCHAR(1000) NULL");
}

async function requireSchema(res) {
  if (schemaReady) return true;
  if (!schemaPromise) {
    schemaPromise = ensureSocialSchema()
      .then(() => { schemaReady = true; })
      .finally(() => { schemaPromise = null; });
  }
  try {
    await schemaPromise;
    return true;
  } catch (error) {
    console.error("Social profile schema initialization failed:", error.code || error.message);
    res.status(503).json({
      message: "Social profiles are temporarily unavailable because the database could not be prepared.",
      code: String(error.code || "SOCIAL_SCHEMA_ERROR").slice(0, 80),
    });
    return false;
  }
}

async function requireUser(req, res, next) {
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

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

function safeUrl(value, label = "Link") {
  const text = clean(value, 1000);
  if (!text) return "";
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw Object.assign(new Error(`${label} must be a complete http or https address.`), {
      statusCode: 400,
    });
  }
}

function profileInput(body = {}) {
  return {
    bio: clean(body.bio, 1200),
    instagramUrl: safeUrl(body.instagramUrl, "Instagram link"),
    facebookUrl: safeUrl(body.facebookUrl, "Facebook link"),
    xUrl: safeUrl(body.xUrl, "X or Twitter link"),
    youtubeUrl: safeUrl(body.youtubeUrl, "YouTube link"),
    linkedinUrl: safeUrl(body.linkedinUrl, "LinkedIn link"),
    websiteUrl: safeUrl(body.websiteUrl, "Website link"),
    otherLabel: clean(body.otherLabel, 80),
    otherUrl: safeUrl(body.otherUrl, "Other platform link"),
  };
}

function mapProfile(row = {}) {
  return {
    userId: row.user_id ? String(row.user_id) : null,
    name: row.name || "Yeh Mera India Author",
    role: row.role || "author",
    bio: row.bio || "",
    instagramUrl: row.instagram_url || "",
    facebookUrl: row.facebook_url || "",
    xUrl: row.x_url || "",
    youtubeUrl: row.youtube_url || "",
    linkedinUrl: row.linkedin_url || "",
    websiteUrl: row.website_url || "",
    otherLabel: row.other_label || "",
    otherUrl: row.other_url || "",
    updatedAt: row.updated_at || null,
  };
}

async function getProfile(userId) {
  const rows = await query(
    `SELECT u.id AS user_id, u.name, u.role, u.status,
            p.bio, p.instagram_url, p.facebook_url, p.x_url, p.youtube_url,
            p.linkedin_url, p.website_url, p.other_label, p.other_url, p.updated_at
       FROM users u
       LEFT JOIN author_profiles p ON p.user_id = u.id
      WHERE u.id = ? LIMIT 1`,
    [userId],
  );
  return rows[0] ? mapProfile(rows[0]) : null;
}

async function saveProfile(userId, body) {
  const profile = profileInput(body);
  await query(
    `INSERT INTO author_profiles
      (user_id, bio, instagram_url, facebook_url, x_url, youtube_url,
       linkedin_url, website_url, other_label, other_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       bio = VALUES(bio), instagram_url = VALUES(instagram_url),
       facebook_url = VALUES(facebook_url), x_url = VALUES(x_url),
       youtube_url = VALUES(youtube_url), linkedin_url = VALUES(linkedin_url),
       website_url = VALUES(website_url), other_label = VALUES(other_label),
       other_url = VALUES(other_url)`,
    [
      userId,
      profile.bio,
      profile.instagramUrl,
      profile.facebookUrl,
      profile.xUrl,
      profile.youtubeUrl,
      profile.linkedinUrl,
      profile.websiteUrl,
      profile.otherLabel,
      profile.otherUrl,
    ],
  );
  return getProfile(userId);
}

function mapFooter(row = {}) {
  return {
    title: row.contact_title || "Stories, stagecraft and ideas for tomorrow.",
    body: row.contact_body || "Start a conversation with Yeh Mera India and follow new work from the page, stage and AI lab.",
    email: row.contact_email || "support@yehmeraindia.com",
    instagramUrl: row.footer_instagram_url || "",
    facebookUrl: row.footer_facebook_url || "",
    xUrl: row.footer_x_url || "",
    youtubeUrl: row.footer_youtube_url || "",
    linkedinUrl: row.footer_linkedin_url || "",
    updatedAt: row.updated_at || null,
  };
}

function footerInput(body = {}) {
  const email = clean(body.email, 160).toLowerCase();
  if (!emailPattern.test(email)) {
    throw Object.assign(new Error("Enter a valid footer email address."), { statusCode: 400 });
  }
  return {
    title: clean(body.title, 500) || "Stories, stagecraft and ideas for tomorrow.",
    body: clean(body.body, 2000),
    email,
    instagramUrl: safeUrl(body.instagramUrl, "Instagram link"),
    facebookUrl: safeUrl(body.facebookUrl, "Facebook link"),
    xUrl: safeUrl(body.xUrl, "X or Twitter link"),
    youtubeUrl: safeUrl(body.youtubeUrl, "YouTube link"),
    linkedinUrl: safeUrl(body.linkedinUrl, "LinkedIn link"),
  };
}

function installRoutes(app) {
  if (installed || installing) return;
  installing = true;

  app.get("/api/footer-settings", async (_req, res, next) => {
    try {
      if (!(await requireSchema(res))) return;
      const rows = await query(
        `SELECT contact_title, contact_body, contact_email,
                footer_instagram_url, footer_facebook_url, footer_x_url,
                footer_youtube_url, footer_linkedin_url, updated_at
           FROM homepage_content WHERE id = 1 LIMIT 1`,
      );
      res.json(mapFooter(rows[0]));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/profile/socials", requireUser, async (req, res, next) => {
    try {
      if (!(await requireSchema(res))) return;
      const profile = await getProfile(req.user.id);
      res.json({
        profile,
        editable: ["admin", "author"].includes(req.user.role),
        message: ["admin", "author"].includes(req.user.role)
          ? "Add the places where readers can follow your work."
          : "Social follow links become available after an Author role is approved.",
      });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/profile/socials", requireUser, async (req, res, next) => {
    try {
      if (!["admin", "author"].includes(req.user.role)) {
        return res.status(403).json({ message: "Author or Admin access is required to publish follow links." });
      }
      if (!(await requireSchema(res))) return;
      const profile = await saveProfile(req.user.id, req.body || {});
      res.json({ profile, message: "Author follow profile updated." });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/posts/:slug/author-profile", async (req, res, next) => {
    try {
      if (!(await requireSchema(res))) return;
      const rows = await query(
        `SELECT u.id AS user_id, u.name, u.role, u.status,
                ap.bio, ap.instagram_url, ap.facebook_url, ap.x_url,
                ap.youtube_url, ap.linkedin_url, ap.website_url,
                ap.other_label, ap.other_url, ap.updated_at
           FROM posts p
           JOIN users u ON u.id = p.author_id
           LEFT JOIN author_profiles ap ON ap.user_id = u.id
          WHERE p.slug = ? AND p.status = 'published' AND u.status = 'active'
          LIMIT 1`,
        [clean(req.params.slug, 260)],
      );
      res.json({ profile: rows[0] ? mapProfile(rows[0]) : null });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/footer-settings", requireUser, requireAdmin, async (_req, res, next) => {
    try {
      if (!(await requireSchema(res))) return;
      const rows = await query(
        `SELECT contact_title, contact_body, contact_email,
                footer_instagram_url, footer_facebook_url, footer_x_url,
                footer_youtube_url, footer_linkedin_url, updated_at
           FROM homepage_content WHERE id = 1 LIMIT 1`,
      );
      res.json(mapFooter(rows[0]));
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/footer-settings", requireUser, requireAdmin, async (req, res, next) => {
    try {
      if (!(await requireSchema(res))) return;
      const settings = footerInput(req.body || {});
      const result = await query(
        `UPDATE homepage_content
            SET contact_title = ?, contact_body = ?, contact_email = ?,
                footer_instagram_url = ?, footer_facebook_url = ?, footer_x_url = ?,
                footer_youtube_url = ?, footer_linkedin_url = ?, updated_by = ?
          WHERE id = 1`,
        [
          settings.title,
          settings.body,
          settings.email,
          settings.instagramUrl,
          settings.facebookUrl,
          settings.xUrl,
          settings.youtubeUrl,
          settings.linkedinUrl,
          req.user.id,
        ],
      );
      if (!Number(result.affectedRows || 0)) {
        return res.status(409).json({ message: "Homepage footer settings are not initialized yet." });
      }
      res.json({ ...settings, message: "Footer design settings updated." });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/authors/socials", requireUser, requireAdmin, async (_req, res, next) => {
    try {
      if (!(await requireSchema(res))) return;
      const rows = await query(
        `SELECT u.id AS user_id, u.name, u.role, u.status,
                ap.bio, ap.instagram_url, ap.facebook_url, ap.x_url,
                ap.youtube_url, ap.linkedin_url, ap.website_url,
                ap.other_label, ap.other_url, ap.updated_at
           FROM users u
           LEFT JOIN author_profiles ap ON ap.user_id = u.id
          WHERE u.role IN ('author', 'admin')
          ORDER BY u.name, u.id`,
      );
      res.json(rows.map(mapProfile));
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/authors/:id/socials", requireUser, requireAdmin, async (req, res, next) => {
    try {
      if (!(await requireSchema(res))) return;
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId < 1) {
        return res.status(400).json({ message: "Choose a valid author." });
      }
      const users = await query(
        "SELECT id, role, status FROM users WHERE id = ? AND role IN ('author', 'admin') LIMIT 1",
        [userId],
      );
      if (!users.length) return res.status(404).json({ message: "Author account not found." });
      const profile = await saveProfile(userId, req.body || {});
      res.json({ profile, message: "Author follow profile updated by Admin." });
    } catch (error) {
      next(error);
    }
  });

  installed = true;
  installing = false;
}

const previousUse = express.application.use;
express.application.use = function socialFooterAwareUse(...args) {
  const result = previousUse.apply(this, args);
  const middleware = args.length === 1 && typeof args[0] === "function" ? args[0] : null;
  if (!installed && !installing && middleware?.name === "jsonParser") {
    installRoutes(this);
  }
  return result;
};
