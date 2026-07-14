import express from "express";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { query } from "./db.js";

let installed = false;
let installing = false;
const usage = new Map();

const clean = (value, max = 8000) => String(value ?? "").trim().slice(0, max);

async function requireAuthor(req, res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: "Sign in is required to use the AI writer." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rows = await query(
      "SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1",
      [decoded.id],
    );
    const user = rows[0];
    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "This account is not active." });
    }
    if (!["admin", "author"].includes(user.role)) {
      return res.status(403).json({ message: "Author or Admin access is required to use the AI writer." });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }
    next(error);
  }
}

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const key = String(userId);
  const recent = (usage.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= 30) return false;
  recent.push(now);
  usage.set(key, recent);
  return true;
}

function configuredModel() {
  const requested = clean(
    process.env.OPENAI_AUTHOR_TEXT_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-5.5",
    100,
  );
  if (!requested || /luna/i.test(requested)) return "gpt-5.5";
  return requested;
}

function extractOutputText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const texts = [];
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    for (const part of Array.isArray(item?.content) ? item.content : []) {
      if (part?.type === "output_text" && typeof part.text === "string") texts.push(part.text);
    }
  }
  return texts.join("\n").trim();
}

function makePrompt(body, user) {
  const type = body.type === "event" ? "event" : "book";
  const action = body.action === "rewrite" ? "rewrite" : "write";
  const title = clean(body.title, 220);
  const secondaryTitle = clean(body.secondaryTitle, 220);
  const currentDescription = clean(body.currentDescription, 12000);
  const instruction = clean(body.instruction, 3000);
  const style = clean(body.style, 80) || "balanced";
  const language = clean(body.language, 80) || "auto";
  const venue = clean(body.venue, 300);
  const eventAt = clean(body.eventAt, 100);

  if (!title && !secondaryTitle && !currentDescription) {
    throw Object.assign(new Error("Add a title or some description text before using the AI writer."), {
      statusCode: 400,
    });
  }

  const kindGuidance = type === "book"
    ? "Write polished catalogue copy for a published book. Present its premise, central conflict, atmosphere, characters, historical or cultural setting, reader appeal and emotional stakes. Do not invent awards, reviews, sales figures, quotations, dates or facts that the author did not provide."
    : "Write polished public event copy for a live play or performance. Explain the play, this particular event, audience experience, cultural context and invitation to attend. Use venue and date details only when supplied. Do not invent cast members, sponsors, ticket prices, awards or factual claims.";

  const actionGuidance = action === "rewrite"
    ? "Rewrite the existing description while preserving all names, places, events and factual details. Improve structure, clarity, persuasion and rhythm according to the author's direction."
    : "Create a fresh description from the supplied title, details and author direction. Treat any existing description as optional source material, not wording that must be copied.";

  return {
    type,
    input: [
      `Content type: ${type}`,
      `Primary title: ${title || "Not supplied"}`,
      secondaryTitle ? `Play or event title: ${secondaryTitle}` : "",
      venue ? `Venue: ${venue}` : "",
      eventAt ? `Event date/time: ${eventAt}` : "",
      `Requested writing style: ${style}`,
      `Requested language: ${language}`,
      instruction ? `Author's specific writing direction:\n${instruction}` : "Author gave no extra direction; infer a suitable professional approach from the supplied material.",
      currentDescription ? `Existing description or notes:\n${currentDescription}` : "No existing description was supplied.",
      `Account holder: ${clean(user.name, 120)}`,
    ].filter(Boolean).join("\n\n"),
    instructions: [
      "You are the senior publishing copywriter and theatre publicist for Yeh Mera India.",
      kindGuidance,
      actionGuidance,
      "Follow the author's requested language, tone, focus, audience and length. If language is auto, match the language of the supplied title and notes; otherwise use clear Indian English.",
      "The writing may be literary or persuasive, but it must remain accurate to the supplied material. When information is incomplete, write around the gap instead of inventing details.",
      "Use readable paragraphs. Avoid markdown headings, bullet lists, hashtags, SEO keyword dumps and prefatory comments unless the author explicitly asks for them.",
      type === "book" ? "Normally produce 180 to 450 words, unless the author requests another length." : "Normally produce 120 to 320 words, unless the author requests another length.",
      "Return only the finished description that can be placed directly into the website editor.",
    ].join(" "),
  };
}

async function generateDescription(body, user) {
  const apiKey = clean(process.env.OPENAI_API_KEY, 500);
  if (!apiKey) {
    throw Object.assign(new Error("OPENAI_API_KEY is not configured on the server."), {
      statusCode: 503,
      code: "OPENAI_NOT_CONFIGURED",
    });
  }

  const prompt = makePrompt(body, user);
  const model = configuredModel();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    const payload = {
      model,
      instructions: prompt.instructions,
      input: prompt.input,
      max_output_tokens: prompt.type === "book" ? 1800 : 1300,
      store: false,
      safety_identifier: createHash("sha256").update(String(user.id)).digest("hex").slice(0, 32),
    };
    if (/^(gpt-5|o\d)/i.test(model)) payload.reasoning = { effort: "low" };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = clean(data?.error?.message, 600) || "The AI writing service rejected the request.";
      const error = new Error(message);
      error.statusCode = response.status === 429 ? 429 : 502;
      error.code = clean(data?.error?.code || data?.error?.type || "OPENAI_REQUEST_FAILED", 100);
      throw error;
    }

    const description = extractOutputText(data);
    if (!description) {
      throw Object.assign(new Error("The AI writer completed without returning description text. Please try again."), {
        statusCode: 502,
        code: "EMPTY_AI_RESPONSE",
      });
    }

    return { description, model, action: body.action === "rewrite" ? "rewrite" : "write" };
  } catch (error) {
    if (error.name === "AbortError") {
      throw Object.assign(new Error("The AI writer took longer than 180 seconds. Try a shorter direction or try again."), {
        statusCode: 504,
        code: "AI_WRITER_TIMEOUT",
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function installRoutes(app) {
  if (installed || installing) return;
  installing = true;

  app.post("/api/admin/ai/work-description", requireAuthor, async (req, res, next) => {
    try {
      if (!checkRateLimit(req.user.id)) {
        return res.status(429).json({ message: "AI writing limit reached for this hour. Please continue after some time." });
      }
      const result = await generateDescription(req.body || {}, req.user);
      res.json(result);
    } catch (error) {
      const status = Number(error.statusCode || 0);
      if (status >= 400 && status < 600) {
        return res.status(status).json({
          message: error.message,
          code: clean(error.code || "AI_WRITER_ERROR", 100),
        });
      }
      next(error);
    }
  });

  installed = true;
  installing = false;
}

const previousUse = express.application.use;
express.application.use = function workDescriptionAiAwareUse(...args) {
  const result = previousUse.apply(this, args);
  const middleware = args.length === 1 && typeof args[0] === "function" ? args[0] : null;
  if (!installed && !installing && middleware?.name === "jsonParser") installRoutes(this);
  return result;
};
