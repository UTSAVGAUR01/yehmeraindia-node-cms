(() => {
  "use strict";

  const fallback = {
    title: "Stories, stagecraft and ideas for tomorrow.",
    body: "Start a conversation with Yeh Mera India and follow new work from the page, stage and AI lab.",
    email: "support@yehmeraindia.com",
    instagramUrl: "",
    facebookUrl: "",
    xUrl: "",
    youtubeUrl: "",
    linkedinUrl: "",
  };

  let settings = fallback;
  let scheduled = false;

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function safeUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
    } catch {
      return "";
    }
  }

  const icon = (platform) => {
    const icons = {
      instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="fill"/></svg>',
      facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 8H17V4.5c-.7-.1-1.9-.2-3.4-.2-3.3 0-5.6 2-5.6 5.8V13H4.5v4H8v7h4.3v-7H16l.6-4h-4.3v-2.5C12.3 9.3 12.7 8 14.5 8Z" class="fill"/></svg>',
      x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20"/></svg>',
      youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9 5 3-5 3Z" class="fill"/></svg>',
      linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="9" width="4" height="11" class="fill"/><circle cx="6" cy="5.5" r="2" class="fill"/><path d="M11 20V9h4v1.7c1-1.4 2.2-2.1 4-2.1 3 0 4.5 2 4.5 5.4v6h-4v-5.3c0-1.6-.6-2.6-2-2.6-1.6 0-2.5 1.1-2.5 3.2V20Z" class="fill"/></svg>',
    };
    return icons[platform] || "";
  };

  function socialLinks(data) {
    return [
      ["instagram", "Instagram", data.instagramUrl],
      ["facebook", "Facebook", data.facebookUrl],
      ["x", "X / Twitter", data.xUrl],
      ["youtube", "YouTube", data.youtubeUrl],
      ["linkedin", "LinkedIn", data.linkedinUrl],
    ].map(([platform, label, value]) => {
      const href = safeUrl(value);
      if (!href) return "";
      return `<a class="ymi-footer-social-link ${platform}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="Follow Yeh Mera India on ${escapeHtml(label)}" title="${escapeHtml(label)}">${icon(platform)}<span>${escapeHtml(label)}</span></a>`;
    }).join("");
  }

  function renderFooter(footer) {
    if (!(footer instanceof HTMLElement)) return;
    const signature = JSON.stringify(settings);
    if (footer.dataset.ymiFooterSignature === signature && footer.querySelector(".ymi-footer-shell")) return;

    const socials = socialLinks(settings);
    const email = escapeHtml(settings.email || fallback.email);
    footer.className = `${footer.className || ""} ymi-site-footer`.trim();
    footer.dataset.ymiFooterSignature = signature;
    footer.innerHTML = `
      <div class="ymi-footer-glow" aria-hidden="true"></div>
      <div class="ymi-footer-shell">
        <section class="ymi-footer-brand-block">
          <a class="ymi-footer-brand" href="/" aria-label="Yeh Mera India home">Yeh Mera India</a>
          <p>${escapeHtml(settings.title || fallback.title)}</p>
          <span class="ymi-footer-rule"></span>
        </section>
        <section class="ymi-footer-connect">
          <p class="ymi-footer-eyebrow">Connect with the stories</p>
          <h2>Read. Watch. Join the conversation.</h2>
          <p>${escapeHtml(settings.body || fallback.body)}</p>
          <a class="ymi-footer-email" href="mailto:${email}"><span>Write to us</span><strong>${email}</strong></a>
        </section>
        <nav class="ymi-footer-navigation" aria-label="Footer navigation">
          <p class="ymi-footer-eyebrow">Explore</p>
          <div>
            <a href="/">Home</a>
            <a href="/know-india">Know My India</a>
            <a href="/#work">Books &amp; Plays</a>
            <a href="/journal">Journal</a>
            <a href="/videos">Videos</a>
          </div>
        </nav>
        <section class="ymi-footer-follow">
          <p class="ymi-footer-eyebrow">Follow Yeh Mera India</p>
          <div class="ymi-footer-socials">${socials || '<span class="ymi-footer-social-placeholder">Social channels will appear here.</span>'}</div>
        </section>
        <div class="ymi-footer-bottom">
          <small>© ${new Date().getFullYear()} Yeh Mera India. All rights reserved.</small>
          <span>Indian stories · Theatre · Responsible AI</span>
        </div>
      </div>`;
  }

  function applyFooters() {
    scheduled = false;
    document.querySelectorAll("main footer").forEach(renderFooter);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(applyFooters);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", schedule);
  window.addEventListener("hashchange", schedule);
  schedule();

  fetch("/api/footer-settings", { headers: { Accept: "application/json" } })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("Footer settings unavailable")))
    .then((data) => {
      settings = { ...fallback, ...(data || {}) };
      document.querySelectorAll("main footer").forEach((footer) => delete footer.dataset.ymiFooterSignature);
      schedule();
    })
    .catch(() => {
      settings = fallback;
      schedule();
    });
})();
