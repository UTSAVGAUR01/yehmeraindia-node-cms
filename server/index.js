import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
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
const aiTextTimeoutMs = Math.min(
  Math.max(Number(process.env.AI_TEXT_TIMEOUT_MS || 180000), 30000),
  300000,
);
const aiImageTimeoutMs = Math.min(
  Math.max(Number(process.env.AI_IMAGE_TIMEOUT_MS || 180000), 30000),
  300000,
);
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
app.set("trust proxy", 1);
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
    keywords: parseKeywords(row.keywords),
    featured: Boolean(row.featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    authorId: row.author_id ? String(row.author_id) : null,
    authorName: row.author_name || "",
  };
}

function mapBook(row) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description || "",
    purchaseUrl: row.purchase_url || "",
    coverImage: row.cover_image || "",
    imagePrompt: row.image_prompt || "",
    keywords: parseKeywords(row.keywords),
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorId: row.author_id ? String(row.author_id) : null,
    authorName: row.author_name || "",
  };
}

function mapPlayEvent(row) {
  return {
    id: String(row.id),
    playTitle: row.play_title,
    eventTitle: row.event_title,
    description: row.description || "",
    venue: row.venue || "",
    eventAt: row.event_at,
    ticketUrl: row.ticket_url || "",
    keywords: parseKeywords(row.keywords),
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorId: row.author_id ? String(row.author_id) : null,
    authorName: row.author_name || "",
  };
}

function parseKeywords(value) {
  const source = Array.isArray(value) ? value : String(value || "").split(/[,\n]+/);
  return [...new Set(source.map((item) => String(item).trim().replace(/^#+/, "")).filter(Boolean))]
    .slice(0, 30)
    .map((item) => item.slice(0, 60));
}

function keywordsText(value) {
  return parseKeywords(value).join(", ");
}

function socialVideoUrl(value) {
  const original = externalUrl(value, "Video link");
  const url = new URL(original);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let videoId = "";
  if (host === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0] || "";
  if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
    if (url.pathname === "/watch") videoId = url.searchParams.get("v") || "";
    else videoId = url.pathname.match(/^\/(?:shorts|embed)\/([A-Za-z0-9_-]+)/)?.[1] || "";
  }
  if (/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
    return {
      platform: "youtube",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    };
  }
  if (["instagram.com", "m.instagram.com"].includes(host)) {
    const match = url.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (match) {
      const canonical = `https://www.instagram.com/${match[1]}/${match[2]}/`;
      return { platform: "instagram", url: canonical, embedUrl: `${canonical}embed/` };
    }
  }
  throw Object.assign(
    new Error("Paste a public YouTube video, YouTube Short, Instagram post or Instagram Reel link."),
    { statusCode: 400 },
  );
}

function mapSocialVideo(row) {
  let social = { platform: row.platform, url: row.video_url, embedUrl: "" };
  try { social = socialVideoUrl(row.video_url); } catch { /* preserve record with no unsafe embed */ }
  return {
    id: String(row.id),
    title: row.title,
    description: row.description || "",
    videoUrl: social.url,
    embedUrl: social.embedUrl,
    platform: social.platform,
    keywords: parseKeywords(row.keywords),
    relatedType: row.related_type || "none",
    relatedId: row.related_id ? String(row.related_id) : "",
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorId: row.author_id ? String(row.author_id) : null,
    authorName: row.author_name || "",
  };
}

function externalUrl(value, label, required = true) {
  const text = String(value || "").trim();
  if (!text && !required) return "";
  if (text.length > 2000)
    throw Object.assign(new Error(`${label} is too long.`), { statusCode: 400 });
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw Object.assign(new Error(`${label} must be a complete http or https link.`), {
      statusCode: 400,
    });
  }
}

function mysqlDateTime(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime()))
    throw Object.assign(new Error("Choose a valid event date and time."), {
      statusCode: 400,
    });
  return date.toISOString().slice(0, 19).replace("T", " ");
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
    `Create a premium wide editorial ${post.section ? "website section" : "article cover"} image for Yeh Mera India.`,
    `${post.section ? "Section" : "Article"}: ${post.title}.`,
    post.excerpt ? `Context: ${post.excerpt}.` : "",
    post.content ? `Article extract: ${String(post.content).slice(0, 1800)}.` : "",
    `Theme: ${post.category || "Journal"}.`,
    "First identify the central theme, place, period, emotional tone and strongest visual metaphor supported by the supplied text.",
    "Use authentic Indian geography, architecture, clothing and cultural details only when supported by the context; do not invent a recognisable person, landmark or historical event.",
    "Compose a cinematic 3:2 landscape with one clear focal subject, atmospheric depth and useful negative space for a responsive website crop.",
    "Heritage Stage art direction: deep indigo, warm saffron, ivory manuscript texture, subtle theatrical lighting, culturally respectful, sophisticated literary magazine quality, highly detailed and natural.",
    "No written words, captions, letters, logo, watermark, border, collage, malformed hands or duplicated subjects.",
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
      quality: "high",
      output_format: "webp",
    }),
    signal: AbortSignal.timeout(aiImageTimeoutMs),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(aiError(result.error, response.status));
  const encoded = result.data?.[0]?.b64_json;
  if (!encoded) throw new Error("AI image generation returned no image.");
  return `data:image/webp;base64,${encoded}`;
}

async function createAiBookCover(book, user) {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("OPENAI_API_KEY is not configured.");
  const { imageModel } = await modelsForUser(user);
  const prompt = [
    `Create sophisticated portrait cover artwork for the book “${book.title}” by an Indian author.`,
    `Book description: ${String(book.description || "").slice(0, 1800)}.`,
    `Author's visual direction: ${String(book.imagePrompt || "").slice(0, 1200)}.`,
    "Infer the book's central theme, period, location, emotional tone and strongest visual metaphor from the supplied details.",
    "Create a single coherent premium literary composition suitable for a printed book cover, with intentional negative space near the top and bottom for typography added later.",
    "Heritage Stage art direction: culturally grounded Indian visual details, deep indigo, warm saffron, ivory manuscript texture and subtle theatrical light. Use only cultural or historical details supported by the description.",
    "Portrait orientation, highly detailed, natural anatomy, no mockup, no book object, no written title, no letters, no logo, no watermark, no border and no duplicated subjects.",
  ].join(" ");
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: imageModel,
      prompt,
      size: "1024x1536",
      quality: "high",
      output_format: "webp",
    }),
    signal: AbortSignal.timeout(aiImageTimeoutMs),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(aiError(result.error, response.status));
  const encoded = result.data?.[0]?.b64_json;
  if (!encoded) throw new Error("AI book-cover generation returned no image.");
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

