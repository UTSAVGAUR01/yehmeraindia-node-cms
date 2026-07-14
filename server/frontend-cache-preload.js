import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import express from "express";

let installed = false;
let assetSnapshot = { checkedAt: 0, javascript: "", stylesheet: "" };
let deploymentTokenCache = "";
const originalUse = express.application.use;
const originalStatic = express.static;
const originalSendFile = express.response.sendFile;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const distIndex = path.join(distDir, "index.html");
const stableJavascript = path.join(distDir, "assets", "app.js");
const stableStylesheet = path.join(distDir, "assets", "app.css");

function isHtmlNavigation(req) {
  if (!["GET", "HEAD"].includes(String(req.method || "").toUpperCase())) return false;
  const pathname = String(req.path || req.url || "/").split("?")[0];
  if (pathname.startsWith("/api/")) return false;
  if (/\.[a-z0-9]{2,8}$/i.test(pathname)) return pathname.endsWith(".html");
  const accept = String(req.headers?.accept || "");
  return !accept || accept.includes("text/html") || accept.includes("*/*");
}

function deploymentToken() {
  if (deploymentTokenCache) return deploymentTokenCache;
  const hash = createHash("sha256");
  let found = false;
  for (const file of [distIndex, stableJavascript, stableStylesheet]) {
    try {
      hash.update(fs.readFileSync(file));
      found = true;
    } catch {}
  }
  deploymentTokenCache = found ? hash.digest("hex").slice(0, 16) : String(Date.now());
  return deploymentTokenCache;
}

function versionedHtml() {
  const html = fs.readFileSync(distIndex, "utf8");
  const token = encodeURIComponent(deploymentToken());
  return html
    .replace(/\/assets\/app\.js(?:\?[^"']*)?/g, `/assets/app.js?v=${token}`)
    .replace(/\/assets\/app\.css(?:\?[^"']*)?/g, `/assets/app.css?v=${token}`);
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

express.static = function versionAwareStatic(root, options = {}) {
  const originalSetHeaders = options.setHeaders;
  return originalStatic(root, {
    ...options,
    index: false,
    setHeaders(res, filePath, stat) {
      const normalized = String(filePath || "").replaceAll("\\", "/");
      if (normalized.endsWith("/assets/app.js") || normalized.endsWith("/assets/app.css")) {
        noCache(res);
        res.setHeader("X-YMI-Build", deploymentToken());
      }
      originalSetHeaders?.(res, filePath, stat);
    },
  });
};

express.response.sendFile = function versionAwareSendFile(filePath, ...args) {
  try {
    if (path.resolve(String(filePath || "")) === path.resolve(distIndex)) {
      noCache(this);
      this.setHeader("X-YMI-Build", deploymentToken());
      this.type("html");
      return this.send(versionedHtml());
    }
  } catch (error) {
    console.error("Frontend HTML versioning failed:", error.message);
  }
  return originalSendFile.call(this, filePath, ...args);
};

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
        return res.redirect(307, `${replacement}?v=${deploymentToken()}`);
      }
    }
    next();
  });
}

express.application.use = function frontendCacheAwareUse(...args) {
  installCacheMiddleware(this);
  return originalUse.apply(this, args);
};
