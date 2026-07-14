import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import tls from "node:tls";
import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { query } from "./db.js";

let installed = false;
let installing = false;
const requestWindows = new Map();

const normalizeEmail = (value) => String(value || "").trim().toLowerCase().slice(0, 254);
const hashValue = (value) => createHash("sha256").update(String(value)).digest("hex");
const cleanText = (value, max) => String(value || "").trim().slice(0, max);

function passwordValid(value) {
  const text = String(value || "");
  return text.length >= 10 && /[a-z]/.test(text) && /[A-Z]/.test(text) && /\d/.test(text);
}

function rateLimit(req, scope, max, windowMs, identity = "") {
  const key = `${scope}:${req.ip || req.socket?.remoteAddress || "unknown"}:${identity}`;
  const now = Date.now();
  const recent = (requestWindows.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= max) {
    const error = new Error("Too many attempts. Please wait and try again.");
    error.statusCode = 429;
    throw error;
  }
  recent.push(now);
  requestWindows.set(key, recent);
}

function safeHeader(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
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

async function sendMail({ to, subject, text, html }) {
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

async function ensureSchema() {
  const statements = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at DATETIME NULL",
    `CREATE TABLE IF NOT EXISTS role_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      requested_role ENUM('author','admin') NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
      admin_note TEXT NULL,
      reviewed_by BIGINT UNSIGNED NULL,
      reviewed_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_role_requests_user (user_id, created_at),
      INDEX idx_role_requests_status (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS conversation_threads (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      subject VARCHAR(220) NOT NULL,
      status ENUM('open','closed') NOT NULL DEFAULT 'open',
      last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_conversation_user (user_id, last_message_at),
      INDEX idx_conversation_status (status, last_message_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS conversation_messages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      thread_id BIGINT UNSIGNED NOT NULL,
      sender_id BIGINT UNSIGNED NOT NULL,
      sender_type ENUM('member','staff') NOT NULL,
      body TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_conversation_messages_thread (thread_id, created_at),
      INDEX idx_conversation_messages_unread (thread_id, sender_type, is_read)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS password_reset_codes (
      id CHAR(36) NOT NULL,
      user_id BIGINT UNSIGNED NULL,
      email VARCHAR(254) NOT NULL,
      code_hash CHAR(64) NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      expires_at DATETIME NOT NULL,
      verified_at DATETIME NULL,
      reset_token_hash CHAR(64) NULL,
      reset_expires_at DATETIME NULL,
      consumed_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_password_reset_email (email, expires_at),
      INDEX idx_password_reset_token (reset_token_hash, reset_expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];
  for (const statement of statements) await query(statement);
}

async function requireMember(req, res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !process.env.JWT_SECRET) return res.status(401).json({ message: "Sign in required." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rows = await query("SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1", [decoded.id]);
    if (!rows.length || rows[0].status !== "active") return res.status(401).json({ message: "This account is not active." });
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
  requireMember(req, res, (error) => {
    if (error) return next(error);
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required." });
    next();
  });
}

function publicUser(user) {
  return { id: String(user.id), name: user.name, email: user.email, role: user.role, status: user.status };
}

function mapRoleRequest(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    requestedRole: row.requested_role,
    reason: row.reason,
    status: row.status,
    adminNote: row.admin_note || "",
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userName: row.user_name || "",
    userEmail: row.user_email || "",
    currentRole: row.current_role || "",
    reviewerName: row.reviewer_name || "",
  };
}

function mapThread(row) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    subject: row.subject,
    status: row.status,
    lastMessage: row.last_message || "",
    unreadCount: Number(row.unread_count || 0),
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userName: row.user_name || "",
    userEmail: row.user_email || "",
  };
}

function mapMessage(row) {
  return {
    id: String(row.id),
    threadId: String(row.thread_id),
    senderId: String(row.sender_id),
    senderType: row.sender_type,
    senderName: row.sender_name || (row.sender_type === "staff" ? "Yeh Mera India" : "Member"),
    body: row.body,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

async function memberThreads(userId) {
  return query(
    `SELECT t.*,
            (SELECT m.body FROM conversation_messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_message,
            (SELECT COUNT(*) FROM conversation_messages m WHERE m.thread_id = t.id AND m.sender_type = 'staff' AND m.is_read = 0) AS unread_count
       FROM conversation_threads t
      WHERE t.user_id = ?
      ORDER BY t.last_message_at DESC`,
    [userId],
  );
}

async function adminThreads() {
  return query(
    `SELECT t.*, u.name AS user_name, u.email AS user_email,
            (SELECT m.body FROM conversation_messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_message,
            (SELECT COUNT(*) FROM conversation_messages m WHERE m.thread_id = t.id AND m.sender_type = 'member' AND m.is_read = 0) AS unread_count
       FROM conversation_threads t
       JOIN users u ON u.id = t.user_id
      ORDER BY t.last_message_at DESC`,
  );
}

async function threadMessages(threadId) {
  return query(
    `SELECT m.*, u.name AS sender_name
       FROM conversation_messages m
       LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.thread_id = ?
      ORDER BY m.created_at ASC, m.id ASC`,
    [threadId],
  );
}

function resetCodeHash(email, code) {
  const secret = process.env.AUTH_CODE_SECRET || process.env.JWT_SECRET || "change-me";
  return hashValue(`password-reset:${email}:${code}:${secret}`);
}

function installRoutes(app) {
  if (installed || installing) return;
  installing = true;
  const ready = ensureSchema().catch((error) => {
    console.error("Member Studio schema initialization failed:", error.code || error.message);
    return null;
  });

  app.post("/api/auth/password-reset/request", async (req, res, next) => {
    try {
      await ready;
      const email = normalizeEmail(req.body?.email);
      if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
      rateLimit(req, "password-reset-request", 5, 60 * 60 * 1000, email);
      const users = await query("SELECT id, name FROM users WHERE LOWER(email) = LOWER(?) AND status = 'active' LIMIT 1", [email]);
      const user = users[0] || null;
      const id = randomUUID();
      const code = String(randomInt(100000, 1000000));
      await query("UPDATE password_reset_codes SET consumed_at = NOW() WHERE email = ? AND consumed_at IS NULL", [email]);
      await query(
        "INSERT INTO password_reset_codes (id, user_id, email, code_hash, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
        [id, user?.id || null, email, resetCodeHash(email, user ? code : randomBytes(12).toString("hex"))],
      );
      if (user) {
        try {
          await sendMail({
            to: email,
            subject: "Your Yeh Mera India password reset code",
            text: `Your password reset code is ${code}. It expires in 10 minutes and can be used once.`,
            html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px"><h2>Yeh Mera India</h2><p>Use this code to reset your password:</p><p style="font-size:32px;letter-spacing:8px;font-weight:700">${code}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p></div>`,
          });
        } catch (error) {
          await query("UPDATE password_reset_codes SET consumed_at = NOW() WHERE id = ?", [id]).catch(() => {});
          throw error;
        }
      }
      res.status(202).json({
        challengeId: id,
        email,
        verificationRequired: true,
        message: "If the email is registered, a six-digit password reset code has been sent.",
      });
    } catch (error) { next(error); }
  });

  app.post("/api/auth/password-reset/verify", async (req, res, next) => {
    try {
      await ready;
      const email = normalizeEmail(req.body?.email);
      const challengeId = cleanText(req.body?.challengeId, 36);
      const code = cleanText(req.body?.code, 6);
      rateLimit(req, "password-reset-verify", 10, 60 * 60 * 1000, email);
      const rows = await query(
        `SELECT * FROM password_reset_codes
          WHERE id = ? AND email = ? AND consumed_at IS NULL AND expires_at > NOW()
          LIMIT 1`,
        [challengeId, email],
      );
      const record = rows[0];
      if (!record || record.attempts >= 5 || !record.user_id || record.code_hash !== resetCodeHash(email, code)) {
        if (record) await query("UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = ?", [challengeId]);
        return res.status(400).json({ message: "The code is incorrect or expired." });
      }
      const resetToken = randomBytes(32).toString("hex");
      await query(
        `UPDATE password_reset_codes
            SET verified_at = NOW(), reset_token_hash = ?, reset_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
          WHERE id = ?`,
        [hashValue(resetToken), challengeId],
      );
      res.json({ resetRequired: true, resetToken, message: "Code verified. Choose a new password." });
    } catch (error) { next(error); }
  });

  app.post("/api/auth/password-reset/complete", async (req, res, next) => {
    try {
      await ready;
      const resetToken = cleanText(req.body?.resetToken, 128);
      const password = String(req.body?.password || "");
      rateLimit(req, "password-reset-complete", 8, 60 * 60 * 1000);
      if (!passwordValid(password)) return res.status(400).json({ message: "Use at least 10 characters with uppercase, lowercase and a number." });
      const rows = await query(
        `SELECT * FROM password_reset_codes
          WHERE reset_token_hash = ? AND verified_at IS NOT NULL AND consumed_at IS NULL
            AND reset_expires_at > NOW() LIMIT 1`,
        [hashValue(resetToken)],
      );
      if (!rows.length || !rows[0].user_id) return res.status(400).json({ message: "This password reset session is invalid or expired." });
      const hashed = await bcrypt.hash(password, 12);
      await query("UPDATE users SET password = ?, password_changed_at = NOW() WHERE id = ?", [hashed, rows[0].user_id]);
      await query("UPDATE password_reset_codes SET consumed_at = NOW(), reset_token_hash = NULL WHERE id = ?", [rows[0].id]);
      await query("UPDATE auth_codes SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL", [rows[0].user_id]).catch(() => {});
      await query("UPDATE password_reset_tokens SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL", [rows[0].user_id]).catch(() => {});
      await query(
        "INSERT INTO security_events (user_id, email, event_type, ip_address, user_agent) VALUES (?, ?, 'password_reset_otp_completed', ?, ?)",
        [rows[0].user_id, rows[0].email, String(req.ip || "").slice(0, 64), String(req.headers["user-agent"] || "").slice(0, 500)],
      ).catch(() => {});
      res.json({ message: "Password changed successfully. Sign in with your new password." });
    } catch (error) { next(error); }
  });

  app.get("/api/studio/summary", requireMember, async (req, res, next) => {
    try {
      await ready;
      const [roleRows, threads] = await Promise.all([
        query("SELECT * FROM role_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", [req.user.id]),
        memberThreads(req.user.id),
      ]);
      res.json({ user: publicUser(req.user), roleRequest: mapRoleRequest(roleRows[0]), conversations: threads.map(mapThread) });
    } catch (error) { next(error); }
  });

  app.post("/api/studio/role-requests", requireMember, async (req, res, next) => {
    try {
      await ready;
      if (req.user.role !== "viewer") return res.status(400).json({ message: "Only viewer accounts can request a role upgrade." });
      const requestedRole = String(req.body?.requestedRole || "");
      const reason = cleanText(req.body?.reason, 2000);
      if (!["author", "admin"].includes(requestedRole)) return res.status(400).json({ message: "Choose Author or Admin." });
      if (reason.length < 20) return res.status(400).json({ message: "Please explain your request in at least 20 characters." });
      rateLimit(req, "role-request", 4, 24 * 60 * 60 * 1000, String(req.user.id));
      const pending = await query("SELECT id FROM role_requests WHERE user_id = ? AND status = 'pending' LIMIT 1", [req.user.id]);
      if (pending.length) return res.status(409).json({ message: "You already have a pending role request." });
      const result = await query(
        "INSERT INTO role_requests (user_id, requested_role, reason) VALUES (?, ?, ?)",
        [req.user.id, requestedRole, reason],
      );
      const rows = await query("SELECT * FROM role_requests WHERE id = ? LIMIT 1", [result.insertId]);
      res.status(201).json(mapRoleRequest(rows[0]));
    } catch (error) { next(error); }
  });

  app.post("/api/studio/role-requests/:id/cancel", requireMember, async (req, res, next) => {
    try {
      await ready;
      const result = await query(
        "UPDATE role_requests SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'pending'",
        [req.params.id, req.user.id],
      );
      if (!result.affectedRows) return res.status(404).json({ message: "Pending role request not found." });
      const rows = await query("SELECT * FROM role_requests WHERE id = ? LIMIT 1", [req.params.id]);
      res.json(mapRoleRequest(rows[0]));
    } catch (error) { next(error); }
  });

  app.get("/api/studio/conversations", requireMember, async (req, res, next) => {
    try { await ready; res.json((await memberThreads(req.user.id)).map(mapThread)); }
    catch (error) { next(error); }
  });

  app.post("/api/studio/conversations", requireMember, async (req, res, next) => {
    try {
      await ready;
      const subject = cleanText(req.body?.subject, 220);
      const message = cleanText(req.body?.message, 4000);
      if (subject.length < 3) return res.status(400).json({ message: "Add a conversation subject." });
      if (message.length < 3) return res.status(400).json({ message: "Write a message of at least 3 characters." });
      rateLimit(req, "conversation-create", 10, 60 * 60 * 1000, String(req.user.id));
      const result = await query("INSERT INTO conversation_threads (user_id, subject) VALUES (?, ?)", [req.user.id, subject]);
      try {
        await query(
          "INSERT INTO conversation_messages (thread_id, sender_id, sender_type, body, is_read) VALUES (?, ?, 'member', ?, 0)",
          [result.insertId, req.user.id, message],
        );
      } catch (error) {
        await query("DELETE FROM conversation_threads WHERE id = ?", [result.insertId]).catch(() => {});
        throw error;
      }
      const threads = await memberThreads(req.user.id);
      res.status(201).json(mapThread(threads.find((thread) => String(thread.id) === String(result.insertId))));
    } catch (error) { next(error); }
  });

  app.get("/api/studio/conversations/:id", requireMember, async (req, res, next) => {
    try {
      await ready;
      const threads = await query("SELECT * FROM conversation_threads WHERE id = ? AND user_id = ? LIMIT 1", [req.params.id, req.user.id]);
      if (!threads.length) return res.status(404).json({ message: "Conversation not found." });
      await query("UPDATE conversation_messages SET is_read = 1 WHERE thread_id = ? AND sender_type = 'staff'", [req.params.id]);
      res.json({ thread: mapThread(threads[0]), messages: (await threadMessages(req.params.id)).map(mapMessage) });
    } catch (error) { next(error); }
  });

  app.post("/api/studio/conversations/:id/messages", requireMember, async (req, res, next) => {
    try {
      await ready;
      const message = cleanText(req.body?.message, 4000);
      if (message.length < 3) return res.status(400).json({ message: "Write a message of at least 3 characters." });
      rateLimit(req, "conversation-message", 30, 60 * 60 * 1000, String(req.user.id));
      const threads = await query("SELECT * FROM conversation_threads WHERE id = ? AND user_id = ? LIMIT 1", [req.params.id, req.user.id]);
      if (!threads.length) return res.status(404).json({ message: "Conversation not found." });
      if (threads[0].status !== "open") return res.status(409).json({ message: "This conversation is closed." });
      const result = await query(
        "INSERT INTO conversation_messages (thread_id, sender_id, sender_type, body, is_read) VALUES (?, ?, 'member', ?, 0)",
        [req.params.id, req.user.id, message],
      );
      await query("UPDATE conversation_threads SET last_message_at = NOW() WHERE id = ?", [req.params.id]);
      const rows = await query("SELECT m.*, u.name AS sender_name FROM conversation_messages m LEFT JOIN users u ON u.id = m.sender_id WHERE m.id = ?", [result.insertId]);
      res.status(201).json(mapMessage(rows[0]));
    } catch (error) { next(error); }
  });

  app.get("/api/admin/role-requests", requireAdmin, async (req, res, next) => {
    try {
      await ready;
      const status = ["pending", "approved", "rejected", "cancelled"].includes(String(req.query.status)) ? String(req.query.status) : "";
      const params = [];
      const where = status ? "WHERE rr.status = ?" : "";
      if (status) params.push(status);
      const rows = await query(
        `SELECT rr.*, u.name AS user_name, u.email AS user_email, u.role AS current_role, reviewer.name AS reviewer_name
           FROM role_requests rr
           JOIN users u ON u.id = rr.user_id
           LEFT JOIN users reviewer ON reviewer.id = rr.reviewed_by
           ${where}
          ORDER BY CASE rr.status WHEN 'pending' THEN 0 ELSE 1 END, rr.created_at DESC`,
        params,
      );
      res.json(rows.map(mapRoleRequest));
    } catch (error) { next(error); }
  });

  app.put("/api/admin/role-requests/:id", requireAdmin, async (req, res, next) => {
    try {
      await ready;
      const status = String(req.body?.status || "");
      const adminNote = cleanText(req.body?.adminNote, 2000);
      if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Choose Approve or Reject." });
      const result = await query(
        `UPDATE role_requests rr
           JOIN users u ON u.id = rr.user_id
            SET rr.status = ?, rr.admin_note = ?, rr.reviewed_by = ?, rr.reviewed_at = NOW(),
                u.role = IF(? = 1, rr.requested_role, u.role)
          WHERE rr.id = ? AND rr.status = 'pending'`,
        [status, adminNote, req.user.id, status === "approved" ? 1 : 0, req.params.id],
      );
      if (!result.affectedRows) return res.status(404).json({ message: "Pending role request not found." });
      const rows = await query(
        `SELECT rr.*, u.name AS user_name, u.email AS user_email, u.role AS current_role, reviewer.name AS reviewer_name
           FROM role_requests rr JOIN users u ON u.id = rr.user_id
           LEFT JOIN users reviewer ON reviewer.id = rr.reviewed_by WHERE rr.id = ? LIMIT 1`,
        [req.params.id],
      );
      res.json(mapRoleRequest(rows[0]));
    } catch (error) { next(error); }
  });

  app.get("/api/admin/conversations", requireAdmin, async (_req, res, next) => {
    try { await ready; res.json((await adminThreads()).map(mapThread)); }
    catch (error) { next(error); }
  });

  app.get("/api/admin/conversations/:id", requireAdmin, async (req, res, next) => {
    try {
      await ready;
      const rows = await query(
        "SELECT t.*, u.name AS user_name, u.email AS user_email FROM conversation_threads t JOIN users u ON u.id = t.user_id WHERE t.id = ? LIMIT 1",
        [req.params.id],
      );
      if (!rows.length) return res.status(404).json({ message: "Conversation not found." });
      await query("UPDATE conversation_messages SET is_read = 1 WHERE thread_id = ? AND sender_type = 'member'", [req.params.id]);
      res.json({ thread: mapThread(rows[0]), messages: (await threadMessages(req.params.id)).map(mapMessage) });
    } catch (error) { next(error); }
  });

  app.post("/api/admin/conversations/:id/messages", requireAdmin, async (req, res, next) => {
    try {
      await ready;
      const message = cleanText(req.body?.message, 4000);
      if (message.length < 3) return res.status(400).json({ message: "Write a reply of at least 3 characters." });
      const threads = await query("SELECT * FROM conversation_threads WHERE id = ? LIMIT 1", [req.params.id]);
      if (!threads.length) return res.status(404).json({ message: "Conversation not found." });
      if (threads[0].status !== "open") return res.status(409).json({ message: "Reopen this conversation before replying." });
      const result = await query(
        "INSERT INTO conversation_messages (thread_id, sender_id, sender_type, body, is_read) VALUES (?, ?, 'staff', ?, 0)",
        [req.params.id, req.user.id, message],
      );
      await query("UPDATE conversation_threads SET last_message_at = NOW() WHERE id = ?", [req.params.id]);
      const rows = await query("SELECT m.*, u.name AS sender_name FROM conversation_messages m LEFT JOIN users u ON u.id = m.sender_id WHERE m.id = ?", [result.insertId]);
      res.status(201).json(mapMessage(rows[0]));
    } catch (error) { next(error); }
  });

  app.put("/api/admin/conversations/:id/status", requireAdmin, async (req, res, next) => {
    try {
      await ready;
      const status = req.body?.status === "closed" ? "closed" : "open";
      const result = await query("UPDATE conversation_threads SET status = ? WHERE id = ?", [status, req.params.id]);
      if (!result.affectedRows) return res.status(404).json({ message: "Conversation not found." });
      res.json({ id: String(req.params.id), status });
    } catch (error) { next(error); }
  });

  installed = true;
  installing = false;
}

const previousUse = express.application.use;
express.application.use = function memberStudioAwareUse(...args) {
  const result = previousUse.apply(this, args);
  const middleware = args.length === 1 && typeof args[0] === "function" ? args[0] : null;
  if (!installed && !installing && middleware?.name === "jsonParser") installRoutes(this);
  return result;
};