function jobStatus(status) {
  if (status === "completed") return "completed";
  if (["failed", "cancelled", "incomplete"].includes(status)) return "failed";
  return status === "in_progress" ? "in_progress" : "queued";
}

async function saveProviderJobResult(jobId, response) {
  const status = jobStatus(response.status);
  if (status === "completed") {
    const text = responseText(response);
    if (!text) throw new Error("AI rewrite returned no text.");
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error("AI rewrite returned an invalid response. Please try again.");
    }
    await query(
      "UPDATE ai_jobs SET status = 'completed', result = ?, error = NULL WHERE id = ?",
      [JSON.stringify(result), jobId],
    );
    return { status, result };
  }
  if (status === "failed") {
    const message =
      response.error?.message ||
      response.incomplete_details?.reason ||
      "The AI rewrite could not be completed.";
    await query("UPDATE ai_jobs SET status = 'failed', error = ? WHERE id = ?", [message, jobId]);
    return { status, error: message };
  }
  await query("UPDATE ai_jobs SET status = ? WHERE id = ?", [status, jobId]);
  return { status };
}

async function createResponseJob({ user, jobType, body }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, background: true }),
    signal: AbortSignal.timeout(30000),
  });
  const providerResponse = await response.json();
  if (!response.ok) throw new Error(aiError(providerResponse.error, response.status));
  if (!providerResponse.id) throw new Error("AI background job was not created.");
  const jobId = randomUUID();
  await query(
    `INSERT INTO ai_jobs (id, user_id, job_type, status, provider_id, expires_at)
     VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
    [jobId, user.id, jobType, jobStatus(providerResponse.status), providerResponse.id],
  );
  const saved = await saveProviderJobResult(jobId, providerResponse);
  return { jobId, status: saved.status };
}

async function startPostRewriteJob(
  { title, category, excerpt, content, rewriteMode, useResearch },
  user,
) {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("OPENAI_API_KEY is not configured.");
  if (!String(excerpt || "").trim() && !String(content || "").trim())
    throw new Error("Add a short introduction or article content first.");
  const { textModel } = await modelsForUser(user);
  const deep = rewriteMode !== "quick";
  const research = deep && useResearch !== false;
  return createResponseJob({
    user,
    jobType: "rewrite",
    body: {
      model: textModel,
      ...(textModel.startsWith("gpt-5")
        ? { reasoning: { effort: "low" } }
        : {}),
      ...(research
        ? {
            tools: [{ type: "web_search", search_context_size: "medium" }],
            tool_choice: "auto",
          }
        : {}),
      instructions: [
        "You are a senior research editor for Yeh Mera India, an Indian author and theatre platform.",
        "First infer what the author is trying to communicate, the likely audience, tone and central argument.",
        research
          ? "Research relevant factual and cultural context on the web before rewriting. Use trustworthy sources and list them separately."
          : "Do not perform external research; work only from the supplied draft.",
        "Preserve the author's distinctive voice, meaning, viewpoint, names and personal experiences.",
        "Improve structure, depth, transitions, clarity and reader engagement.",
        "Never invent facts, quotations, dates, people, sources or experiences.",
        "If a factual claim cannot be verified, preserve it cautiously or flag it in researchNotes instead of presenting it as verified.",
        "Keep paragraph breaks in the article. Do not place research notes inside the article body.",
        "Return only the requested structured fields.",
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
              intentSummary: { type: "string" },
              excerpt: { type: "string" },
              content: { type: "string" },
              researchNotes: { type: "string" },
              sources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    url: { type: "string" },
                  },
                  required: ["title", "url"],
                  additionalProperties: false,
                },
              },
            },
            required: ["intentSummary", "excerpt", "content", "researchNotes", "sources"],
            additionalProperties: false,
          },
        },
      },
    },
  });
}

async function rewritePageSectionWithAi(section, user) {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("OPENAI_API_KEY is not configured in the hosting environment.");
  if (!String(section?.title || "").trim() && !String(section?.body || "").trim())
    throw new Error("Add a section title or content before rewriting.");
  const { textModel } = await modelsForUser(user);
  return createResponseJob({
    user,
    jobType: "page_rewrite",
    body: {
      model: textModel,
      ...(textModel.startsWith("gpt-5")
        ? { reasoning: { effort: "low" } }
        : {}),
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
    },
  });
}

async function startImageJob({ user, jobType, targetId = null, generate }) {
  const jobId = randomUUID();
  await query(
    `INSERT INTO ai_jobs (id, user_id, job_type, status, target_id, expires_at)
     VALUES (?, ?, ?, 'queued', ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
    [jobId, user.id, jobType, targetId],
  );
  setImmediate(async () => {
    try {
      await query("UPDATE ai_jobs SET status = 'in_progress' WHERE id = ?", [jobId]);
      const image = await generate();
      if (jobType === "post_image" && targetId) {
        await query("UPDATE posts SET cover_image = ? WHERE id = ?", [image, targetId]);
      }
      if (jobType === "book_image" && targetId) {
        await query("UPDATE books SET cover_image = ? WHERE id = ?", [image, targetId]);
      }
      await query(
        "UPDATE ai_jobs SET status = 'completed', result = ?, error = NULL WHERE id = ?",
        [JSON.stringify({ image }), jobId],
      );
    } catch (error) {
      console.error(`AI image job ${jobId} failed:`, error.message);
      await query("UPDATE ai_jobs SET status = 'failed', error = ? WHERE id = ?", [
        error.message || "AI image generation failed.",
        jobId,
      ]).catch(() => {});
    }
  });
  return { jobId, status: "queued" };
}

