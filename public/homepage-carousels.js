(() => {
  "use strict";

  const SELECTORS = [
    ".work-section .book-grid",
    ".work-section .play-event-grid",
    ".journal-preview .post-grid",
  ];
  const controllers = new Map();
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  let intervalSeconds = 5;
  let scanTimer = 0;

  function clampInterval(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 5;
    return Math.min(60, Math.max(2, Math.round(number)));
  }

  function ensureJournalStyles() {
    if (document.querySelector('link[data-ymi-journal-book-card]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/journal-book-card.css";
    link.dataset.ymiJournalBookCard = "true";
    document.head.appendChild(link);
  }

  function enhanceJournalCards(container) {
    if (!container?.matches?.(".journal-preview .post-grid")) return;
    ensureJournalStyles();

    for (const card of container.querySelectorAll(":scope > .post-card")) {
      card.classList.add("journal-book-card");
      card.dataset.journalCardReady = "true";

      const body = card.lastElementChild;
      if (!(body instanceof HTMLElement)) continue;
      body.classList.add("journal-book-card-body");

      const title = body.querySelector("h3")?.textContent?.trim() || "journal story";
      let more = body.querySelector(".journal-read-more");
      if (!more) {
        more = document.createElement("button");
        more.type = "button";
        more.className = "button primary journal-read-more";
        more.textContent = "Read full journal";
        more.setAttribute("aria-label", `Read full journal: ${title}`);
        body.appendChild(more);
      }
    }
  }

  function carouselName(container) {
    if (container.classList.contains("book-grid")) return "Books";
    if (container.classList.contains("play-event-grid")) return "Plays and events";
    return "Journal stories";
  }

  function cardList(container) {
    return [...container.children].filter((node) => node.nodeType === Node.ELEMENT_NODE);
  }

  function nextCard(container) {
    const cards = cardList(container);
    if (cards.length < 2) return null;
    const baseLeft = cards[0].offsetLeft;
    const current = container.scrollLeft;
    const next = cards.find((card) => card.offsetLeft - baseLeft > current + 24);
    return next || cards[0];
  }

  function moveOneCard(container, state) {
    if (!container.isConnected || state.paused || document.hidden || performance.now() < state.manualPauseUntil) {
      return;
    }
    if (container.scrollWidth <= container.clientWidth + 8) return;
    const card = nextCard(container);
    if (!card) return;
    const first = container.firstElementChild;
    const destination = card === first ? 0 : Math.max(0, card.offsetLeft - (first?.offsetLeft || 0));
    state.programmaticUntil = performance.now() + 1200;
    container.scrollTo({ left: destination, behavior: "smooth" });
  }

  function schedule(container, state) {
    window.clearTimeout(state.timer);
    if (reduceMotion || !container.isConnected) return;
    state.timer = window.setTimeout(() => {
      moveOneCard(container, state);
      schedule(container, state);
    }, intervalSeconds * 1000);
  }

  function enhance(container) {
    if (!container) return;
    enhanceJournalCards(container);
    if (controllers.has(container)) return;

    container.classList.add("ymi-horizontal-carousel");
    container.dataset.carouselReady = "true";
    container.tabIndex = 0;
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", `${carouselName(container)} horizontal carousel`);

    const state = {
      paused: false,
      manualPauseUntil: 0,
      programmaticUntil: 0,
      timer: 0,
    };
    controllers.set(container, state);

    const pause = () => {
      state.paused = true;
      window.clearTimeout(state.timer);
    };
    const resume = () => {
      state.paused = false;
      schedule(container, state);
    };
    const temporaryPause = (milliseconds = 3500) => {
      state.manualPauseUntil = performance.now() + milliseconds;
      schedule(container, state);
    };

    container.addEventListener("pointerenter", pause);
    container.addEventListener("pointerleave", resume);
    container.addEventListener("focusin", pause);
    container.addEventListener("focusout", (event) => {
      if (!container.contains(event.relatedTarget)) resume();
    });
    container.addEventListener("pointerdown", () => {
      pause();
      state.manualPauseUntil = performance.now() + 4500;
    }, { passive: true });
    container.addEventListener("pointerup", () => {
      state.paused = false;
      temporaryPause(3500);
    }, { passive: true });
    container.addEventListener("touchstart", pause, { passive: true });
    container.addEventListener("touchend", () => {
      state.paused = false;
      temporaryPause(4000);
    }, { passive: true });
    container.addEventListener("scroll", () => {
      if (performance.now() < state.programmaticUntil) return;
      temporaryPause(3000);
    }, { passive: true });
    container.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const cards = cardList(container);
      if (!cards.length) return;
      const first = cards[0];
      const current = container.scrollLeft;
      const positions = cards.map((card) => Math.max(0, card.offsetLeft - first.offsetLeft));
      let destination = 0;
      if (event.key === "ArrowRight") {
        destination = positions.find((value) => value > current + 24) ?? positions[positions.length - 1];
      } else {
        destination = [...positions].reverse().find((value) => value < current - 24) ?? 0;
      }
      state.programmaticUntil = performance.now() + 1200;
      container.scrollTo({ left: destination, behavior: "smooth" });
      temporaryPause(4500);
    });

    schedule(container, state);
  }

  function cleanup() {
    for (const [container, state] of controllers) {
      if (container.isConnected) continue;
      window.clearTimeout(state.timer);
      controllers.delete(container);
    }
  }

  function scan(root = document) {
    SELECTORS.forEach((selector) => {
      root.querySelectorAll?.(selector).forEach(enhance);
      if (root.matches?.(selector)) enhance(root);
    });
    cleanup();
    mountAdminSetting();
  }

  async function loadSetting() {
    try {
      const response = await fetch("/api/carousel-settings", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok) intervalSeconds = clampInterval(data.intervalSeconds);
    } catch {
      intervalSeconds = 5;
    }
    for (const [container, state] of controllers) schedule(container, state);
    updateAdminInput();
  }

  function updateAdminInput() {
    const input = document.querySelector("[data-ymi-carousel-interval]");
    if (input && document.activeElement !== input) input.value = String(intervalSeconds);
  }

  function mountAdminSetting() {
    const fields = document.querySelector(".homepage-editor .homepage-fields");
    if (!fields || fields.querySelector("[data-ymi-carousel-admin]")) return;

    const panel = document.createElement("section");
    panel.className = "ymi-carousel-admin-setting";
    panel.dataset.ymiCarouselAdmin = "true";
    panel.innerHTML = `
      <div>
        <h4>Homepage card auto-scroll</h4>
        <p>Controls Books, Plays & events, and Journal preview cards.</p>
      </div>
      <div class="ymi-carousel-admin-row">
        <label>
          Time between cards in seconds
          <input data-ymi-carousel-interval type="number" min="2" max="60" step="1" value="${intervalSeconds}" />
        </label>
        <button type="button" class="button primary" data-ymi-carousel-save>Save carousel timing</button>
      </div>
      <small>Default is 5 seconds. Visitors can still swipe, drag, use a trackpad, or press the arrow keys.</small>
      <p class="ymi-carousel-admin-status" role="status" aria-live="polite"></p>
    `;

    const heading = fields.querySelector(".designer-heading");
    if (heading?.nextSibling) fields.insertBefore(panel, heading.nextSibling);
    else fields.prepend(panel);

    const input = panel.querySelector("[data-ymi-carousel-interval]");
    const button = panel.querySelector("[data-ymi-carousel-save]");
    const status = panel.querySelector(".ymi-carousel-admin-status");

    button.addEventListener("click", async () => {
      const value = Number(input.value);
      if (!Number.isFinite(value) || value < 2 || value > 60) {
        status.textContent = "Choose a value from 2 to 60 seconds.";
        return;
      }
      const token = localStorage.getItem("ymi_admin_token") || localStorage.getItem("ymi_user_token") || "";
      button.disabled = true;
      status.textContent = "Saving carousel timing…";
      try {
        const response = await fetch("/api/admin/carousel-settings", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ intervalSeconds: value }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to save carousel timing.");
        intervalSeconds = clampInterval(data.intervalSeconds);
        input.value = String(intervalSeconds);
        status.textContent = `Saved. Cards will move every ${intervalSeconds} seconds.`;
        for (const [container, state] of controllers) schedule(container, state);
      } catch (error) {
        status.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
  }

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) scan(node);
      });
    });
    mountAdminSetting();
  });

  function start() {
    ensureJournalStyles();
    scan();
    observer.observe(document.body, { childList: true, subtree: true });
    window.clearInterval(scanTimer);
    scanTimer = window.setInterval(() => scan(), 1500);
    loadSetting();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
