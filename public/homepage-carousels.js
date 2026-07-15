(() => {
  "use strict";

  const SELECTORS = [
    ".work-section .book-grid",
    ".work-section .play-event-grid",
    ".journal-preview .post-grid",
  ];
  const controllers = new WeakMap();
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  function carouselName(container) {
    if (container.classList.contains("book-grid")) return "Books";
    if (container.classList.contains("play-event-grid")) return "Plays and events";
    return "Journal stories";
  }

  function enhance(container) {
    if (!container || controllers.has(container)) return;

    container.classList.add("ymi-horizontal-carousel");
    container.dataset.carouselReady = "true";
    container.tabIndex = 0;
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", `${carouselName(container)} horizontal carousel`);

    const state = {
      paused: false,
      manuallyPausedUntil: 0,
      lastFrame: performance.now(),
      edgePauseUntil: 0,
      frame: 0,
    };
    controllers.set(container, state);

    const pause = () => { state.paused = true; };
    const resume = () => {
      state.paused = false;
      state.lastFrame = performance.now();
    };
    const temporaryPause = (milliseconds = 2800) => {
      state.manuallyPausedUntil = performance.now() + milliseconds;
    };

    container.addEventListener("pointerenter", pause);
    container.addEventListener("pointerleave", resume);
    container.addEventListener("focusin", pause);
    container.addEventListener("focusout", (event) => {
      if (!container.contains(event.relatedTarget)) resume();
    });
    container.addEventListener("pointerdown", () => {
      pause();
      temporaryPause(3500);
    }, { passive: true });
    container.addEventListener("pointerup", () => {
      resume();
      temporaryPause(2500);
    }, { passive: true });
    container.addEventListener("touchstart", () => {
      pause();
      temporaryPause(4000);
    }, { passive: true });
    container.addEventListener("touchend", () => {
      resume();
      temporaryPause(3000);
    }, { passive: true });
    container.addEventListener("scroll", () => temporaryPause(1800), { passive: true });
    container.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const amount = Math.max(260, container.clientWidth * 0.72);
      container.scrollBy({
        left: event.key === "ArrowRight" ? amount : -amount,
        behavior: "smooth",
      });
      temporaryPause(4000);
    });

    if (reduceMotion) return;

    function tick(now) {
      if (!container.isConnected) {
        cancelAnimationFrame(state.frame);
        controllers.delete(container);
        return;
      }

      const elapsed = Math.min(64, now - state.lastFrame);
      state.lastFrame = now;
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      const canMove = maxScroll > 8;
      const blocked = state.paused
        || document.hidden
        || now < state.manuallyPausedUntil
        || now < state.edgePauseUntil;

      if (canMove && !blocked) {
        const speed = window.innerWidth < 720 ? 18 : 26;
        container.scrollLeft += (speed * elapsed) / 1000;

        if (container.scrollLeft >= maxScroll - 2) {
          state.edgePauseUntil = now + 1400;
          window.setTimeout(() => {
            if (!container.isConnected) return;
            container.scrollTo({ left: 0, behavior: "smooth" });
            state.manuallyPausedUntil = performance.now() + 1100;
          }, 900);
        }
      }

      state.frame = requestAnimationFrame(tick);
    }

    state.frame = requestAnimationFrame(tick);
  }

  function scan(root = document) {
    SELECTORS.forEach((selector) => {
      root.querySelectorAll?.(selector).forEach(enhance);
      if (root.matches?.(selector)) enhance(root);
    });
  }

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) scan(node);
      });
    });
  });

  function start() {
    scan();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
