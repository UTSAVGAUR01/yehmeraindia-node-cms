const VERSION = "ymi-vpn-shell-8";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const TILE_CACHE = `${VERSION}-tiles`;
const CORE = [
  "/map-bootstrap.js",
  "/map-cleanup.css",
  "/india-boundary-refine.css",
  "/network-resilience.css",
  "/india-vector-map.css",
  "/india-vector-map.js",
  "/book-card-compact.css",
  "/react-layout-fixes.css",
  "/site-footer.css",
  "/global-footer-safe.css",
  "/admin-profile-link.css",
  "/network-resilience.js",
];

async function cacheOne(cache, url) {
  try {
    const response = await fetch(url, { cache: "reload" });
    if (response?.ok) await cache.put(url, response.clone());
    return response;
  } catch {
    return null;
  }
}

function buildAssets(html) {
  const values = new Set();
  for (const match of html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+\.(?:js|css))["']/gi)) {
    values.add(match[1]);
  }
  return [...values];
}

async function cacheDocumentAndAssets(response, requestUrl = "/") {
  if (!response?.ok) return;
  const cache = await caches.open(SHELL_CACHE);
  let html = "";
  try {
    html = await response.clone().text();
  } catch {}
  await cache.put(requestUrl, response.clone()).catch(() => {});
  if (requestUrl !== "/") await cache.put("/", response.clone()).catch(() => {});
  await Promise.all(buildAssets(html).map((asset) => cacheOne(cache, asset)));
}

async function installShell() {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.all(CORE.map((url) => cacheOne(cache, url)));
  const homepage = await cacheOne(cache, "/");
  if (homepage) await cacheDocumentAndAssets(homepage, "/");
}

self.addEventListener("install", (event) => {
  event.waitUntil(installShell());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("ymi-") && ![SHELL_CACHE, RUNTIME_CACHE, TILE_CACHE].includes(key))
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

async function withTimeout(request, milliseconds) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), milliseconds);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function navigationResponse(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await withTimeout(request, 7000);
    if (response?.ok) cacheDocumentAndAssets(response.clone(), request.url).catch(() => {});
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true }))
      || (await cache.match("/", { ignoreSearch: true }))
      || new Response(
        "Yeh Mera India is waiting for the network connection to return.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const shell = await caches.open(SHELL_CACHE);
  const cached = (await cache.match(request)) || (await shell.match(request));
  const update = fetch(request).then((response) => {
    if (response?.ok || response?.type === "opaque") cache.put(request, response.clone()).catch(() => {});
    return response;
  }).catch(() => null);
  return cached || (await update) || new Response("", { status: 504 });
}

async function externalMapResponse(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    fetch(request).then((response) => {
      if (response?.ok || response?.type === "opaque") cache.put(request, response.clone()).catch(() => {});
    }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response?.ok || response?.type === "opaque") cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    return new Response("", { status: 504 });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/api/")) return;
    if (["script", "style", "font", "image"].includes(request.destination)) {
      event.respondWith(staleWhileRevalidate(request));
    }
    return;
  }

  if (/tile\.openstreetmap\.org$|basemaps\.cartocdn\.com$|arcgisonline\.com$|tiles\.openfreemap\.org$|unpkg\.com$/.test(url.hostname)) {
    event.respondWith(externalMapResponse(request));
  }
});
