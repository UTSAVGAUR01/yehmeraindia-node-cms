import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import tls from "node:tls";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { query } from "./db.js";

let installed = false;
let installing = false;
const windows = new Map();

const normalizeEmail = (value) => String(value || "").trim().toLowerCase().slice(0, 254);
const hashValue = (value) => createHash("sha256").update(String(value)).digest("hex");
const safeHeader = (value) => String(value || "").replace(/[\r\n]+/g, " ").trim();

function otpHash(email, code) {
  const secret = process.env.AUTH_CODE_SECRET || process.env.JWT_SECRET || "change-me";
  return hashValue(`login:${email}:${code}:${secret}`);
}

function limit(req, scope, maximum, windowMs, identity = "") {
  const key = `${scope}:${req.ip || req.socket?.remoteAddress || "unknown"}:${identity}`;
  const now = Date.now();
  const recent = (windows.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= maximum) {
    const error = new Error("Too many attempts. Please wait and try again.");
    error.statusCode = 429;
    throw error;
  }
  recent.push(now);
  windows.set(key, recent);
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function readSmtp(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };
    const onError = (error) => { cleanup(); reject(error); };
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const last = buffer.split(/\r?\n/).filter(Boolean).at(-1) || "";
      if (!/^\d{3} /.test(last)) return;
      cleanup();
      const code = Number(last.slice(0, 3));
      if (code >= 400) reject(new Error(`SMTP rejected the message (${code}).`));
      else resolve(buffer);
    };
    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function smtpCommand(socket, command) {
  socket.write(`${command}\r\n`);
  return readSmtp(socket);
}

async function sendVerificationMail(email, code) {
  if (!smtpConfigured()) {
    const error = new Error("Email delivery is not configured. Add the SMTP environment variables in Hostinger.");
    error.statusCode = 503;
    throw error;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const from = safeHeader(process.env.SMTP_FROM || process.env.SMTP_USER);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: true });
  socket.setTimeout(20000, () => socket.destroy(new Error("SMTP connection timed out.")));
  await new Promise((resolve, reject) => {
    socket.once("secureConnect", resolve);
    socket.once("error", reject);
  });
  await readSmtp(socket);
  await smtpCommand(socket, `EHLO ${safeHeader(process.env.SMTP_HELO || "yehmeraindia.com")}`);
  await smtpCommand(socket, "AUTH LOGIN");
  await smtpCommand(socket, Buffer.from(user).toString("base64"));
  await smtpCommand(socket, Buffer.from(pass).toString("base64"));
  await smtpCommand(socket, `MAIL FROM:<${from}>`);
  await smtpCommand(socket, `RCPT TO:<${safeHeader(email)}>`);
  await smtpCommand(socket, "DATA");

  const boundary = `ymi-${randomUUID()}`;
  const text = `Your Yeh Mera India verification code is ${code}. It expires in 10 minutes and can be used once. Never share this code or your password with anyone.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px"><h2>Yeh Mera India</h2><p>Use this code to verify your Viewer account:</p><p style="font-size:32px;letter-spacing:8px;font-weight:700">${code}</p><p>This code expires in 10 minutes and can be used once.</p><p><strong>Security:</strong> Yeh Mera India will never ask you to share this code or your password by email, phone, social media or chat.</p></div>`;
  const message = [
    `From: Yeh Mera India <${from}>`,
    `To: ${safeHeader(email)}`,
    "Subject: Verify your Yeh Mera India Viewer account",
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary=\"${boundary}\"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    `--${boundary}--`,
    "",
  ].join("\r\n").replace(/\r\n\./g, "\r\n..");

  socket.write(`${message}\r\n.\r\n`);
  await readSmtp(socket);
  await smtpCommand(socket, "QUIT").catch(() => {});
  socket.end();
}