async function readAiJob(job, user) {
  if (String(job.user_id) !== String(user.id) && user.role !== "admin")
    throw Object.assign(new Error("AI job not found."), { statusCode: 404 });
  if (
    ["rewrite", "page_rewrite"].includes(job.job_type) &&
    ["queued", "in_progress"].includes(job.status) &&
    job.provider_id
  ) {
    const response = await fetch(
      `https://api.openai.com/v1/responses/${encodeURIComponent(job.provider_id)}`,
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        signal: AbortSignal.timeout(Math.min(aiTextTimeoutMs, 30000)),
      },
    );
    const providerResponse = await response.json();
    if (!response.ok) throw new Error(aiError(providerResponse.error, response.status));
    await saveProviderJobResult(job.id, providerResponse);
    const refreshed = await query("SELECT * FROM ai_jobs WHERE id = ? LIMIT 1", [job.id]);
    return refreshed[0];
  }
  return job;
}

function mapAiJob(job) {
  let result = null;
  if (job.result) {
    try {
      result = JSON.parse(job.result);
    } catch {
      result = null;
    }
  }
  return {
    jobId: job.id,
    type: job.job_type,
    status: job.status,
    result,
    error: job.error || "",
  };
}

const researchLimits = new Map();
let lastNominatimRequestAt = 0;
let nominatimQueue = Promise.resolve();

function cacheKey(type, value) {
  return createHash("sha256").update(`${type}:${value}`).digest("hex");
}

function mapIndiaPlace(item = {}) {
  const address = item.address || {};
  const addresstype = String(item.addresstype || item.type || "place");
  let level = "place";
  if (["state", "union_territory"].includes(addresstype)) level = "state";
  else if (["state_district", "district", "county"].includes(addresstype)) level = "district";
  else if (["city", "town", "municipality"].includes(addresstype)) level = "city";
  else if (["village", "hamlet", "locality", "suburb"].includes(addresstype)) level = "village";
  else if (address.village || address.hamlet) level = "village";
  else if (address.city || address.town || address.municipality) level = "city";
  else if (address.state_district || address.district || address.county) level = "district";
  else if (address.state) level = "state";
  const hierarchy = {
    country: address.country || "India",
    state: address.state || "",
    district: address.state_district || address.district || address.county || "",
    city: address.city || address.town || address.municipality || "",
    village: address.village || address.hamlet || address.locality || address.suburb || "",
  };
  const levelName = hierarchy[level] || item.name || String(item.display_name || "").split(",")[0];
  return {
    placeId: `${item.osm_type || "place"}:${item.osm_id || item.place_id || cacheKey("place", item.display_name || levelName).slice(0, 16)}:${level}`,
    name: levelName || "Selected place",
    displayName: item.display_name || [levelName, hierarchy.district, hierarchy.state, "India"].filter(Boolean).join(", "),
    level,
    hierarchy,
    lat: Number(item.lat),
    lon: Number(item.lon),
    boundingBox: Array.isArray(item.boundingbox) ? item.boundingbox.map(Number) : [],
  };
}

