import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "./db.js";
import { registerSecurityAuth } from "./security-auth.js";

let installed = false;
let installing = false;

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured.");
    error.statusCode = 503;
    throw error;
  }
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

function installSecureAuth(app) {
  if (installed || installing) return;
  installing = true;
  registerSecurityAuth(app, { query, bcrypt, signToken, publicUser, requireAuth });
  installed = true;
  installing = false;
}

const legacyAuthPosts = new Set([
  "/api/auth/signup",
  "/api/auth/signin",
  "/api/admin/login",
]);

const originalUse = express.application.use;
const originalPost = express.application.post;

express.application.use = function securityAwareUse(...args) {
  const result = originalUse.apply(this, args);
  const middleware = args.length === 1 && typeof args[0] === "function" ? args[0] : null;
  if (!installed && !installing && middleware?.name === "jsonParser") {
    installSecureAuth(this);
  }
  return result;
};

express.application.post = function securityAwarePost(path, ...handlers) {
  if (installing) return originalPost.call(this, path, ...handlers);
  if (!installed && legacyAuthPosts.has(path)) installSecureAuth(this);
  if (installed && legacyAuthPosts.has(path)) return this;
  return originalPost.call(this, path, ...handlers);
};
