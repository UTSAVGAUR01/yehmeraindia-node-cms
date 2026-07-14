import express from "express";

let installed = false;
const originalUse = express.application.use;

function isHtmlNavigation(req) {
  if (!["GET", "HEAD"].includes(String(req.method || "").toUpperCase())) return false;
  const pathname = String(req.path || req.url || "/").split("?")[0];
  if (pathname.startsWith("/api/")) return false;
  if (/\.[a-z0-9]{2,8}$/i.test(pathname)) return pathname.endsWith(".html");
  const accept = String(req.headers?.accept || "");
  return !accept || accept.includes("text/html") || accept.includes("*/*");
}

function installCacheMiddleware(app) {
  if (installed) return;
  installed = true;
  originalUse.call(app, (req, res, next) => {
    if (isHtmlNavigation(req)) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
    }
    next();
  });
}

express.application.use = function frontendCacheAwareUse(...args) {
  installCacheMiddleware(this);
  return originalUse.apply(this, args);
};