async function nominatimRequest(type, queryText, url) {
  const key = cacheKey(type, queryText);
  const cached = await query(
    "SELECT result FROM place_geocode_cache WHERE cache_key = ? AND expires_at > NOW() LIMIT 1",
    [key],
  );
  if (cached.length) return JSON.parse(cached[0].result);
  const run = nominatimQueue.then(async () => {
    const delay = Math.max(0, 1100 - (Date.now() - lastNominatimRequestAt));
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    lastNominatimRequestAt = Date.now();
    const response = await fetch(url, {
      headers: {
        "User-Agent": `YehMeraIndia/2.0 (${process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL || "https://yehmeraindia.com"})`,
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.7",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Place service returned ${response.status}.`);
    return response.json();
  });
  nominatimQueue = run.catch(() => {});
  const result = await run;
  await query(
    `INSERT INTO place_geocode_cache (cache_key, request_type, query_text, result, expires_at)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
     ON DUPLICATE KEY UPDATE result = VALUES(result), expires_at = VALUES(expires_at)`,
    [key, type, queryText.slice(0, 1000), JSON.stringify(result)],
  );
  return result;
}

function plainMediaText(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function wikimediaPlacePhotos(searchText) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${searchText} India filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "1200",
    format: "json",
    formatversion: "2",
    redirects: "1",
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: {
      "User-Agent": `YehMeraIndia/2.0 (${process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL || "https://yehmeraindia.com"})`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Wikimedia returned ${response.status}.`);
  const data = await response.json();
  return (data?.query?.pages || []).flatMap((page) => {
    const info = page?.imageinfo?.[0];
    if (!info?.thumburl || !info?.descriptionurl || !String(info.mime || "").startsWith("image/")) return [];
    const creator = plainMediaText(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || "Wikimedia Commons contributor");
    const license = plainMediaText(info.extmetadata?.LicenseShortName?.value || info.extmetadata?.UsageTerms?.value || "See source for licence");
    const title = String(page.title || "").replace(/^File:/i, "").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 180);
    return [{
      placeName: title || searchText,
      imageUrl: info.thumburl,
      sourcePageUrl: info.descriptionurl,
      attribution: `${creator} · ${license}`.slice(0, 500),
      alt: (plainMediaText(info.extmetadata?.ImageDescription?.value) || `${searchText}, India`).slice(0, 500),
    }];
  }).slice(0, 4);
}

function mapPlaceResearch(row) {
  let result = null;
  let hierarchy = {};
  try { result = row.result ? JSON.parse(row.result) : null; } catch { result = null; }
  try { hierarchy = row.hierarchy_json ? JSON.parse(row.hierarchy_json) : {}; } catch { hierarchy = {}; }
  return {
    researchId: row.id,
    status: row.status,
    error: row.error || "",
    place: {
      placeId: row.place_key,
      name: row.place_name,
      level: row.place_level,
      hierarchy,
      lat: Number(row.latitude),
      lon: Number(row.longitude),
    },
    result,
    researchedAt: row.researched_at,
  };
}

async function savePlaceProviderResult(researchId, response) {
  const status = jobStatus(response.status);
  if (status === "completed") {
    const text = responseText(response);
    if (!text) throw new Error("Place research returned no information.");
    let result;
    try { result = JSON.parse(text); }
    catch { throw new Error("Place research returned an invalid response. Please try again."); }
    // Keep only photo records that are safe to render directly. The research
    // prompt requires source-backed URLs, and this final guard prevents an
    // arbitrary or non-HTTPS value from reaching the public page.
    if (result?.category?.key === "places" && Array.isArray(result.category.photos)) {
      result.category.photos = result.category.photos.filter((photo) => {
        try {
          const imageUrl = new URL(photo?.imageUrl);
          const sourcePageUrl = new URL(photo?.sourcePageUrl);
          const host = imageUrl.hostname.toLowerCase();
          const trustedImageHost = [
            "upload.wikimedia.org",
            "commons.wikimedia.org",
            "images.unsplash.com",
            "images.pexels.com",
          ].includes(host) || host.endsWith(".gov.in") || host.endsWith(".nic.in");
          return imageUrl.protocol === "https:"
            && sourcePageUrl.protocol === "https:"
            && trustedImageHost
            && String(photo.placeName || "").trim()
            && String(photo.attribution || "").trim();
        } catch {
          return false;
        }
      }).slice(0, 4);
    }
    await query(
      `UPDATE place_insights SET status = 'completed', result = ?, error = NULL,
       researched_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 12 HOUR) WHERE id = ?`,
      [JSON.stringify(result), researchId],
    );
    return;
  }
  if (status === "failed") {
    const message = response.error?.message || response.incomplete_details?.reason || "Place research could not be completed.";
    await query("UPDATE place_insights SET status = 'failed', error = ?, expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?", [message, researchId]);
    return;
  }
  await query("UPDATE place_insights SET status = ? WHERE id = ?", [status, researchId]);
}

const PLACE_RESEARCH_CATEGORIES = {
  overview: "Place identity, geography, administration and why the place matters",
  history: "Origins, chronology and historical turning points, with meaningful coverage of Hindu, Buddhist, Jain, Sikh, tribal, folk and other Indian civilisational heritage where relevant",
  amazingFacts: "Verified surprising facts, records, sacred geography, archaeology, local legends clearly labelled as legends, and distinctive Indian heritage",
  culture: "Languages, communities, Hindu, Buddhist, Jain, Sikh, tribal, folk and other local traditions, food, dress, festivals, arts and everyday culture",
  places: "Important landmarks, natural landscapes, heritage sites and meaningful destinations",
  presentScenario: "Current administration, population context, economy, infrastructure, education, environment and quality of life",
  currentNews: "Material recent news and developments with exact event dates and publication sources",
};

function enforceResearchLimit(req) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "anonymous";
  const recent = (researchLimits.get(key) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 10)
    throw Object.assign(new Error("Research limit reached. Try another cached place or return in one hour."), { statusCode: 429 });
  recent.push(now);
  researchLimits.set(key, recent);
}

async function startPlaceResearch(place, categoryKey, req) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
  const category = String(categoryKey || "");
  if (!PLACE_RESEARCH_CATEGORIES[category])
    throw Object.assign(new Error("Choose a valid knowledge-card category."), { statusCode: 400 });
  const basePlaceKey = String(place?.placeId || "");
  // Version category prompts so older cached cards are not served after a
  // material research/editorial schema update.
  const researchVersion = {
    places: ":v2",
    history: ":v3",
    amazingFacts: ":v3",
    culture: ":v3",
  }[category] || "";
  const placeKey = `${basePlaceKey.slice(0, 254 - category.length - researchVersion.length)}:${category}${researchVersion}`;
  const placeName = String(place?.name || "").trim().slice(0, 500);
  const level = ["state", "district", "city", "village"].includes(place?.level) ? place.level : "place";
  const lat = Number(place?.lat);
  const lon = Number(place?.lon);
  const hierarchy = place?.hierarchy && typeof place.hierarchy === "object" ? place.hierarchy : {};
  const countryName = String(hierarchy.country || "India").trim().toLowerCase();
  if (!placeKey || !placeName || !Number.isFinite(lat) || !Number.isFinite(lon) || countryName !== "india")
    throw Object.assign(new Error("Choose a valid place from the India map or search results."), { statusCode: 400 });
  const existing = await query("SELECT * FROM place_insights WHERE place_key = ? LIMIT 1", [placeKey]);
  if (existing.length && ["queued", "in_progress", "completed"].includes(existing[0].status) && new Date(existing[0].expires_at).getTime() > Date.now())
    return { ...mapPlaceResearch(existing[0]), cached: existing[0].status === "completed" };
  enforceResearchLimit(req);
  const configuredPlaceModel = String(process.env.OPENAI_PLACE_MODEL || "gpt-5-mini");
  const model = TEXT_MODELS.some((item) => item.id === configuredPlaceModel)
    ? configuredPlaceModel
    : "gpt-5-mini";
  const isPlacesCategory = category === "places";
  const placesProperties = isPlacesCategory
    ? {
        photos: {
          type: "array",
          maxItems: 4,
          items: {
            type: "object",
            properties: {
              placeName: { type: "string" },
              imageUrl: { type: "string" },
              sourcePageUrl: { type: "string" },
              attribution: { type: "string" },
              alt: { type: "string" },
            },
            required: ["placeName", "imageUrl", "sourcePageUrl", "attribution", "alt"],
            additionalProperties: false,
          },
        },
        nearbyAreas: {
          type: "array",
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string" },
              whyVisit: { type: "string" },
              distanceGuidance: { type: "string" },
              travelTimeGuidance: { type: "string" },
            },
            required: ["name", "type", "whyVisit", "distanceGuidance", "travelTimeGuidance"],
            additionalProperties: false,
          },
        },
        visitPlan: {
          type: "object",
          properties: {
            startingPoint: { type: "string" },
            suggestedOrder: { type: "array", maxItems: 8, items: { type: "string" } },
            totalTimeGuidance: { type: "string" },
            transportGuidance: { type: "string" },
            practicalNotes: { type: "array", minItems: 1, maxItems: 6, items: { type: "string" } },
          },
          required: ["startingPoint", "suggestedOrder", "totalTimeGuidance", "transportGuidance", "practicalNotes"],
          additionalProperties: false,
        },
      }
    : {};
  const placesRequired = isPlacesCategory ? ["photos", "nearbyAreas", "visitPlan"] : [];
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      ...(model.startsWith("gpt-5") ? { reasoning: { effort: "low" } } : {}),
      background: true,
      tools: [{ type: "web_search", search_context_size: "low" }],
      tool_choice: "auto",
      instructions: [
        "You are the Know My India research editor for Yeh Mera India.",
        "Research only the requested knowledge-card category so the response is focused and fast.",
        "Keep the answer about the selected place in India. Mention a neighbouring country only when essential to explain verified border geography or history; do not recommend or profile non-Indian destinations.",
        "Use trustworthy sources and distinguish verified facts from local legends.",
        ["history", "amazingFacts", "culture"].includes(category)
          ? "Actively research Indian civilisational heritage, including Hindu, Buddhist, Jain, Sikh, tribal, folk, linguistic, archaeological and indigenous traditions where relevant. Give these traditions meaningful detail, while retaining other well-sourced history needed for an accurate and complete account. Never generalise about or disparage any religious community."
          : "",
        ["overview", "history", "presentScenario"].includes(category)
          ? "For borders and administration, prioritise Survey of India, Ministry of Home Affairs, Archaeological Survey of India and official Union Territory, state, divisional and district portals. Clearly distinguish a Union Territory, administrative division, district, cultural region and disputed boundary context."
          : "",
        category === "currentNews"
          ? "Prioritize recent reporting, include exact event dates, and state clearly when no material recent news is found."
          : "Prefer authoritative government, institutional, reference and established reporting sources relevant to this category.",
        isPlacesCategory
          ? "For Places to Know, also make a practical nearby-area visit plan. Give approximate distance and travel-time guidance from the selected place, a sensible visit order, transport guidance and concise practical notes; label estimates as approximate and never invent live opening hours, fares or road conditions."
          : "",
        isPlacesCategory
          ? "Include up to four directly renderable related photos only when web research finds the exact HTTPS image URL and its attribution/source page. Prefer Wikimedia Commons or official Indian government/tourism media. Never construct, guess or fabricate an image URL; return an empty photos array when no reliable direct image is available."
          : "",
        "Do not invent statistics, quotations, people, legends, developments or news. Avoid political persuasion and promotional exaggeration.",
        isPlacesCategory
          ? "Return a concise summary, at most four strong highlights, at most four useful source links, and no more than six nearby areas. Write accessible English."
          : "Return a concise summary, at most four strong highlights and at most four useful source links. Write accessible English.",
      ].join(" "),
      input: JSON.stringify({
        selectedPlace: { name: placeName, level, hierarchy, latitude: lat, longitude: lon },
        requestedCategory: { key: category, scope: PLACE_RESEARCH_CATEGORIES[category] },
      }),
      text: {
        format: {
          type: "json_schema",
          name: "know_my_india_category",
          strict: true,
          schema: {
            type: "object",
            properties: {
              placeTitle: { type: "string" },
              subtitle: { type: "string" },
              category: {
                type: "object",
                properties: {
                  key: { type: "string", enum: ["overview", "history", "amazingFacts", "culture", "places", "presentScenario", "currentNews"] },
                  title: { type: "string" },
                  summary: { type: "string" },
                  highlights: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
                  ...placesProperties,
                  sources: {
                    type: "array",
                    minItems: 1,
                    maxItems: 4,
                    items: {
                      type: "object",
                      properties: { title: { type: "string" }, url: { type: "string" } },
                      required: ["title", "url"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["key", "title", "summary", "highlights", ...placesRequired, "sources"],
                additionalProperties: false,
              },
              researchNote: { type: "string" },
            },
            required: ["placeTitle", "subtitle", "category", "researchNote"],
            additionalProperties: false,
          },
        },
      },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const providerResponse = await response.json();
  if (!response.ok) throw new Error(aiError(providerResponse.error, response.status));
  if (!providerResponse.id) throw new Error("Place research job was not created.");
  const researchId = randomUUID();
  await query(
    `INSERT INTO place_insights
     (id, place_key, place_name, place_level, hierarchy_json, latitude, longitude, status, provider_id, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
     ON DUPLICATE KEY UPDATE id = VALUES(id), place_name = VALUES(place_name), place_level = VALUES(place_level),
     hierarchy_json = VALUES(hierarchy_json), latitude = VALUES(latitude), longitude = VALUES(longitude),
     status = VALUES(status), provider_id = VALUES(provider_id), result = NULL, error = NULL, expires_at = VALUES(expires_at)`,
    [researchId, placeKey, placeName, level, JSON.stringify(hierarchy), lat, lon, jobStatus(providerResponse.status), providerResponse.id],
  );
  await savePlaceProviderResult(researchId, providerResponse);
  const rows = await query("SELECT * FROM place_insights WHERE id = ? LIMIT 1", [researchId]);
  return mapPlaceResearch(rows[0]);
}

async function pollPlaceResearch(row) {
  if (["queued", "in_progress"].includes(row.status) && row.provider_id) {
    const response = await fetch(`https://api.openai.com/v1/responses/${encodeURIComponent(row.provider_id)}`, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(Math.min(aiTextTimeoutMs, 30000)),
    });
    const providerResponse = await response.json();
    if (!response.ok) throw new Error(aiError(providerResponse.error, response.status));
    await savePlaceProviderResult(row.id, providerResponse);
    const refreshed = await query("SELECT * FROM place_insights WHERE id = ? LIMIT 1", [row.id]);
    return refreshed[0];
  }
  return row;
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

app.get("/api/places/search", async (req, res, next) => {
  try {
    const text = String(req.query.q || "").trim();
    if (text.length < 2 || text.length > 160)
      return res.status(400).json({ message: "Enter between 2 and 160 characters to search India." });
    const params = new URLSearchParams({
      q: text,
      format: "jsonv2",
      addressdetails: "1",
      countrycodes: "in",
      limit: "8",
      dedupe: "1",
    });
    const data = await nominatimRequest("search", text.toLowerCase(), `https://nominatim.openstreetmap.org/search?${params}`);
    res.json(data
      .filter((item) => String(item.address?.country_code || "").toLowerCase() === "in")
      .map(mapIndiaPlace)
      .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon)));
  } catch (error) {
    next(error);
  }
});

