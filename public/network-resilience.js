(() => {
  "use strict";

  const nativeFetch = window.fetch.bind(window);
  const retryableMethods = new Set(["GET", "HEAD", "OPTIONS"]);
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function methodOf(input, init = {}) {
    return String(init.method || (input instanceof Request ? input.method : "GET") || "GET").toUpperCase();
  }

  function sameOrigin(input) {
    try {
      const url = new URL(input instanceof Request ? input.url : input, location.href);
      return url.origin === location.origin;
    } catch {
      return false;
    }
  }

  async function waitForOnline(maxWait = 12000) {
    if (navigator.onLine) return;
    await Promise.race([
      new Promise((resolve) => window.addEventListener("online", resolve, { once: true })),
      wait(maxWait),
    ]);
  }

  window.fetch = async function resilientFetch(input, init = {}) {
    const method = methodOf(input, init);
    const canRetry = retryableMethods.has(method) && sameOrigin(input);
    const attempts = canRetry ? 3 : 1;
    let lastError;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await nativeFetch(input, init);
        if (!canRetry || response.status < 500 || attempt === attempts - 1) return response;
      } catch (error) {
        lastError = error;
        if (!canRetry || attempt === attempts - 1) throw error;
      }

      await waitForOnline();
      await wait(500 * 2 ** attempt + Math.floor(Math.random() * 250));
    }

    throw lastError || new TypeError("Network request failed.");
  };

  function ensureStatusBanner() {
    let banner = document.getElementById("ymi-network-status");
    if (banner) return banner;
    banner = document.createElement("div");
    banner.id = "ymi-network-status";
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.hidden = true;
    document.body.appendChild(banner);
    return banner;
  }

  function showStatus(message, kind) {
    const banner = ensureStatusBanner();
    banner.textContent = message;
    banner.dataset.kind = kind;
    banner.hidden = false;
  }

  function hideStatusSoon() {
    window.setTimeout(() => {
      const banner = document.getElementById("ymi-network-status");
      if (banner) banner.hidden = true;
    }, 2500);
  }

  window.addEventListener("offline", () => {
    showStatus("Network paused. Yeh Mera India will reconnect automatically.", "offline");
  });

  window.addEventListener("online", () => {
    showStatus("Network restored. Refreshing live content…", "online");
    document.querySelectorAll("img[data-ymi-network-failed='true']").forEach((image) => {
      image.removeAttribute("data-ymi-network-failed");
      const source = image.currentSrc || image.src;
      if (source) image.src = `${source.split("#")[0]}${source.includes("?") ? "&" : "?"}retry=${Date.now()}`;
    });
    window.dispatchEvent(new CustomEvent("ymi:network-restored"));
    hideStatusSoon();
  });

  window.addEventListener("error", (event) => {
    const target = event.target;
    if (target instanceof HTMLImageElement) target.dataset.ymiNetworkFailed = "true";
  }, true);

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/ymi-sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }, { once: true });
  }
})();
