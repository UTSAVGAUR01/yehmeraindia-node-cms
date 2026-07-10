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

const TEXT_MODELS = [
  { id: "gpt-5.5", label: "GPT-5.5 · Best quality" },
  { id: "gpt-5.4", label: "GPT-5.4 · Balanced" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 mini · Lower cost" },
  { id: "gpt-5-mini", label: "GPT-5 mini · Fast" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini · Compatible" },
];
const IMAGE_MODELS = [
  { id: "gpt-image-2", label: "GPT Image 2 · Best quality" },
  { id: "gpt-image-1-mini", label: "GPT Image 1 mini · Lower cost" },
  { id: "gpt-image-1", label: "GPT Image 1 · Previous generation" },
];

const app = express();
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
// Uploaded images are converted to data URLs before the CMS saves them.
// A 4 MB binary image becomes roughly 5.4 MB after base64 encoding.
app.use(express.json({ limit: "8mb" }));

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
    authorId: row.author_id ? String(row.author_id) : null,
    authorName: row.author_name || "",
  };
}

function mapHomepage(row = {}) {
  return {
    heroEyebrow: row.hero_eyebrow || "",
    heroTitle: row.hero_title || "",
    heroBody: row.hero_body || "",
    heroImage: row.hero_image || "",
    aboutEyebrow: row.about_eyebrow || "",
    aboutTitle: row.about_title || "",
    aboutBody: row.about_body || "",
    aboutImage: row.about_image || "",
    workEyebrow: row.work_eyebrow || "Selected work",
    workTitle: row.work_title || "",
    workBody: row.work_body || "",
    workImage: row.work_image || "",
    aiEyebrow: row.ai_eyebrow || "The AI Lab",
    aiTitle: row.ai_title || "",
    aiBody: row.ai_body || "",
    aiImage: row.ai_image || "",
    journalEyebrow: row.journal_eyebrow || "From the journal",
    journalTitle: row.journal_title || "Notes from the page, stage and lab.",
    journalBody: row.journal_body || "",
    journalImage: row.journal_image || "",
    contactTitle: row.contact_title || "Stories, stagecraft and ideas for tomorrow.",
    contactBody: row.contact_body || "",
    contactImage: row.contact_image || "",
    contactEmail: row.contact_email || "hello@yehmeraindia.com",
    journalPageEyebrow: row.journal_page_eyebrow || "Yeh Mera India Journal",
    journalPageTitle: row.journal_page_title || "Ideas from the page, the stage and the future.",
    journalPageBody: row.journal_page_body || "",
    journalPageImage: row.journal_page_image || "",
    updatedAt: row.updated_at || null,
  };
}

function mapAiSettings(row = {}) {
  const configuredAdmin = String(row.admin_text_model || process.env.OPENAI_TEXT_MODEL || "");
  const adminTextModel = TEXT_MODELS.some((model) => model.id === configuredAdmin)
    ? configuredAdmin
    : "gpt-5.5";
  const configuredAuthor = String(
    row.author_text_model || process.env.OPENAI_AUTHOR_TEXT_MODEL || adminTextModel,
  );
  const authorTextModel = TEXT_MODELS.some((model) => model.id === configuredAuthor)
    ? configuredAuthor
    : adminTextModel;
  const configuredImage = String(row.image_model || process.env.OPENAI_IMAGE_MODEL || "");
  const imageModel = IMAGE_MODELS.some((model) => model.id === configuredImage)
    ? configuredImage
    : "gpt-image-2";
  return {
    adminTextModel,
    authorTextModel,
    imageModel,
    updatedAt: row.updated_at || null,
  };
}

async function getAiSettings() {
  const rows = await query("SELECT * FROM ai_settings WHERE id = 1 LIMIT 1");
  return mapAiSettings(rows[0]);
}