app.get("/api/places/india-boundary", async (_req, res, next) => {
  try {
    const params = new URLSearchParams({
      q: "India",
      format: "jsonv2",
      addressdetails: "1",
      countrycodes: "in",
      featuretype: "country",
      polygon_geojson: "1",
      polygon_threshold: "0.01",
      limit: "1",
    });
    const data = await nominatimRequest(
      "search",
      "india-national-boundary-v1",
      `https://nominatim.openstreetmap.org/search?${params}`,
    );
    const country = Array.isArray(data) ? data.find((item) => item?.geojson) : null;
    if (!country?.geojson) throw new Error("India boundary data is temporarily unavailable.");
    res.set("Cache-Control", "public, max-age=604800, stale-while-revalidate=2592000");
    res.json({
      geometry: country.geojson,
      boundingBox: Array.isArray(country.boundingbox) ? country.boundingbox.map(Number) : [],
      source: "OpenStreetMap Nominatim",
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/places/northern-regions", async (_req, res, next) => {
  try {
    const definitions = [
      {
        key: "jammu",
        name: "Jammu Division",
        kind: "Administrative division of Jammu & Kashmir UT",
        queryText: "Jammu Division, Jammu and Kashmir, India",
        referenceUrl: "https://divcomjammu.gov.in/",
      },
      {
        key: "kashmir",
        name: "Kashmir Division",
        kind: "Administrative division of Jammu & Kashmir UT",
        queryText: "Kashmir Division, Jammu and Kashmir, India",
        referenceUrl: "https://divcomkashmir.jk.gov.in/",
      },
      {
        key: "ladakh",
        name: "Ladakh",
        kind: "Union Territory of India",
        queryText: "Ladakh, India",
        referenceUrl: "https://ladakh.gov.in/",
      },
    ];
    const regions = await Promise.all(definitions.map(async (definition) => {
      const params = new URLSearchParams({
        q: definition.queryText,
        format: "jsonv2",
        addressdetails: "1",
        countrycodes: "in",
        polygon_geojson: "1",
        polygon_threshold: "0.005",
        limit: "5",
      });
      try {
        const data = await nominatimRequest(
          "search",
          `india-northern-region-v1:${definition.key}`,
          `https://nominatim.openstreetmap.org/search?${params}`,
        );
        const match = Array.isArray(data) ? data.find((item) => item?.geojson) : null;
        if (!match?.geojson) return null;
        return {
          key: definition.key,
          name: definition.name,
          kind: definition.kind,
          geometry: match.geojson,
          boundingBox: Array.isArray(match.boundingbox) ? match.boundingbox.map(Number) : [],
          referenceUrl: definition.referenceUrl,
        };
      } catch {
        return null;
      }
    }));
    res.set("Cache-Control", "public, max-age=604800, stale-while-revalidate=2592000");
    res.json(regions.filter(Boolean));
  } catch (error) {
    next(error);
  }
});

app.get("/api/places/reverse", async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const zoom = Math.min(Math.max(Number(req.query.zoom || 5), 3), 18);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 6 || lat > 38 || lon < 67 || lon > 98)
      return res.status(400).json({ message: "Tap a location within India." });
    const normalized = `${lat.toFixed(5)},${lon.toFixed(5)},${Math.round(zoom)}`;
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      zoom: String(Math.round(zoom)),
      format: "jsonv2",
      addressdetails: "1",
    });
    const data = await nominatimRequest("reverse", normalized, `https://nominatim.openstreetmap.org/reverse?${params}`);
    if (String(data.address?.country_code || "").toLowerCase() !== "in")
      return res.status(400).json({ message: "That point is outside India. Please choose another location." });
    res.json(mapIndiaPlace(data));
  } catch (error) {
    next(error);
  }
});

