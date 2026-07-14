import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

let installed = false;
let assetSnapshot = { checkedAt: 0, javascript: "", stylesheet: "" };
const originalUse = express.application.use;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const distIndex = path.join(distDir, "index.html");

function isHtmlNavigation(req) {
  if (!["GET", "HEAD"].includes(String(req.method || "").toUpperCase())) return false;
  const pathname = String(req.path || req.url || "/").split("?")[0];
  if (pathname.startsWith("/api/")) return false;
  if (/\.[a-z0-9]{2,8}$/i.test(pathname)) return pathname.endsWith(".html");
  const accept = String(req.headers?.accept || "");
  return !accept || accept.includes("text/html") || accept.includes("*/*");
}

function currentAssets() {
  const now = Date.now();
  if (now - assetSnapshot.checkedAt < 2000) return assetSnapshot;
  let javascript = "";
  let stylesheet = "";
  try {
    const html = fs.readFileSync(distIndex, "utf8");
    javascript = html.match(/<script[^>]+src=["'](\/assets\/(?:app|index-[^"']+)\.js)["']/i)?.[1] || "";
    stylesheet = html.match(/<link[^>]+href=["'](\/assets\/(?:app|index-[^"']+)\.css)["']/i)?.[1] || "";
  } catch {}
  assetSnapshot = { checkedAt: now, javascript, stylesheet };
  return assetSnapshot;
}

function existingAsset(pathname) {
  if (!pathname.startsWith("/assets/")) return false;
  const relative = pathname.replace(/^\/+/, "");
  const assetsDir = path.join(distDir, "assets");
  const resolved = path.resolve(distDir, relative);
  if (resolved !== assetsDir && !resolved.startsWith(`${assetsDir}${path.sep}`)) return false;
  return fs.existsSync(resolved);
}

function recoveryAsset(pathname) {
  if (!/^\/assets\/(?:app|index-[A-Za-z0-9._-]+)\.(?:js|css)$/.test(pathname)) return "";
  if (existingAsset(pathname)) return "";
  const assets = currentAssets();
  return pathname.endsWith(".js") ? assets.javascript : assets.stylesheet;
}

function noCache(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
}

function installCacheMiddleware(app) {
  if (installed) return;
  installed = true;
  originalUse.call(app, (req, res, next) => {
    const pathname = String(req.path || req.url || "/").split("?")[0];
    if (isHtmlNavigation(req) || pathname === "/assets/app.js" || pathname === "/assets/app.css") {
      noCache(res);
    }

    if (["GET", "HEAD"].includes(String(req.method || "").toUpperCase())) {
      const replacement = recoveryAsset(pathname);
      if (replacement && replacement !== pathname) {
        noCache(res);
        res.setHeader("X-YMI-Asset-Recovery", "stale-build-reference");
        return res.redirect(307, `${replacement}?recovered=${Date.now()}`);
      }
    }
    next();
  });
}

express.application.use = function frontendCacheAwareUse(...args) {
  installCacheMiddleware(this);
  return originalUse.apply(this, args);
};
