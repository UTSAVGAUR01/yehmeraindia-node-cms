import tls from "node:tls";
import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";

const authWindows = new Map();

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase().slice(0, 254);
}

function hashValue(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function passwordValid(value) {
  const text = String(value || "");
  return text.length >= 10 && /[a-z]/.test(text) && /[A-Z]/.test(text) && /\d/.test(text);
}

function otpHash(email, purpose, code) {
  const secret = process.env.AUTH_CODE_SECRET || process.env.JWT_SECRET || "change-me";
  return hashValue(`${purpose}:${email}:${code}:${secret}`);
}

function clientKey(req, scope) {
  return `${scope}:${req.ip || req.socket?.remoteAddress || "unknown"}`;
}

function rateLimit(req, scope, max, windowMs) {
  const key = clientKey(req, scope);
  const now = Date.now();
  const recent = (authWindows.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= max) {
    const error = new Error("Too many attempts. Please wait and try again.");
    error.statusCode = 429;
    throw error;
  }
  recent.push(now);
  authWindows.set(key, recent);
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function readSmtp(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines.at(-1) || "";
      if (/^\d{3} /.test(last)) {
        cleanup();
        const code = Number(last.slice(0, 3));
        if (code >= 400) reject(new Error(`SMTP rejected the message (${code}).`));
        else resolve(buffer);
      }
    };
    const onError = (error) => { cleanup(); reject(error); };
    const cleanup = () => { socket.off("data", onData); socket.off("error", onError); };
    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function smtpCommand(socket, command) {
  socket.write(`${command}\r\n`);
  return readSmtp(socket);
}

function safeHeader(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

async function sendMail({ to, subject, text, html }) {
  if (!smtpConfigured()) {
    const error = new Error("Email delivery is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and SMTP_FROM.");
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
  await smtpCommand(socket, `RCPT TO:<${safeHeader(to)}>`);
  await smtpCommand(socket, "DATA");
  const boundary = `ymi-${randomUUID()}`;
  const message = [
    `From: Yeh Mera India <${from}>`,
    `To: ${safeHeader(to)}`,
    `Subject: ${safeHeader(subject)}`,
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

async function ensureSchema(query) {
  const statements = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at DATETIME NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_pending TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at DATETIME NULL",
    `CREATE TABLE IF NOT EXISTS auth_codes (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id CHAR(36) PRIMARY KEY,
      user_id BIGINT NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      consumed_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_password_reset_user (user_id, expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS security_events (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NULL,
      email VARCHAR(255) NULL,
      event_type VARCHAR(80) NOT NULL,
      ip_address VARCHAR(64) NULL,
      user_agent VARCHAR(500) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_security_events_created (created_at),
      INDEX idx_security_events_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];
  for (const statement of statements) await query(statement);
}

async function audit(query, req, eventType, userId = null, email = null) {
  try {
    await query(
      "INSERT INTO security_events (user_id, email, event_type, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
      [userId, email, eventType, String(req.ip || "").slice(0, 64), String(req.headers["user-agent"] || "").slice(0, 500)],
    );
  } catch {}
}

async function issueCode(query, { userId = null, email, purpose }) {
  const code = String(randomInt(100000, 1000000));
  const id = randomUUID();
  await query("UPDATE auth_codes SET consumed_at = NOW() WHERE email = ? AND purpose = ? AND consumed_at IS NULL", [email, purpose]);
  await query(
    "INSERT INTO auth_codes (id, user_id, email, purpose, code_hash, expires_at) VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
    [id, userId, email, purpose, otpHash(email, purpose, code)],
  );
  await sendMail({
    to: email,
    subject: purpose === "signup" ? "Verify your Yeh Mera India account" : "Your Yeh Mera India login code",
    text: `Your one-time code is ${code}. It expires in 10 minutes. Do not share this code.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px"><h2>Yeh Mera India</h2><p>Your one-time code is:</p><p style="font-size:32px;letter-spacing:8px;font-weight:700">${code}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p></div>`,
  });
  return id;
}

async function verifyCode(query, { id, email, purpose, code }) {
  const rows = await query(
    "SELECT * FROM auth_codes WHERE id = ? AND email = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > NOW() LIMIT 1",
    [id, email, purpose],
  );
  const record = rows[0];
  if (!record || record.attempts >= 5) return null;
  const valid = record.code_hash === otpHash(email, purpose, String(code || ""));
  if (!valid) {
    await query("UPDATE auth_codes SET attempts = attempts + 1 WHERE id = ?", [id]);
    return null;
  }
  await query("UPDATE auth_codes SET consumed_at = NOW() WHERE id = ?", [id]);
  return record;
}

export function registerSecurityAuth(app, { query, bcrypt, signToken, publicUser, requireAuth }) {
  const ready = ensureSchema(query);

  app.use((req, res, next) => {
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Content-Security-Policy", "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com https://nominatim.openstreetmap.org https://commons.wikimedia.org; frame-src https://www.youtube-nocookie.com https://www.instagram.com; worker-src 'none'");
    if (Number(req.headers["content-length"] || 0) > 10 * 1024 * 1024) return res.status(413).json({ message: "Request is too large." });
    const path = req.path.toLowerCase();
    if (/\0|\.\.|\/\.git|\/\.env|\/wp-admin|\/wp-login|\/xmlrpc|\/cgi-bin|phpunit|xmrig|cryptonight|miner/.test(path)) {
      return res.status(404).end();
    }
    res.setTimeout(300000, () => res.end());
    next();
  });

  app.post("/api/auth/signup", async (req, res, next) => {
    try {
      await ready; rateLimit(req, "signup", 5, 60 * 60 * 1000);
      const name = String(req.body?.name || "").trim().slice(0, 150);
      const email = normalizeEmail(req.body?.email);
      const password = String(req.body?.password || "");
      const enableTwoFactor = Boolean(req.body?.enableTwoFactor);
      if (!name || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Enter a valid name and email address." });
      if (!passwordValid(password)) return res.status(400).json({ message: "Use at least 10 characters with uppercase, lowercase and a number." });
      const existing = await query("SELECT id, registration_pending FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1", [email]);
      if (existing.length && !existing[0].registration_pending) return res.status(409).json({ message: "An account already exists with this email." });
      const hashed = await bcrypt.hash(password, 12);
      let userId;
      if (existing.length) {
        userId = existing[0].id;
        await query("UPDATE users SET name = ?, password = ?, status = 'inactive', registration_pending = 1, two_factor_enabled = ? WHERE id = ?", [name, hashed, enableTwoFactor ? 1 : 0, userId]);
      } else {
        const result = await query("INSERT INTO users (name, email, password, role, status, registration_pending, two_factor_enabled) VALUES (?, ?, ?, 'viewer', 'inactive', 1, ?)", [name, email, hashed, enableTwoFactor ? 1 : 0]);
        userId = result.insertId;
      }
      const challengeId = await issueCode(query, { userId, email, purpose: "signup" });
      await audit(query, req, "signup_otp_sent", userId, email);
      res.status(202).json({ verificationRequired: true, challengeId, email });
    } catch (error) { next(error); }
  });

  app.post("/api/auth/verify-signup", async (req, res, next) => {
    try {
      await ready; rateLimit(req, "verify-signup", 10, 60 * 60 * 1000);
      const email = normalizeEmail(req.body?.email);
      const record = await verifyCode(query, { id: req.body?.challengeId, email, purpose: "signup", code: req.body?.code });
      if (!record) return res.status(400).json({ message: "The code is incorrect or expired." });
      await query("UPDATE users SET status = 'active', registration_pending = 0, email_verified_at = NOW() WHERE id = ?", [record.user_id]);
      const users = await query("SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1", [record.user_id]);
      const user = users[0];
      await audit(query, req, "signup_verified", user.id, email);
      res.status(201).json({ token: signToken(user), user: publicUser(user) });
    } catch (error) { next(error); }
  });

  async function signinHandler(req, res, next, staffOnly = false) {
    try {
      await ready; rateLimit(req, "signin", 12, 15 * 60 * 1000);
      const email = normalizeEmail(req.body?.email);
      const password = String(req.body?.password || "");
      const rows = await query("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1", [email]);
      const user = rows[0];
      if (!user || user.status !== "active" || !(await bcrypt.compare(password, user.password))) {
        await audit(query, req, "signin_failed", user?.id || null, email);
        return res.status(401).json({ message: "Incorrect email or password." });
      }
      if (staffOnly && !["admin", "author"].includes(user.role)) return res.status(403).json({ message: "Studio access required." });
      const requireOtp = Boolean(user.two_factor_enabled) || (process.env.FORCE_STAFF_2FA === "true" && ["admin", "author"].includes(user.role));
      if (requireOtp) {
        const challengeId = await issueCode(query, { userId: user.id, email, purpose: "login" });
        await audit(query, req, "login_otp_sent", user.id, email);
        return res.status(202).json({ twoFactorRequired: true, challengeId, email });
      }
      await audit(query, req, "signin_success", user.id, email);
      res.json({ token: signToken(user), user: publicUser(user) });
    } catch (error) { next(error); }
  }

  app.post("/api/auth/signin", (req, res, next) => signinHandler(req, res, next, false));
  app.post("/api/admin/login", (req, res, next) => signinHandler(req, res, next, true));

  app.post("/api/auth/verify-login", async (req, res, next) => {
    try {
      await ready; rateLimit(req, "verify-login", 10, 15 * 60 * 1000);
      const email = normalizeEmail(req.body?.email);
      const record = await verifyCode(query, { id: req.body?.challengeId, email, purpose: "login", code: req.body?.code });
      if (!record) return res.status(400).json({ message: "The code is incorrect or expired." });
      const rows = await query("SELECT id, name, email, role, status FROM users WHERE id = ? AND status = 'active' LIMIT 1", [record.user_id]);
      if (!rows.length) return res.status(401).json({ message: "This account is not active." });
      const user = rows[0];
      await audit(query, req, "two_factor_success", user.id, email);
      res.json({ token: signToken(user), user: publicUser(user) });
    } catch (error) { next(error); }
  });

  app.post("/api/auth/forgot-password", async (req, res, next) => {
    try {
      await ready; rateLimit(req, "forgot-password", 5, 60 * 60 * 1000);
      const email = normalizeEmail(req.body?.email);
      const rows = await query("SELECT id, name FROM users WHERE LOWER(email) = LOWER(?) AND status = 'active' LIMIT 1", [email]);
      if (rows.length) {
        const token = randomBytes(32).toString("hex");
        await query("UPDATE password_reset_tokens SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL", [rows[0].id]);
        await query("INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))", [randomUUID(), rows[0].id, hashValue(token)]);
        const base = String(process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL || "https://yehmeraindia.com").replace(/\/$/, "");
        const resetUrl = `${base}/account.html?mode=reset&token=${encodeURIComponent(token)}`;
        await sendMail({
          to: email,
          subject: "Reset your Yeh Mera India password",
          text: `Open this link within 30 minutes to reset your password: ${resetUrl}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px"><h2>Reset your password</h2><p>This link expires in 30 minutes.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#e99a24;color:#111;text-decoration:none">Reset password</a></p><p>If you did not request this, ignore this email.</p></div>`,
        });
        await audit(query, req, "password_reset_sent", rows[0].id, email);
      }
      res.json({ message: "If the email is registered, a password-reset link has been sent." });
    } catch (error) { next(error); }
  });

  app.post("/api/auth/reset-password", async (req, res, next) => {
    try {
      await ready; rateLimit(req, "reset-password", 8, 60 * 60 * 1000);
      const tokenHash = hashValue(String(req.body?.token || ""));
      const password = String(req.body?.password || "");
      if (!passwordValid(password)) return res.status(400).json({ message: "Use at least 10 characters with uppercase, lowercase and a number." });
      const rows = await query("SELECT * FROM password_reset_tokens WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > NOW() LIMIT 1", [tokenHash]);
      if (!rows.length) return res.status(400).json({ message: "This reset link is invalid or expired." });
      const hashed = await bcrypt.hash(password, 12);
      await query("UPDATE users SET password = ?, password_changed_at = NOW() WHERE id = ?", [hashed, rows[0].user_id]);
      await query("UPDATE password_reset_tokens SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL", [rows[0].user_id]);
      await query("UPDATE auth_codes SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL", [rows[0].user_id]);
      await audit(query, req, "password_reset_completed", rows[0].user_id, null);
      res.json({ message: "Password changed successfully. Sign in with your new password." });
    } catch (error) { next(error); }
  });

  app.get("/api/auth/security", requireAuth, async (req, res, next) => {
    try {
      await ready;
      const rows = await query("SELECT two_factor_enabled, email_verified_at FROM users WHERE id = ? LIMIT 1", [req.user.id]);
      res.json({ twoFactorEnabled: Boolean(rows[0]?.two_factor_enabled), emailVerified: Boolean(rows[0]?.email_verified_at) });
    } catch (error) { next(error); }
  });

  app.put("/api/auth/security", requireAuth, async (req, res, next) => {
    try {
      await ready; rateLimit(req, "security-settings", 6, 60 * 60 * 1000);
      const password = String(req.body?.password || "");
      const rows = await query("SELECT password FROM users WHERE id = ? LIMIT 1", [req.user.id]);
      if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) return res.status(401).json({ message: "Current password is incorrect." });
      const enabled = Boolean(req.body?.enabled);
      if (enabled && !smtpConfigured()) return res.status(503).json({ message: "Email delivery must be configured before enabling two-factor login." });
      await query("UPDATE users SET two_factor_enabled = ? WHERE id = ?", [enabled ? 1 : 0, req.user.id]);
      await audit(query, req, enabled ? "two_factor_enabled" : "two_factor_disabled", req.user.id, req.user.email);
      res.json({ twoFactorEnabled: enabled });
    } catch (error) { next(error); }
  });
}
