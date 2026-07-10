import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { initializeDatabase, query } from "./db.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const indexHtml = path.join(distDir, "index.html");
const port = Number(process.env.PORT || 3000);
let databaseState = {
  connected: false,
  message: "Database initialization pending.",
};

const app = express();
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype))
      return cb(new Error("Choose a JPG, PNG, WebP or GIF image."));
    cb(null, true);
  },
});

function mapPost(row) {
  return {
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || "",
    content: row.content || "",
    category: row.category || "Journal",
    status: row.status,
    coverImage: row.cover_image || "",
    imageAlt: row.image_alt || row.title,
    featured: Boolean(row.featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    authorName: row.author_name || "",
  };
}

function cleanSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function signToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured.");
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

function requireAuth(req, res, next) {
  const token = String(req.headers.authorization || "").replace(
    /^Bearer\s+/i,
    "",
  );
  if (!token || !process.env.JWT_SECRET)
    return res.status(401).json({ message: "Sign in required." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please sign in again." });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admin access required." });
    next();
  });
}

async function createAiCover(post) {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("OPENAI_API_KEY is not configured.");
  const prompt = [
    "Create a wide editorial cover illustration for Yeh Mera India.",
    `Article: ${post.title}.`,
    post.excerpt ? `Context: ${post.excerpt}.` : "",
    `Theme: ${post.category || "Journal"}.`,
    "Cinematic Indian theatre heritage, deep indigo, warm saffron, ivory manuscript texture, culturally respectful, premium literary magazine, atmospheric stage lighting, no text, no logo, no watermark.",
  ]
    .filter(Boolean)
    .join(" ");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt,
      size: "1536x1024",
      quality: "medium",
      output_format: "webp",
    }),
    signal: AbortSignal.timeout(45000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error?.message || "AI image generation failed.");
  const encoded = result.data?.[0]?.b64_json;
  if (!encoded) throw new Error("AI image generation returned no image.");
  return `data:image/webp;base64,${encoded}`;
}

function responseText(result) {
  if (result.output_text) return result.output_text;
  for (const item of result.output || []) {
    for (const part of item.content || []) {
      if (part.type === "output_text" && part.text) return part.text;
    }
  }
  return "";
}

async function rewritePostWithAi({ title, category, excerpt, content }) {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("OPENAI_API_KEY is not configured.");
  if (!String(excerpt || "").trim() && !String(content || "").trim())
    throw new Error("Add a short introduction or article content first.");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5.6-luna",
      store: false,
      instructions: [
        "You are the editorial assistant for Yeh Mera India, an Indian author and theatre platform.",
        "Rewrite the supplied short introduction and article into polished, natural, engaging prose.",
        "Preserve the author's meaning, point of view, language, names and factual claims.",
        "Do not invent facts, quotations, dates, people, sources or experiences.",
        "Keep paragraph breaks in the article. Return only the requested structured fields.",
      ].join(" "),
      input: JSON.stringify({
        title: title || "",
        category: category || "Journal",
        shortIntroduction: excerpt || "",
        articleContent: content || "",
      }),
      text: {
        format: {
          type: "json_schema",
          name: "rewritten_post",
          strict: true,
          schema: {
            type: "object",
            properties: {
              excerpt: { type: "string" },
              content: { type: "string" },
            },
            required: ["excerpt", "content"],
            additionalProperties: false,
          },
        },
      },
    }),
    signal: AbortSignal.timeout(60000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error?.message || "AI rewrite failed.");
  const text = responseText(result);
  if (!text) throw new Error("AI rewrite returned no text.");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      "AI rewrite returned an invalid response. Please try again.",
    );
  }
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "Yeh Mera India CMS",
    database: databaseState.connected ? "connected" : "unavailable",
  });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    const rows = await query(
      "SELECT DATABASE() AS database_name, (SELECT COUNT(*) FROM users) AS total_users, (SELECT COUNT(*) FROM posts) AS total_posts",
    );
    res.json({ status: "ok", database: "connected", ...rows[0] });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", database: "failed", message: error.message });
  }
});