app.get("/api/places/photos", async (req, res, next) => {
  try {
    const text = String(req.query.q || "").trim();
    if (text.length < 2 || text.length > 180)
      return res.status(400).json({ message: "Choose a valid Indian place for photographs." });
    res.set("Cache-Control", "public, max-age=21600, stale-while-revalidate=86400");
    res.json(await wikimediaPlacePhotos(text));
  } catch (error) {
    next(error);
  }
});

app.post("/api/places/research", async (req, res, next) => {
  try {
    res.status(202).json(await startPlaceResearch(req.body?.place || {}, req.body?.category, req));
  } catch (error) {
    next(error);
  }
});

app.get("/api/places/research/:id", async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM place_insights WHERE id = ? AND expires_at > NOW() LIMIT 1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Place research not found or expired." });
    res.json(mapPlaceResearch(await pollPlaceResearch(rows[0])));
  } catch (error) {
    next(error);
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

app.get("/api/works", async (_req, res, next) => {
  try {
    const [books, events] = await Promise.all([
      query(
        `SELECT b.*, u.name AS author_name FROM books b
         LEFT JOIN users u ON u.id = b.author_id
         WHERE b.status = 'published'
         ORDER BY COALESCE(b.published_at, b.created_at) DESC`,
      ),
      query(
        `SELECT e.*, u.name AS author_name FROM play_events e
         LEFT JOIN users u ON u.id = e.author_id
         WHERE e.status = 'published'
         ORDER BY e.event_at ASC`,
      ),
    ]);
    res.json({ books: books.map(mapBook), events: events.map(mapPlayEvent) });
  } catch (error) {
    next(error);
  }
});

async function relatedContent(type, id) {
  if (!id || type === "none") return null;
  if (type === "book") {
    const rows = await query("SELECT id, title, purchase_url FROM books WHERE id = ? AND status = 'published' LIMIT 1", [id]);
    return rows[0] ? { type, title: rows[0].title, url: rows[0].purchase_url, action: "Purchase book" } : null;
  }
  if (type === "play") {
    const rows = await query("SELECT id, play_title, event_title FROM play_events WHERE id = ? AND status = 'published' LIMIT 1", [id]);
    return rows[0] ? { type, title: `${rows[0].play_title} · ${rows[0].event_title}`, url: "/#work", action: "View play information" } : null;
  }
  if (type === "post") {
    const rows = await query("SELECT title, slug FROM posts WHERE id = ? AND status = 'published' LIMIT 1", [id]);
    return rows[0] ? { type, title: rows[0].title, url: `/journal/${rows[0].slug}`, action: "Read related article" } : null;
  }
  return null;
}

app.get("/api/videos", async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT v.*, u.name AS author_name FROM social_videos v
       LEFT JOIN users u ON u.id = v.author_id
       WHERE v.status = 'published'
       ORDER BY COALESCE(v.published_at, v.created_at) DESC`,
    );
    const videos = await Promise.all(rows.map(async (row) => ({
      ...mapSocialVideo(row),
      relatedContent: await relatedContent(row.related_type, row.related_id),
    })));
    res.json(videos);
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
    const job = await startPostRewriteJob(req.body || {}, req.user);
    res.status(202).json(job);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/ai-jobs/:id", requireStaff, async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT * FROM ai_jobs WHERE id = ? AND expires_at > NOW() LIMIT 1",
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ message: "AI job not found or expired." });
    const job = await readAiJob(rows[0], req.user);
    res.json(mapAiJob(job));
  } catch (error) {
    if (error.statusCode)
      return res.status(error.statusCode).json({ message: error.message });
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
       (author_id, title, slug, excerpt, content, cover_image, image_alt, category, keywords, status, featured, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${status === "published" ? "NOW()" : "NULL"})`,
      [
        req.user.id,
        title,
        slug,
        String(req.body.excerpt || ""),
        content,
        coverImage,
        String(req.body.imageAlt || title),
        String(req.body.category || "Journal"),
        keywordsText(req.body.keywords),
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
       category = ?, keywords = ?, status = ?, featured = ?, published_at = ${status === "published" ? "COALESCE(published_at, NOW())" : "NULL"}
       WHERE id = ?`,
      [
        title,
        slug,
        String(req.body.excerpt || ""),
        content,
        coverImage,
        String(req.body.imageAlt || title),
        String(req.body.category || "Journal"),
        keywordsText(req.body.keywords),
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
      const job = await startImageJob({
        user: req.user,
        jobType: "post_image",
        targetId: req.params.id,
        generate: () =>
          createAiCover(
            {
              ...mapPost(rows[0]),
              excerpt: req.body?.prompt || rows[0].excerpt,
            },
            req.user,
          ),
      });
      res.status(202).json(job);
    } catch (error) {
      next(error);
    }
  },
);

app.get("/api/admin/books", requireStaff, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT b.*, u.name AS author_name FROM books b
       LEFT JOIN users u ON u.id = b.author_id
       ${req.user.role === "author" ? "WHERE b.author_id = ?" : ""}
       ORDER BY b.updated_at DESC`,
      req.user.role === "author" ? [req.user.id] : [],
    );
    res.json(rows.map(mapBook));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/books", requireStaff, async (req, res, next) => {
  try {
    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const purchaseUrl = externalUrl(req.body?.purchaseUrl, "Purchase link");
    if (!title || !description)
      return res.status(400).json({ message: "Book title and description are required." });
    if (title.length > 220)
      return res.status(400).json({ message: "Book title must be 220 characters or fewer." });
    const status = req.body?.status === "published" ? "published" : "draft";
    const result = await query(
      `INSERT INTO books
       (author_id, title, description, purchase_url, cover_image, image_prompt, keywords, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${status === "published" ? "NOW()" : "NULL"})`,
      [
        req.user.id,
        title,
        description,
        purchaseUrl,
        String(req.body?.coverImage || ""),
        String(req.body?.imagePrompt || ""),
        keywordsText(req.body?.keywords),
        status,
      ],
    );
    const rows = await query("SELECT * FROM books WHERE id = ? LIMIT 1", [result.insertId]);
    res.status(201).json(mapBook(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/books/:id", requireStaff, async (req, res, next) => {
  try {
    const existing = await query("SELECT * FROM books WHERE id = ? LIMIT 1", [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: "Book not found." });
    if (!canManagePost(req.user, existing[0]))
      return res.status(403).json({ message: "You can only update your own books." });
    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const purchaseUrl = externalUrl(req.body?.purchaseUrl, "Purchase link");
    if (!title || !description)
      return res.status(400).json({ message: "Book title and description are required." });
    if (title.length > 220)
      return res.status(400).json({ message: "Book title must be 220 characters or fewer." });
    const status = req.body?.status === "published" ? "published" : "draft";
    await query(
      `UPDATE books SET title = ?, description = ?, purchase_url = ?, cover_image = ?,
       image_prompt = ?, keywords = ?, status = ?, published_at = CASE WHEN ? = 'published'
       THEN COALESCE(published_at, NOW()) ELSE NULL END WHERE id = ?`,
      [
        title,
        description,
        purchaseUrl,
        String(req.body?.coverImage || ""),
        String(req.body?.imagePrompt || ""),
        keywordsText(req.body?.keywords),
        status,
        status,
        req.params.id,
      ],
    );
    const rows = await query("SELECT * FROM books WHERE id = ? LIMIT 1", [req.params.id]);
    res.json(mapBook(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/books/:id", requireStaff, async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM books WHERE id = ? LIMIT 1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Book not found." });
    if (!canManagePost(req.user, rows[0]))
      return res.status(403).json({ message: "You can only delete your own books." });
    await query("DELETE FROM books WHERE id = ?", [req.params.id]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/books/:id/generate-cover", requireStaff, async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM books WHERE id = ? LIMIT 1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Book not found." });
    if (!canManagePost(req.user, rows[0]))
      return res.status(403).json({ message: "You can only update your own books." });
    const book = mapBook(rows[0]);
    if (!String(book.imagePrompt || "").trim())
      return res.status(400).json({ message: "Add an image description before generating a cover." });
    const job = await startImageJob({
      user: req.user,
      jobType: "book_image",
      targetId: req.params.id,
      generate: () => createAiBookCover(book, req.user),
    });
    res.status(202).json(job);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/play-events", requireStaff, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT e.*, u.name AS author_name FROM play_events e
       LEFT JOIN users u ON u.id = e.author_id
       ${req.user.role === "author" ? "WHERE e.author_id = ?" : ""}
       ORDER BY e.event_at DESC`,
      req.user.role === "author" ? [req.user.id] : [],
    );
    res.json(rows.map(mapPlayEvent));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/play-events", requireStaff, async (req, res, next) => {
  try {
    const playTitle = String(req.body?.playTitle || "").trim();
    const eventTitle = String(req.body?.eventTitle || "").trim();
    const description = String(req.body?.description || "").trim();
    const venue = String(req.body?.venue || "").trim();
    if (!playTitle || !eventTitle || !description || !venue)
      return res.status(400).json({ message: "Play, event, description and venue are required." });
    if (playTitle.length > 220 || eventTitle.length > 220 || venue.length > 300)
      return res.status(400).json({ message: "Play/event titles or venue are too long." });
    const eventAt = mysqlDateTime(req.body?.eventAt);
    const ticketUrl = externalUrl(req.body?.ticketUrl, "Ticket link", false);
    const status = req.body?.status === "published" ? "published" : "draft";
    const result = await query(
      `INSERT INTO play_events
       (author_id, play_title, event_title, description, venue, event_at, ticket_url, keywords, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${status === "published" ? "NOW()" : "NULL"})`,
      [req.user.id, playTitle, eventTitle, description, venue, eventAt, ticketUrl, keywordsText(req.body?.keywords), status],
    );
    const rows = await query("SELECT * FROM play_events WHERE id = ? LIMIT 1", [result.insertId]);
    res.status(201).json(mapPlayEvent(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/play-events/:id", requireStaff, async (req, res, next) => {
  try {
    const existing = await query("SELECT * FROM play_events WHERE id = ? LIMIT 1", [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: "Play event not found." });
    if (!canManagePost(req.user, existing[0]))
      return res.status(403).json({ message: "You can only update your own play events." });
    const playTitle = String(req.body?.playTitle || "").trim();
    const eventTitle = String(req.body?.eventTitle || "").trim();
    const description = String(req.body?.description || "").trim();
    const venue = String(req.body?.venue || "").trim();
    if (!playTitle || !eventTitle || !description || !venue)
      return res.status(400).json({ message: "Play, event, description and venue are required." });
    if (playTitle.length > 220 || eventTitle.length > 220 || venue.length > 300)
      return res.status(400).json({ message: "Play/event titles or venue are too long." });
    const eventAt = mysqlDateTime(req.body?.eventAt);
    const ticketUrl = externalUrl(req.body?.ticketUrl, "Ticket link", false);
    const status = req.body?.status === "published" ? "published" : "draft";
    await query(
      `UPDATE play_events SET play_title = ?, event_title = ?, description = ?, venue = ?,
       event_at = ?, ticket_url = ?, keywords = ?, status = ?, published_at = CASE WHEN ? = 'published'
       THEN COALESCE(published_at, NOW()) ELSE NULL END WHERE id = ?`,
      [playTitle, eventTitle, description, venue, eventAt, ticketUrl, keywordsText(req.body?.keywords), status, status, req.params.id],
    );
    const rows = await query("SELECT * FROM play_events WHERE id = ? LIMIT 1", [req.params.id]);
    res.json(mapPlayEvent(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/play-events/:id", requireStaff, async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM play_events WHERE id = ? LIMIT 1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Play event not found." });
    if (!canManagePost(req.user, rows[0]))
      return res.status(403).json({ message: "You can only delete your own play events." });
    await query("DELETE FROM play_events WHERE id = ?", [req.params.id]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

function videoPayload(body) {
  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  if (!title || !description)
    throw Object.assign(new Error("Video title and description are required."), { statusCode: 400 });
  if (title.length > 220)
    throw Object.assign(new Error("Video title must be 220 characters or fewer."), { statusCode: 400 });
  const social = socialVideoUrl(body?.videoUrl);
  const relatedType = ["book", "play", "post"].includes(body?.relatedType)
    ? body.relatedType
    : "none";
  const relatedId = relatedType === "none" ? null : Number(body?.relatedId);
  if (relatedType !== "none" && (!Number.isInteger(relatedId) || relatedId < 1))
    throw Object.assign(new Error("Choose valid related content or select none."), { statusCode: 400 });
  return {
    title,
    description,
    ...social,
    keywords: keywordsText(body?.keywords),
    relatedType,
    relatedId,
    status: body?.status === "published" ? "published" : "draft",
  };
}

app.get("/api/admin/videos", requireStaff, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT v.*, u.name AS author_name FROM social_videos v
       LEFT JOIN users u ON u.id = v.author_id
       ${req.user.role === "author" ? "WHERE v.author_id = ?" : ""}
       ORDER BY v.updated_at DESC`,
      req.user.role === "author" ? [req.user.id] : [],
    );
    res.json(rows.map(mapSocialVideo));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/videos", requireStaff, async (req, res, next) => {
  try {
    const data = videoPayload(req.body);
    const result = await query(
      `INSERT INTO social_videos
       (author_id, title, description, video_url, platform, keywords, related_type, related_id, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${data.status === "published" ? "NOW()" : "NULL"})`,
      [req.user.id, data.title, data.description, data.url, data.platform, data.keywords, data.relatedType, data.relatedId, data.status],
    );
    const rows = await query("SELECT * FROM social_videos WHERE id = ? LIMIT 1", [result.insertId]);
    res.status(201).json(mapSocialVideo(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/videos/:id", requireStaff, async (req, res, next) => {
  try {
    const existing = await query("SELECT * FROM social_videos WHERE id = ? LIMIT 1", [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: "Video not found." });
    if (!canManagePost(req.user, existing[0]))
      return res.status(403).json({ message: "You can only update your own videos." });
    const data = videoPayload(req.body);
    await query(
      `UPDATE social_videos SET title = ?, description = ?, video_url = ?, platform = ?, keywords = ?,
       related_type = ?, related_id = ?, status = ?, published_at = CASE WHEN ? = 'published'
       THEN COALESCE(published_at, NOW()) ELSE NULL END WHERE id = ?`,
      [data.title, data.description, data.url, data.platform, data.keywords, data.relatedType, data.relatedId, data.status, data.status, req.params.id],
    );
    const rows = await query("SELECT * FROM social_videos WHERE id = ? LIMIT 1", [req.params.id]);
    res.json(mapSocialVideo(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/videos/:id", requireStaff, async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM social_videos WHERE id = ? LIMIT 1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Video not found." });
    if (!canManagePost(req.user, rows[0]))
      return res.status(403).json({ message: "You can only delete your own videos." });
    await query("DELETE FROM social_videos WHERE id = ?", [req.params.id]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

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
    res.status(202).json(await rewritePageSectionWithAi(req.body || {}, req.user));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/homepage/generate-image", requireAdmin, async (req, res, next) => {
  try {
    const section = String(req.body?.section || "Homepage section").slice(0, 100);
    const title = String(req.body?.title || section).slice(0, 500);
    const context = String(req.body?.prompt || req.body?.body || "").slice(0, 3000);
    const job = await startImageJob({
      user: req.user,
      jobType: "page_image",
      generate: () =>
        createAiCover(
          { section, title, excerpt: context, category: req.body?.page || "Homepage" },
          req.user,
        ),
    });
    res.status(202).json(job);
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
  if (error.name === "TimeoutError" || error.name === "AbortError")
    return res.status(504).json({
      message:
        "The AI request took longer than three minutes. Try again or ask Admin to select a faster model such as GPT-5.4 mini.",
    });
  const databaseError =
    String(error.code || "").startsWith("ER_") ||
    ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND"].includes(error.code);
  res
    .status(error.statusCode || (databaseError ? 503 : 500))
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
