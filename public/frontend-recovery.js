(() => {
  "use strict";

  const retryKey = `ymi_frontend_recovery:${location.pathname}`;

  function rootIsEmpty() {
    const root = document.getElementById("root");
    return !root || !String(root.textContent || "").trim() && !root.children.length;
  }

  function recover(reason) {
    if (sessionStorage.getItem(retryKey) === "1") {
      showFallback(reason);
      return;
    }
    sessionStorage.setItem(retryKey, "1");
    const url = new URL(location.href);
    url.searchParams.set("__frontend_recovery", String(Date.now()));
    location.replace(url.toString());
  }

  function showFallback(reason) {
    if (!rootIsEmpty()) return;
    const root = document.getElementById("root") || document.body.appendChild(document.createElement("div"));
    root.id = "root";
    root.innerHTML = `
      <main style="min-height:100vh;display:grid;place-items:center;background:#080b1d;color:#f4ead6;padding:24px;font-family:Arial,sans-serif">
        <section style="max-width:620px;border:1px solid rgba(232,158,39,.45);padding:32px;background:#0d122b">
          <p style="margin:0 0 10px;color:#e89e27;font-weight:800;letter-spacing:.16em;text-transform:uppercase;font-size:12px">Yeh Mera India</p>
          <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:38px;font-weight:500">The page needs one clean reload.</h1>
          <p style="margin:0 0 22px;line-height:1.7;color:#b9bdd0">A previous deployment file may still be cached by the browser or hosting network. Your account and database data are not affected.</p>
          <button type="button" id="ymi-recovery-reload" style="min-height:46px;padding:0 18px;border:0;background:#e89e27;color:#080b1d;font-weight:800;cursor:pointer">Reload current website</button>
          <small style="display:block;margin-top:14px;color:#7f849c">Recovery reference: ${String(reason || "frontend-startup").replace(/[<>]/g, "")}</small>
        </section>
      </main>`;
    document.getElementById("ymi-recovery-reload")?.addEventListener("click", () => {
      sessionStorage.removeItem(retryKey);
      const url = new URL(location.href);
      url.searchParams.set("__reload", String(Date.now()));
      location.replace(url.toString());
    });
  }

  window.addEventListener("error", (event) => {
    const target = event.target;
    if (target instanceof HTMLScriptElement && /\/assets\/.*\.js(?:\?|$)/.test(target.src)) recover("javascript-asset");
    if (target instanceof HTMLLinkElement && /\/assets\/.*\.css(?:\?|$)/.test(target.href)) recover("stylesheet-asset");
  }, true);

  window.addEventListener("pageshow", () => {
    if (!rootIsEmpty()) sessionStorage.removeItem(retryKey);
  });

  window.setTimeout(() => {
    if (document.readyState === "complete" && rootIsEmpty()) recover("empty-react-root");
  }, 7000);
})();