app.get("/api/posts", async (req, res, next) => {
  try {
    const params = [];
    let categorySql = "";
    if (req.query.category) {
      categorySql = " AND p.category = ?";
      params.push(req.query.category);
    }
    const rows = await query(
      `SELECT p.*, u.name AS author_name FROM posts p
       LEFT JOIN users u ON u.id = p.author_id
       WHERE p.status = 'published'${categorySql}
       ORDER BY COALESCE(p.published_at, p.created_at) DESC`,
      params,
    );
    res.json(rows.map(mapPost));
  } catch (error) {
    next(error);
  }
});

app.get("/api/posts/:slug", async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT p.*, u.name AS author_name FROM posts p
       LEFT JOIN users u ON u.id = p.author_id
       WHERE p.slug = ? AND p.status = 'published' LIMIT 1`,
      [req.params.slug],
    );
    if (!rows.length)
      return res.status(404).json({ message: "Post not found." });
    res.json(mapPost(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/signup", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: "Name, email and password are required." });
    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    const existing = await query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [email],
    );
    if (existing.length)
      return res
        .status(409)
        .json({ message: "An account already exists with this email." });
    const hashed = await bcrypt.hash(password, 12);
    const result = await query(
      "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'user', 'active')",
      [name, email, hashed],
    );
    const user = {
      id: result.insertId,
      name,
      email,
      role: "user",
      status: "active",
    };
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/signin", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    const rows = await query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [email],
    );
    const user = rows[0];
    if (
      !user ||
      user.status !== "active" ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1",
      [req.user.id],
    );
    if (!rows.length || rows[0].status !== "active")
      return res.status(404).json({ message: "Account not found." });
    res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    const rows = await query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [email],
    );
    const user = rows[0];
    if (
      !user ||
      user.status !== "active" ||
      user.role !== "admin" ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res
        .status(401)
        .json({ message: "Incorrect admin email or password." });
    }
    res.json({
      token: signToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/posts", requireAdmin, async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT p.*, u.name AS author_name FROM posts p
       LEFT JOIN users u ON u.id = p.author_id ORDER BY p.updated_at DESC`,
    );
    res.json(rows.map(mapPost));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/rewrite", requireAdmin, async (req, res, next) => {
  try {
    const rewritten = await rewritePostWithAi(req.body || {});
    res.json(rewritten);
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/admin/upload",
  requireAdmin,
  upload.single("image"),
  (req, res) => {
    if (!req.file)
      return res.status(400).json({ message: "Choose an image up to 4 MB." });
    res
      .status(201)
      .json({
        url: `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      });
  },
);

app.post("/api/admin/posts", requireAdmin, async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const slug = cleanSlug(req.body.slug || title);
    const content = String(req.body.content || "").trim();
    if (!title || !slug || !content)
      return res
        .status(400)
        .json({ message: "Title, slug and content are required." });
    const coverImage = String(req.body.coverImage || "");
    const status = req.body.status === "published" ? "published" : "draft";
    const result = await query(
      `INSERT INTO posts
       (author_id, title, slug, excerpt, content, cover_image, image_alt, category, status, featured, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${status === "published" ? "NOW()" : "NULL"})`,
      [
        req.user.id,
        title,
        slug,
        String(req.body.excerpt || ""),
        content,
        coverImage,
        String(req.body.imageAlt || title),
        String(req.body.category || "Journal"),
        status,
        req.body.featured ? 1 : 0,
      ],
    );
    const rows = await query("SELECT * FROM posts WHERE id = ?", [
      result.insertId,
    ]);
    const savedPost = mapPost(rows[0]);
    res.status(201).json(savedPost);
    if (!coverImage && req.body.generateImage) {
      createAiCover(req.body)
        .then((generated) =>
          query("UPDATE posts SET cover_image = ? WHERE id = ?", [
            generated,
            result.insertId,
          ]),
        )
        .then(() =>
          console.log(`AI cover generated for post ${result.insertId}.`),
        )
        .catch((error) =>
          console.error(
            `Background AI cover failed for post ${result.insertId}:`,
            error.message,
          ),
        );
    }
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({ message: "That post URL is already in use." });
    next(error);
  }
});

app.put("/api/admin/posts/:id", requireAdmin, async (req, res, next) => {
  try {
    const existing = await query("SELECT * FROM posts WHERE id = ? LIMIT 1", [
      req.params.id,
    ]);
    if (!existing.length)
      return res.status(404).json({ message: "Post not found." });
    const title = String(req.body.title || "").trim();
    const slug = cleanSlug(req.body.slug || title);
    const content = String(req.body.content || "").trim();
    if (!title || !slug || !content)
      return res
        .status(400)
        .json({ message: "Title, slug and content are required." });
    const coverImage = String(req.body.coverImage || "");
    const status = req.body.status === "published" ? "published" : "draft";
    await query(
      `UPDATE posts SET title = ?, slug = ?, excerpt = ?, content = ?, cover_image = ?, image_alt = ?,
       category = ?, status = ?, featured = ?, published_at = ${status === "published" ? "COALESCE(published_at, NOW())" : "NULL"}
       WHERE id = ?`,
      [
        title,
        slug,
        String(req.body.excerpt || ""),
        content,
        coverImage,
        String(req.body.imageAlt || title),
        String(req.body.category || "Journal"),
        status,
        req.body.featured ? 1 : 0,
        req.params.id,
      ],
    );
    const rows = await query("SELECT * FROM posts WHERE id = ?", [
      req.params.id,
    ]);
    res.json(mapPost(rows[0]));
    if (!coverImage && req.body.generateImage) {
      createAiCover(req.body)
        .then((generated) =>
          query("UPDATE posts SET cover_image = ? WHERE id = ?", [
            generated,
            req.params.id,
          ]),
        )
        .then(() =>
          console.log(`AI cover generated for post ${req.params.id}.`),
        )
        .catch((error) =>
          console.error(
            `Background AI cover failed for post ${req.params.id}:`,
            error.message,
          ),
        );
    }
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({ message: "That post URL is already in use." });
    next(error);
  }
});

app.post(
  "/api/admin/posts/:id/generate-image",
  requireAdmin,
  async (req, res, next) => {
    try {
      const rows = await query("SELECT * FROM posts WHERE id = ? LIMIT 1", [
        req.params.id,
      ]);
      if (!rows.length)
        return res.status(404).json({ message: "Post not found." });
      const coverImage = await createAiCover({
        ...mapPost(rows[0]),
        excerpt: req.body?.prompt || rows[0].excerpt,
      });
      await query("UPDATE posts SET cover_image = ? WHERE id = ?", [
        coverImage,
        req.params.id,
      ]);
      const updated = await query("SELECT * FROM posts WHERE id = ?", [
        req.params.id,
      ]);
      res.json(mapPost(updated[0]));
    } catch (error) {
      next(error);
    }
  },
);

app.delete("/api/admin/posts/:id", requireAdmin, async (req, res, next) => {
  try {
    const result = await query("DELETE FROM posts WHERE id = ?", [
      req.params.id,
    ]);
    if (!result.affectedRows)
      return res.status(404).json({ message: "Post not found." });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use("/api", (_req, res) =>
  res.status(404).json({ message: "API route not found." }),
);

if (fs.existsSync(indexHtml)) {
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => res.sendFile(indexHtml));
} else {
  app.get("/", (_req, res) =>
    res
      .status(200)
      .send("Yeh Mera India API is running. Frontend build is missing."),
  );
}

app.use((error, _req, res, _next) => {
  console.error("Request error:", error.message);
  if (error instanceof multer.MulterError)
    return res.status(400).json({ message: error.message });
  const databaseError =
    String(error.code || "").startsWith("ER_") ||
    ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND"].includes(error.code);
  res
    .status(databaseError ? 503 : 500)
    .json({
      message: databaseError
        ? "Database is temporarily unavailable."
        : error.message || "Something went wrong.",
    });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Yeh Mera India server listening on 0.0.0.0:${port}`);
  console.log(`Frontend build present: ${fs.existsSync(indexHtml)}`);
});

initializeDatabase()
  .then(() => {
    databaseState = { connected: true, message: "Database connected." };
    console.log("MySQL database connected and schema ready.");
  })
  .catch((error) => {
    databaseState = { connected: false, message: error.message };
    console.error("MySQL initialization failed:", error.message);
  });