async function modelsForUser(user) {
  const settings = await getAiSettings();
  return {
    textModel: user?.role === "author" ? settings.authorTextModel : settings.adminTextModel,
    imageModel: settings.imageModel,
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

async function requireAuth(req, res, next) {
  const token = String(req.headers.authorization || "").replace(
    /^Bearer\s+/i,
    "",
  );
  if (!token || !process.env.JWT_SECRET)
    return res.status(401).json({ message: "Sign in required." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rows = await query(
      "SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1",
      [decoded.id],
    );
    if (!rows.length || rows[0].status !== "active")
      return res.status(401).json({ message: "This account is not active." });
    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
      return res
        .status(401)
        .json({ message: "Session expired. Please sign in again." });
    next(error);
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, (error) => {
    if (error) return next(error);
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admin access required." });
    next();
  });
}

function requireStaff(req, res, next) {
  requireAuth(req, res, (error) => {
    if (error) return next(error);
    if (!['admin', 'author'].includes(req.user.role))
      return res.status(403).json({ message: "Author access required." });
    next();
  });
}

function canManagePost(user, post) {
  return user.role === "admin" ||
    (user.role === "author" && String(post.author_id) === String(user.id));
}

function aiError(error, status) {
  if (status === 401) return "The AI API key is invalid. Update OPENAI_API_KEY in the hosting environment.";
  if (status === 429) return "The AI account has reached its quota or rate limit. Add API credits or try again later.";
  if (error?.code === "invalid_api_key") return "The AI API key is invalid.";
  return error?.message || "The AI request failed.";
}

async function createAiCover(post, user) {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("OPENAI_API_KEY is not configured.");
  const { imageModel } = await modelsForUser(user);
  const prompt = [
    `Create a wide editorial ${post.section ? "website section" : "article cover"} illustration for Yeh Mera India.`,
    `${post.section ? "Section" : "Article"}: ${post.title}.`,
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
      model: imageModel,
      prompt,
      size: "1536x1024",
      quality: "medium",
      output_format: "webp",
    }),
    signal: AbortSignal.timeout(45000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(aiError(result.error, response.status));
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

async function rewritePostWithAi({ title, category, excerpt, content }, user) {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("OPENAI_API_KEY is not configured.");
  if (!String(excerpt || "").trim() && !String(content || "").trim())
    throw new Error("Add a short introduction or article content first.");
  const { textModel } = await modelsForUser(user);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: textModel,
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
    throw new Error(aiError(result.error, response.status));
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

async function rewritePageSectionWithAi(section, user) {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("OPENAI_API_KEY is not configured in the hosting environment.");
  if (!String(section?.title || "").trim() && !String(section?.body || "").trim())
    throw new Error("Add a section title or content before rewriting.");
  const { textModel } = await modelsForUser(user);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: textModel,
      store: false,
      instructions: [
        "You are the homepage editor for Yeh Mera India, an Indian author, playwright and culture platform.",
        "Polish the supplied homepage copy while preserving its meaning, Indian cultural context and human voice.",
        "Do not invent awards, books, plays, facts, quotations, dates or biographical claims.",
        "Keep the eyebrow short, the title memorable and the body concise.",
        "Return only the requested structured fields.",
      ].join(" "),
      input: JSON.stringify({
        page: section.page || "Homepage",
        section: section.section || "Content block",
        eyebrow: section.eyebrow || "",
        title: section.title || "",
        body: section.body || "",
      }),
      text: {
        format: {
          type: "json_schema",
          name: "rewritten_page_section",
          strict: true,
          schema: {
            type: "object",
            properties: {
              eyebrow: { type: "string" },
              title: { type: "string" },
              body: { type: "string" },
            },
            required: ["eyebrow", "title", "body"],
            additionalProperties: false,
          },
        },
      },
    }),
    signal: AbortSignal.timeout(60000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(aiError(result.error, response.status));
  const text = responseText(result);
  if (!text) throw new Error("AI rewrite returned no text.");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("AI rewrite returned an invalid response. Please try again.");
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

app.get("/api/homepage", async (_req, res, next) => {
  try {
    const rows = await query("SELECT * FROM homepage_content WHERE id = 1 LIMIT 1");
    res.json(mapHomepage(rows[0]));
  } catch (error) {
    next(error);
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

app.post("/api/posts/:id/messages", requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== "viewer")
      return res.status(403).json({ message: "Viewer access required." });
    const message = String(req.body?.message || "").trim();
    if (message.length < 3 || message.length > 2000)
      return res.status(400).json({ message: "Message must be between 3 and 2,000 characters." });
    const posts = await query(
      "SELECT id, author_id FROM posts WHERE id = ? AND status = 'published' LIMIT 1",
      [req.params.id],
    );
    if (!posts.length) return res.status(404).json({ message: "Post not found." });
    if (!posts[0].author_id)
      return res.status(400).json({ message: "This article does not have an assigned author." });
    await query(
      "INSERT INTO author_messages (post_id, viewer_id, author_id, message) VALUES (?, ?, ?, ?)",
      [posts[0].id, req.user.id, posts[0].author_id, message],
    );
    res.status(201).json({ message: "Your message was sent to the author." });
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
      "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'viewer', 'active')",
      [name, email, hashed],
    );
    const user = {
      id: result.insertId,
      name,
      email,
      role: "viewer",
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
      !["admin", "author"].includes(user.role) ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res
        .status(401)
        .json({ message: "Incorrect studio email or password." });
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

app.get("/api/admin/posts", requireStaff, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT p.*, u.name AS author_name FROM posts p
       LEFT JOIN users u ON u.id = p.author_id
       ${req.user.role === "author" ? "WHERE p.author_id = ?" : ""}
       ORDER BY p.updated_at DESC`,
      req.user.role === "author" ? [req.user.id] : [],
    );
    res.json(rows.map(mapPost));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/rewrite", requireStaff, async (req, res, next) => {
  try {
    const rewritten = await rewritePostWithAi(req.body || {}, req.user);
    res.json(rewritten);
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/admin/upload",
  requireStaff,
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

app.post("/api/admin/posts", requireStaff, async (req, res, next) => {
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
        req.user.role === "admin" && req.body.featured ? 1 : 0,
      ],
    );
    const rows = await query("SELECT * FROM posts WHERE id = ?", [
      result.insertId,
    ]);
    const savedPost = mapPost(rows[0]);
    res.status(201).json(savedPost);
    if (!coverImage && req.body.generateImage) {
      createAiCover(req.body, req.user)
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

app.put("/api/admin/posts/:id", requireStaff, async (req, res, next) => {
  try {
    const existing = await query("SELECT * FROM posts WHERE id = ? LIMIT 1", [
      req.params.id,
    ]);
    if (!existing.length)
      return res.status(404).json({ message: "Post not found." });
    if (!canManagePost(req.user, existing[0]))
      return res.status(403).json({ message: "You can only edit your own articles." });
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
        req.user.role === "admin" ? (req.body.featured ? 1 : 0) : existing[0].featured,
        req.params.id,
      ],
    );
    const rows = await query("SELECT * FROM posts WHERE id = ?", [
      req.params.id,
    ]);
    res.json(mapPost(rows[0]));
    if (!coverImage && req.body.generateImage) {
      createAiCover(req.body, req.user)
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
  requireStaff,
  async (req, res, next) => {
    try {
      const rows = await query("SELECT * FROM posts WHERE id = ? LIMIT 1", [
        req.params.id,
      ]);
      if (!rows.length)
        return res.status(404).json({ message: "Post not found." });
      if (!canManagePost(req.user, rows[0]))
        return res.status(403).json({ message: "You can only update your own articles." });
      const coverImage = await createAiCover({
        ...mapPost(rows[0]),
        excerpt: req.body?.prompt || rows[0].excerpt,
      }, req.user);
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

app.get("/api/admin/users", requireAdmin, async (_req, res, next) => {
  try {
    const rows = await query(
      "SELECT id, name, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC",
    );
    res.json(rows.map(publicUser));
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/users/:id", requireAdmin, async (req, res, next) => {
  try {
    const role = String(req.body?.role || "");
    const status = req.body?.status === "inactive" ? "inactive" : "active";
    if (!["admin", "author", "viewer"].includes(role))
      return res.status(400).json({ message: "Choose admin, author or viewer." });
    if (String(req.params.id) === String(req.user.id) && (role !== "admin" || status !== "active"))
      return res.status(400).json({ message: "You cannot remove your own active admin access." });
    const result = await query("UPDATE users SET role = ?, status = ? WHERE id = ?", [
      role,
      status,
      req.params.id,
    ]);
    if (!result.affectedRows) return res.status(404).json({ message: "User not found." });
    const rows = await query(
      "SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1",
      [req.params.id],
    );
    res.json(publicUser(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/homepage", requireAdmin, async (req, res, next) => {
  try {
    const data = req.body || {};
    const required = [
      "heroTitle", "heroBody", "aboutTitle", "aboutBody", "workTitle",
      "aiTitle", "aiBody", "journalTitle", "contactTitle", "journalPageTitle",
    ];
    if (required.some((key) => !String(data[key] || "").trim()))
      return res.status(400).json({ message: "Complete all required homepage content fields." });
    await query(
      `UPDATE homepage_content SET hero_eyebrow = ?, hero_title = ?, hero_body = ?, hero_image = ?,
       about_eyebrow = ?, about_title = ?, about_body = ?, about_image = ?,
       work_eyebrow = ?, work_title = ?, work_body = ?, work_image = ?,
       ai_eyebrow = ?, ai_title = ?, ai_body = ?, ai_image = ?,
       journal_eyebrow = ?, journal_title = ?, journal_body = ?, journal_image = ?,
       contact_title = ?, contact_body = ?, contact_image = ?, contact_email = ?,
       journal_page_eyebrow = ?, journal_page_title = ?, journal_page_body = ?, journal_page_image = ?,
       updated_by = ? WHERE id = 1`,
      [
        String(data.heroEyebrow || ""), String(data.heroTitle), String(data.heroBody),
        String(data.heroImage || ""), String(data.aboutEyebrow || ""), String(data.aboutTitle),
        String(data.aboutBody), String(data.aboutImage || ""), String(data.workEyebrow || ""),
        String(data.workTitle), String(data.workBody || ""), String(data.workImage || ""),
        String(data.aiEyebrow || ""), String(data.aiTitle), String(data.aiBody),
        String(data.aiImage || ""), String(data.journalEyebrow || ""), String(data.journalTitle),
        String(data.journalBody || ""), String(data.journalImage || ""), String(data.contactTitle),
        String(data.contactBody || ""), String(data.contactImage || ""),
        String(data.contactEmail || "hello@yehmeraindia.com"),
        String(data.journalPageEyebrow || ""), String(data.journalPageTitle),
        String(data.journalPageBody || ""), String(data.journalPageImage || ""), req.user.id,
      ],
    );
    const rows = await query("SELECT * FROM homepage_content WHERE id = 1 LIMIT 1");
    res.json(mapHomepage(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/homepage/rewrite", requireAdmin, async (req, res, next) => {
  try {
    res.json(await rewritePageSectionWithAi(req.body || {}, req.user));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/homepage/generate-image", requireAdmin, async (req, res, next) => {
  try {
    const section = String(req.body?.section || "Homepage section").slice(0, 100);
    const title = String(req.body?.title || section).slice(0, 500);
    const context = String(req.body?.prompt || req.body?.body || "").slice(0, 3000);
    const image = await createAiCover(
      { section, title, excerpt: context, category: req.body?.page || "Homepage" },
      req.user,
    );
    res.json({ image });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/ai-settings", requireStaff, async (req, res, next) => {
  try {
    const settings = await getAiSettings();
    const effective = await modelsForUser(req.user);
    res.json({
      ...settings,
      effectiveTextModel: effective.textModel,
      effectiveImageModel: effective.imageModel,
      canEdit: req.user.role === "admin",
      textModels: req.user.role === "admin" ? TEXT_MODELS : [],
      imageModels: req.user.role === "admin" ? IMAGE_MODELS : [],
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/ai-settings", requireAdmin, async (req, res, next) => {
  try {
    const adminTextModel = String(req.body?.adminTextModel || "");
    const authorTextModel = String(req.body?.authorTextModel || "");
    const imageModel = String(req.body?.imageModel || "");
    if (!TEXT_MODELS.some((model) => model.id === adminTextModel))
      return res.status(400).json({ message: "Choose a supported Admin writing model." });
    if (!TEXT_MODELS.some((model) => model.id === authorTextModel))
      return res.status(400).json({ message: "Choose a supported Author writing model." });
    if (!IMAGE_MODELS.some((model) => model.id === imageModel))
      return res.status(400).json({ message: "Choose a supported image model." });
    await query(
      `UPDATE ai_settings SET admin_text_model = ?, author_text_model = ?, image_model = ?, updated_by = ?
       WHERE id = 1`,
      [adminTextModel, authorTextModel, imageModel, req.user.id],
    );
    res.json({
      ...(await getAiSettings()),
      canEdit: true,
      textModels: TEXT_MODELS,
      imageModels: IMAGE_MODELS,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/messages", requireStaff, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT m.id, m.message, m.is_read, m.created_at, p.title AS post_title,
              p.slug AS post_slug, v.name AS viewer_name, v.email AS viewer_email
         FROM author_messages m
         JOIN posts p ON p.id = m.post_id
         JOIN users v ON v.id = m.viewer_id
        ${req.user.role === "author" ? "WHERE m.author_id = ?" : ""}
        ORDER BY m.created_at DESC`,
      req.user.role === "author" ? [req.user.id] : [],
    );
    res.json(rows.map((row) => ({
      id: String(row.id), message: row.message, isRead: Boolean(row.is_read),
      createdAt: row.created_at, postTitle: row.post_title, postSlug: row.post_slug,
      viewerName: row.viewer_name, viewerEmail: row.viewer_email,
    })));
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/messages/:id/read", requireStaff, async (req, res, next) => {
  try {
    const rows = await query("SELECT id, author_id FROM author_messages WHERE id = ? LIMIT 1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Message not found." });
    if (req.user.role === "author" && String(rows[0].author_id) !== String(req.user.id))
      return res.status(403).json({ message: "You can only manage your own messages." });
    await query("UPDATE author_messages SET is_read = 1 WHERE id = ?", [req.params.id]);
    res.json({ message: "Message marked as read." });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/posts/:id", requireStaff, async (req, res, next) => {
  try {
    const rows = await query("SELECT id, author_id FROM posts WHERE id = ? LIMIT 1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Post not found." });
    if (!canManagePost(req.user, rows[0]))
      return res.status(403).json({ message: "You can only delete your own articles." });
    const result = await query("DELETE FROM posts WHERE id = ?", [req.params.id]);
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