async function ensureSchema() {
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at DATETIME NULL");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_pending TINYINT(1) NOT NULL DEFAULT 0");
  await query(`CREATE TABLE IF NOT EXISTS auth_codes (
    id CHAR(36) PRIMARY KEY,
    user_id BIGINT NULL,
    email VARCHAR(255) NOT NULL,
    purpose ENUM('signup','login') NOT NULL,
    code_hash CHAR(64) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    consumed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auth_codes_lookup (email, purpose, expires_at),
    INDEX idx_auth_codes_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

function needsViewerVerification(user) {
  return user?.role === "viewer"
    && (!user.email_verified_at || Boolean(user.registration_pending) || user.status !== "active");
}

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured.");
    error.statusCode = 503;
    throw error;
  }
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.role !== "viewer" || Boolean(user.email_verified_at),
    },
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
    emailVerified: user.role !== "viewer" || Boolean(user.email_verified_at),
    registrationPending: user.role === "viewer" && Boolean(user.registration_pending),
  };
}

async function issueCode(user, email) {
  const code = String(randomInt(100000, 1000000));
  const id = randomUUID();
  await query(
    "UPDATE auth_codes SET consumed_at = NOW() WHERE user_id = ? AND purpose = 'login' AND consumed_at IS NULL",
    [user.id],
  );
  await query(
    "INSERT INTO auth_codes (id, user_id, email, purpose, code_hash, expires_at) VALUES (?, ?, ?, 'login', ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
    [id, user.id, email, otpHash(email, code)],
  );
  try {
    await sendVerificationMail(email, code);
  } catch (error) {
    await query("UPDATE auth_codes SET consumed_at = NOW() WHERE id = ?", [id]).catch(() => {});
    throw error;
  }
  return id;
}

async function userFromToken(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !process.env.JWT_SECRET) return null;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const rows = await query(
    "SELECT id, name, email, role, status, email_verified_at, registration_pending FROM users WHERE id = ? LIMIT 1",
    [decoded.id],
  );
  return rows[0] || null;
}

function isViewerProtectedPath(pathname) {
  return /^\/api\/(?:profile|studio)(?:\/|$)/.test(pathname)
    || /^\/api\/(?:author-messages|messages)(?:\/|$)/.test(pathname);
}

function install(app) {
  if (installed || installing) return;
  installing = true;
  const ready = ensureSchema().catch((error) => {
    console.error("Viewer verification schema initialization failed:", error.code || error.message);
    return null;
  });

  app.get("/api/auth/verification-status", async (req, res, next) => {
    try {
      await ready;
      const user = await userFromToken(req);
      if (!user) return res.status(401).json({ message: "Sign in required." });
      if (needsViewerVerification(user)) {
        return res.status(403).json({
          message: "Verify your email with a one-time code before opening My Profile or messages.",
          code: "EMAIL_VERIFICATION_REQUIRED",
          verificationRequired: true,
          email: user.email,
        });
      }
      res.json({ verified: true, user: publicUser(user) });
    } catch (error) {
      if (["JsonWebTokenError", "TokenExpiredError"].includes(error.name)) {
        return res.status(401).json({ message: "Session expired. Please sign in again." });
      }
      next(error);
    }
  });

  app.use(async (req, res, next) => {
    try {
      await ready;
      const pathname = String(req.path || "").toLowerCase();

      if (req.method === "POST" && pathname === "/api/auth/signin") {
        const email = normalizeEmail(req.body?.email);
        const password = String(req.body?.password || "");
        const rows = await query(
          "SELECT id, name, email, password, role, status, email_verified_at, registration_pending FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
          [email],
        );
        const user = rows[0];
        if (needsViewerVerification(user)) {
          limit(req, "viewer-verification-signin", 6, 30 * 60 * 1000, email);
          if (!password || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Incorrect email or password." });
          }
          const challengeId = await issueCode(user, email);
          await query(
            "INSERT INTO security_events (user_id, email, event_type, ip_address, user_agent) VALUES (?, ?, 'viewer_verification_otp_sent', ?, ?)",
            [user.id, email, String(req.ip || "").slice(0, 64), String(req.headers["user-agent"] || "").slice(0, 500)],
          ).catch(() => {});
          return res.status(202).json({
            twoFactorRequired: true,
            verificationRequired: true,
            challengeId,
            email,
          });
        }
      }

      if (req.method === "POST" && pathname === "/api/auth/verify-login") {
        const email = normalizeEmail(req.body?.email);
        const challengeId = String(req.body?.challengeId || "").trim().slice(0, 36);
        const code = String(req.body?.code || "").trim().slice(0, 6);
        const rows = await query(
          `SELECT c.*, u.name, u.email AS user_email, u.role, u.status, u.email_verified_at, u.registration_pending
             FROM auth_codes c
             JOIN users u ON u.id = c.user_id
            WHERE c.id = ? AND c.email = ? AND c.purpose = 'login'
              AND c.consumed_at IS NULL AND c.expires_at > NOW()
            LIMIT 1`,
          [challengeId, email],
        );
        const record = rows[0];
        if (record && needsViewerVerification(record)) {
          limit(req, "viewer-verification-check", 10, 30 * 60 * 1000, email);
          if (record.attempts >= 5 || record.code_hash !== otpHash(email, code)) {
            await query("UPDATE auth_codes SET attempts = attempts + 1 WHERE id = ?", [challengeId]).catch(() => {});
            return res.status(400).json({ message: "The code is incorrect or expired." });
          }
          await query("UPDATE auth_codes SET consumed_at = NOW() WHERE id = ?", [challengeId]);
          await query(
            "UPDATE users SET status = 'active', registration_pending = 0, email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?",
            [record.user_id],
          );
          const users = await query(
            "SELECT id, name, email, role, status, email_verified_at, registration_pending FROM users WHERE id = ? LIMIT 1",
            [record.user_id],
          );
          const user = users[0];
          await query(
            "INSERT INTO security_events (user_id, email, event_type, ip_address, user_agent) VALUES (?, ?, 'viewer_email_verified', ?, ?)",
            [user.id, user.email, String(req.ip || "").slice(0, 64), String(req.headers["user-agent"] || "").slice(0, 500)],
          ).catch(() => {});
          return res.json({ token: signToken(user), user: publicUser(user) });
        }
      }

      if (isViewerProtectedPath(pathname)) {
        const user = await userFromToken(req);
        if (needsViewerVerification(user)) {
          return res.status(403).json({
            message: "Email verification is required before using My Profile, role requests or messages.",
            code: "EMAIL_VERIFICATION_REQUIRED",
            verificationRequired: true,
            email: user.email,
          });
        }
      }

      next();
    } catch (error) {
      if (["JsonWebTokenError", "TokenExpiredError"].includes(error.name)) {
        return res.status(401).json({ message: "Session expired. Please sign in again." });
      }
      if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
      next(error);
    }
  });

  installed = true;
  installing = false;
}

const previousUse = express.application.use;
express.application.use = function viewerVerificationAwareUse(...args) {
  const result = previousUse.apply(this, args);
  const middleware = args.length === 1 && typeof args[0] === "function" ? args[0] : null;
  if (!installed && !installing && middleware?.name === "jsonParser") install(this);
  return result;
};
