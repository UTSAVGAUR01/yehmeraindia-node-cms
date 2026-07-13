(() => {
  "use strict";

  const state = {
    works: { books: [], events: [] },
    posts: [],
    loading: null,
    previousMeta: null,
  };

  const normalize = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => normalize(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const plainText = (value) => normalize(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const safeUrl = (value) => {
    try {
      const url = new URL(value, window.location.origin);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  };

  const excerptFrom = (post) => {
    const excerpt = plainText(post?.excerpt);
    if (excerpt) return excerpt;
    const content = plainText(post?.content);
    if (!content) return "";
    return content.length > 190 ? `${content.slice(0, 187).trim()}…` : content;
  };

  async function loadData() {
    if (state.loading) return state.loading;
    state.loading = Promise.all([
      fetch("/api/works").then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load works."))),
      fetch("/api/posts").then((response) => response.ok ? response.json() : []),
    ]).then(([works, posts]) => {
      state.works = {
        books: Array.isArray(works?.books) ? works.books : [],
        events: Array.isArray(works?.events) ? works.events : [],
      };
      state.posts = Array.isArray(posts) ? posts : [];
      return state;
    }).catch(() => state);
    return state.loading;
  }

  function ensureActionRow(card) {
    let row = card.querySelector(".work-card-actions");
    if (!row) {
      row = document.createElement("div");
      row.className = "work-card-actions";
      const copy = card.querySelector(":scope > div:last-child") || card;
      copy.appendChild(row);
    }
    return row;
  }

  function makeDetailsButton(type, id) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button secondary work-more-button";
    button.textContent = "More details";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openDetail(type, id, true);
    });
    return button;
  }

  function enhanceBookCards() {
    document.querySelectorAll(".book-card").forEach((card, index) => {
      if (card.dataset.detailReady === "true") return;
      const title = normalize(card.querySelector("h3")?.textContent);
      const book = state.works.books[index] || state.works.books.find((item) => normalize(item.title) === title);
      if (!book) return;

      card.dataset.detailReady = "true";
      card.dataset.workId = String(book.id);
      card.classList.add("work-journal-card");
      card.querySelector(".keyword-chips")?.remove();

      const description = card.querySelector(":scope > div:last-child > p:not(.eyebrow)");
      if (description) {
        description.classList.add("work-card-summary");
        description.textContent = plainText(book.description);
      }

      const row = ensureActionRow(card);
      const purchase = card.querySelector('a[href]:not(.work-more-button)');
      if (purchase) {
        purchase.innerHTML = "Buy now";
        purchase.classList.add("work-buy-button");
        row.appendChild(purchase);
      }
      row.prepend(makeDetailsButton("book", book.id));
    });
  }

  function enhancePlayCards() {
    document.querySelectorAll(".play-event-card").forEach((card, index) => {
      if (card.dataset.detailReady === "true") return;
      const title = normalize(card.querySelector("h3")?.textContent);
      const eventItem = state.works.events[index] || state.works.events.find((item) => normalize(item.eventTitle) === title);
      if (!eventItem) return;

      card.dataset.detailReady = "true";
      card.dataset.workId = String(eventItem.id);
      card.classList.add("work-journal-card");
      card.querySelector(".keyword-chips")?.remove();

      if (!card.querySelector(".play-card-art")) {
        const visual = document.createElement("div");
        visual.className = "play-card-art";
        visual.innerHTML = '<span aria-hidden="true">◈</span><small>Stage performance</small>';
        card.prepend(visual);
      }

      const description = card.querySelector(":scope > p:not(.eyebrow)");
      if (description) {
        description.classList.add("work-card-summary");
        description.textContent = plainText(eventItem.description);
      }

      const row = ensureActionRow(card);
      const booking = card.querySelector('a[href]:not(.work-more-button)');
      if (booking) {
        booking.innerHTML = "Book now";
        booking.classList.add("work-buy-button");
        row.appendChild(booking);
      } else {
        const unavailable = document.createElement("button");
        unavailable.type = "button";
        unavailable.className = "button primary work-buy-button";
        unavailable.textContent = "Booking soon";
        unavailable.disabled = true;
        row.appendChild(unavailable);
      }
      row.prepend(makeDetailsButton("play", eventItem.id));
    });
  }

  function repairJournalExcerpts() {
    document.querySelectorAll(".post-card").forEach((card) => {
      const title = normalize(card.querySelector("h3")?.textContent);
      const post = state.posts.find((item) => normalize(item.title) === title);
      const paragraph = card.querySelector(":scope > div:last-child > p");
      const excerpt = excerptFrom(post);
      if (paragraph && excerpt && normalize(paragraph.textContent) !== excerpt) {
        paragraph.textContent = excerpt;
        paragraph.lang = post?.language || (/\p{Script=Devanagari}/u.test(excerpt) ? "hi" : "en");
      }
    });

    const title = normalize(document.querySelector(".featured-story h2")?.textContent);
    const post = state.posts.find((item) => normalize(item.title) === title);
    const paragraph = document.querySelector(".featured-story > div:last-child > p:not(.eyebrow)");
    const excerpt = excerptFrom(post);
    if (paragraph && excerpt && normalize(paragraph.textContent) !== excerpt) {
      paragraph.textContent = excerpt;
      paragraph.lang = post?.language || (/\p{Script=Devanagari}/u.test(excerpt) ? "hi" : "en");
    }
  }

  function enhancePage() {
    enhanceBookCards();
    enhancePlayCards();
    repairJournalExcerpts();
  }

  function currentDetailRoute() {
    const match = window.location.pathname.match(/^\/(books|plays)\/(\d+)\/?$/);
    if (!match) return null;
    return { type: match[1] === "books" ? "book" : "play", id: match[2] };
  }

  function saveMeta() {
    if (state.previousMeta) return;
    state.previousMeta = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
    };
  }

  function setMeta(title, description) {
    saveMeta();
    document.title = `${title} | Yeh Mera India`;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = plainText(description).slice(0, 160);
  }

  function restoreMeta() {
    if (!state.previousMeta) return;
    document.title = state.previousMeta.title;
    const tag = document.querySelector('meta[name="description"]');
    if (tag) tag.content = state.previousMeta.description;
    state.previousMeta = null;
  }

  function paragraphHtml(value) {
    return normalize(value)
      .split(/\n\s*\n+/)
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");
  }

  function mountDetail(content) {
    let shell = document.getElementById("work-detail-root");
    if (!shell) {
      shell = document.createElement("div");
      shell.id = "work-detail-root";
      document.body.appendChild(shell);
    }
    shell.innerHTML = content;
    document.body.classList.add("work-detail-open");
    shell.querySelectorAll("[data-work-back]").forEach((button) => {
      button.addEventListener("click", () => {
        if (window.history.length > 1) window.history.back();
        else closeDetail(true);
      });
    });
    window.scrollTo({ top: 0 });
  }

  function renderBookDetail(book) {
    const purchaseUrl = safeUrl(book.purchaseUrl);
    setMeta(book.title, book.description);
    mountDetail(`
      <main class="work-detail-page work-detail-book">
        <header class="work-detail-header">
          <button type="button" class="work-detail-back" data-work-back aria-label="Back to Books and Plays">← <span>Back to Books & Plays</span></button>
          <a class="work-detail-logo" href="/">Yeh Mera India</a>
        </header>
        <article class="work-detail-layout">
          <div class="work-detail-cover">
            ${book.coverImage ? `<img src="${escapeHtml(book.coverImage)}" alt="Cover artwork for ${escapeHtml(book.title)}">` : `<div class="work-detail-cover-fallback"><span>Book</span><strong>${escapeHtml(book.title)}</strong></div>`}
          </div>
          <div class="work-detail-copy">
            <p class="eyebrow">Book${book.authorName ? ` · ${escapeHtml(book.authorName)}` : ""}</p>
            <h1>${escapeHtml(book.title)}</h1>
            <div class="work-detail-description">${paragraphHtml(book.description)}</div>
            <div class="work-detail-actions">
              <button type="button" class="button secondary" data-work-back>Back</button>
              ${purchaseUrl ? `<a class="button primary" href="${escapeHtml(purchaseUrl)}" target="_blank" rel="noopener noreferrer sponsored">Buy now</a>` : ""}
            </div>
          </div>
        </article>
      </main>
    `);
  }

  function renderPlayDetail(eventItem) {
    const ticketUrl = safeUrl(eventItem.ticketUrl);
    const date = eventItem.eventAt
      ? new Date(eventItem.eventAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })
      : "Date to be announced";
    setMeta(eventItem.eventTitle, eventItem.description);
    mountDetail(`
      <main class="work-detail-page work-detail-play">
        <header class="work-detail-header">
          <button type="button" class="work-detail-back" data-work-back aria-label="Back to Books and Plays">← <span>Back to Books & Plays</span></button>
          <a class="work-detail-logo" href="/">Yeh Mera India</a>
        </header>
        <article class="work-detail-layout play-detail-layout">
          <div class="work-detail-stage-art" aria-hidden="true"><span>◈</span><small>Live stage</small></div>
          <div class="work-detail-copy">
            <p class="eyebrow">${escapeHtml(eventItem.playTitle || "Play & event")}</p>
            <h1>${escapeHtml(eventItem.eventTitle)}</h1>
            <div class="work-detail-meta"><span>${escapeHtml(date)}</span><span>${escapeHtml(eventItem.venue || "Venue to be announced")}</span></div>
            <div class="work-detail-description">${paragraphHtml(eventItem.description)}</div>
            <div class="work-detail-actions">
              <button type="button" class="button secondary" data-work-back>Back</button>
              ${ticketUrl ? `<a class="button primary" href="${escapeHtml(ticketUrl)}" target="_blank" rel="noopener noreferrer sponsored">Book now</a>` : `<button type="button" class="button primary" disabled>Booking soon</button>`}
            </div>
          </div>
        </article>
      </main>
    `);
  }

  async function openDetail(type, id, pushHistory) {
    await loadData();
    const item = type === "book"
      ? state.works.books.find((book) => String(book.id) === String(id))
      : state.works.events.find((eventItem) => String(eventItem.id) === String(id));
    if (!item) return;

    const route = `/${type === "book" ? "books" : "plays"}/${id}`;
    if (pushHistory && window.location.pathname !== route) {
      window.history.pushState({ workDetail: true }, "", route);
    }
    if (type === "book") renderBookDetail(item);
    else renderPlayDetail(item);
  }

  function closeDetail(replaceRoute = false) {
    document.getElementById("work-detail-root")?.remove();
    document.body.classList.remove("work-detail-open");
    restoreMeta();
    if (replaceRoute) {
      window.history.replaceState({}, "", "/#work");
      window.setTimeout(() => document.getElementById("work")?.scrollIntoView({ block: "start" }), 0);
    }
  }

  async function syncRoute() {
    const route = currentDetailRoute();
    if (route) await openDetail(route.type, route.id, false);
    else closeDetail(false);
  }

  async function start() {
    await loadData();
    enhancePage();
    await syncRoute();

    const root = document.getElementById("root");
    if (root) {
      const observer = new MutationObserver(() => enhancePage());
      observer.observe(root, { childList: true, subtree: true });
    }
    window.addEventListener("popstate", syncRoute);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
