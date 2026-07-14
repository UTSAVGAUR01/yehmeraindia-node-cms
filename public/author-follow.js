(() => {
  "use strict";

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

  function icon(platform) {
    const icons = {
      instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="fill"/></svg>',
      facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 8H17V4.5c-.7-.1-1.9-.2-3.4-.2-3.3 0-5.6 2-5.6 5.8V13H4.5v4H8v7h4.3v-7H16l.6-4h-4.3v-2.5C12.3 9.3 12.7 8 14.5 8Z" class="fill"/></svg>',
      x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20"/></svg>',
      youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9 5 3-5 3Z" class="fill"/></svg>',
      linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="9" width="4" height="11" class="fill"/><circle cx="6" cy="5.5" r="2" class="fill"/><path d="M11 20V9h4v1.7c1-1.4 2.2-2.1 4-2.1 3 0 4.5 2 4.5 5.4v6h-4v-5.3c0-1.6-.6-2.6-2-2.6-1.6 0-2.5 1.1-2.5 3.2V20Z" class="fill"/></svg>',
      website: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.5 3.7 5.5 3.7 9S14.4 18.5 12 21M12 3c-2.4 2.5-3.7 5.5-3.7 9s1.3 6.5 3.7 9"/></svg>',
      other: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/></svg>',
    };
    return icons[platform] || icons.other;
  }

  function socialButtons(profile) {
    const links = [
      ["instagram", "Instagram", profile.instagramUrl],
      ["facebook", "Facebook", profile.facebookUrl],
      ["x", "X / Twitter", profile.xUrl],
      ["youtube", "YouTube", profile.youtubeUrl],
      ["linkedin", "LinkedIn", profile.linkedinUrl],
      ["website", "Website", profile.websiteUrl],
      ["other", profile.otherLabel || "More", profile.otherUrl],
    ];

    return links.map(([platform, label, value]) => {
      const href = safeUrl(value);
      if (!href) return "";
      return `<a class="ymi-author-social ${platform}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="Follow ${escapeHtml(profile.name)} on ${escapeHtml(label)}">${icon(platform)}<span>${escapeHtml(label)}</span></a>`;
    }).join("");
  }

  async function loadProfile(slug) {
    const response = await fetch(`/api/posts/${encodeURIComponent(slug)}/author-profile`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => ({}));
    return data?.profile || null;
  }

  function initials(name) {
    return String(name || "Yeh Mera India")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "YI";
  }

  function inject(profile) {
    const article = document.querySelector("article.article");
    if (!article || article.querySelector(".ymi-author-follow")) return false;
    const buttons = socialButtons(profile);
    if (!buttons) return false;

    const section = document.createElement("section");
    section.className = "ymi-author-follow";
    section.setAttribute("aria-label", `Follow ${profile.name}`);
    section.innerHTML = `
      <div class="ymi-author-avatar" aria-hidden="true">${escapeHtml(initials(profile.name))}</div>
      <div class="ymi-author-follow-copy">
        <p class="ymi-author-follow-eyebrow">About the author</p>
        <h2>${escapeHtml(profile.name)}</h2>
        ${profile.bio ? `<p>${escapeHtml(profile.bio)}</p>` : '<p>Follow the author for new journal entries, books, plays and cultural work.</p>'}
      </div>
      <div class="ymi-author-follow-actions">
        <span>Follow the author</span>
        <div>${buttons}</div>
      </div>`;

    const contact = article.querySelector(".author-contact");
    if (contact) contact.before(section);
    else article.append(section);
    return true;
  }

  let activeSlug = "";
  let activeProfile = null;
  let loading = false;

  async function run() {
    const match = location.pathname.match(/^\/journal\/([^/]+)\/?$/);
    if (!match) {
      activeSlug = "";
      activeProfile = null;
      return;
    }
    const slug = decodeURIComponent(match[1]);
    if (activeSlug === slug && activeProfile) {
      inject(activeProfile);
      return;
    }
    if (loading) return;
    loading = true;
    try {
      const profile = await loadProfile(slug);
      activeSlug = slug;
      activeProfile = profile;
      if (profile) inject(profile);
    } catch {
      // Follow links are optional and must never block an article.
    } finally {
      loading = false;
    }
  }

  const observer = new MutationObserver(() => void run());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", () => void run());
  void run();
})();
