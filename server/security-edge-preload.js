import express from "express";
import { randomUUID } from "node:crypto";

let installed = false;
const buckets = new Map();
const originalUse = express.application.use;

const BLOCKED_PATH = /(?:^|\/)(?:\.git|\.env|\.svn|\.hg|vendor\/phpunit|wp-admin|wp-login\.php|xmlrpc\.php|cgi-bin|boaform|actuator|server-status|phpmyadmin|pma|mysqladmin|adminer|xmrig|cryptonight|stratum|solr|jenkins|hudson|\.aws|\.ssh)(?:\/|$)/i;
const BLOCKED_QUERY = /(?:union(?:\s+all)?\s+select|sleep\s*\(|benchmark\s*\(|load_file\s*\(|into\s+outfile|<script|javascript:|\.\.[\\/])/i;
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function requestIp(req) {
  return String(req.ip || req.socket?.remoteAddress || "unknown").slice(0, 100);
}

function pruneBuckets(now, windowMs) {
  if (buckets.size < 5000) return;
  for (const [key, values] of buckets) {
    const active = values.filter((time) => now - time < windowMs);
    if (active.length) buckets.set(key, active);
    else buckets.delete(key);
    if (buckets.size <= 3500) break;
  }
  while (buckets.size > 5000) buckets.delete(buckets.keys().next().value);
}

function rateLimit(req, scope, maximum, windowMs) {
  const now = Date.now();
  pruneBuckets(now, windowMs);
  const key = `${scope}:${requestIp(req)}`;
  const recent = (buckets.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= maximum) return false;
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

function allowedOrigins() {
  const configured = [process.env.PUBLIC_SITE_URL, process.env.FRONTEND_URL]
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return new Set([
    "https://yehmeraindia.com",
    "https://www.yehmeraindia.com",
    ...configured,
  ]);
}

function contentTypeAllowed(req) {
  if (!WRITE_METHODS.has(req.method)) return true;
  if (!String(req.path || "").startsWith("/api/")) return true;
  const length = Number(req.headers["content-length"] || 0);
  if (!length) return true;
  const type = String(req.headers["content-type"] || "").toLowerCase();
  return type.includes("application/json") || type.includes("multipart/form-data") || type.includes("application/x-www-form-urlencoded");
}

function securityHeaders(req, res) {
  const https = req.secure || String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";
  if (https) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), payment=(), usb=(), serial=(), bluetooth=(), interest-cohort=(), geolocation=(self)");
  res.setHeader("X-Request-Id", req.securityRequestId);
  if (/^\/(?:account|studio)(?:\.html)?(?:\/|$)/.test(String(req.path || "")) || /^\/admin(?:\/|$)/.test(String(req.path || ""))) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  if (/^\/api\/(?:auth|profile|studio|admin)(?:\/|$)/.test(String(req.path || ""))) {
    res.setHeader("Cache-Control", "no-store");
  }
}

function install(app) {
  if (installed) return;
  installed = true;
  const origins = allowedOrigins();

  originalUse.call(app, (req, res, next) => {
    req.securityRequestId = String(req.headers["x-request-id"] || randomUUID()).slice(0, 100);
    securityHeaders(req, res);

    const method = String(req.method || "GET").toUpperCase();
    if (["TRACE", "TRACK", "CONNECT"].includes(method)) {
      res.setHeader("Allow", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS");
      return res.status(405).json({ message: "Method not allowed." });
    }

    let pathname;
    try {
      pathname = decodeURIComponent(String(req.path || req.url || "/").split("?")[0]).toLowerCase();
    } catch {
      return res.status(400).json({ message: "Malformed request path." });
    }
    const rawQuery = String(req.originalUrl || "").split("?").slice(1).join("?").slice(0, 4000);
    if (BLOCKED_PATH.test(pathname) || BLOCKED_QUERY.test(rawQuery)) {
      return res.status(404).end();
    }

    const contentLength = Number(req.headers["content-length"] || 0);
    if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > 10 * 1024 * 1024) {
      return res.status(413).json({ message: "Request is too large." });
    }
    if (!contentTypeAllowed(req)) {
      return res.status(415).json({ message: "Unsupported request content type." });
    }

    const origin = String(req.headers.origin || "").replace(/\/$/, "");
    if (origin && !origins.has(origin)) {
      return res.status(403).json({ message: "Cross-site request blocked." });
    }
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With, X-Request-Id");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS");
    }
    if (method === "OPTIONS") return res.status(204).end();

    if (pathname.startsWith("/api/")) {
      const authRequest = pathname.startsWith("/api/auth/") || pathname === "/api/admin/login";
      const maximum = authRequest ? 80 : WRITE_METHODS.has(method) ? 180 : 600;
      const windowMs = 15 * 60 * 1000;
      if (!rateLimit(req, authRequest ? "auth" : WRITE_METHODS.has(method) ? "api-write" : "api-read", maximum, windowMs)) {
        res.setHeader("Retry-After", "900");
        return res.status(429).json({ message: "Too many requests. Please wait and try again." });
      }
    }

    next();
  });
}

express.application.use = function securityEdgeAwareUse(...args) {
  install(this);
  return originalUse.apply(this, args);
};
