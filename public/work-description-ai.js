(() => {
  "use strict";

  const states = new WeakMap();
  const sparkle = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></svg>';
  let adminObserver = null;

  function label(form, pattern) {
    return [...form.querySelectorAll("label")].find((item) => pattern.test(item.childNodes[0]?.textContent || item.textContent || ""));
  }

  function value(form, pattern) {
    const field = label(form, pattern)?.querySelector("input, textarea, select");
    return field?.value || "";
  }

  function setReactTextarea(textarea, nextValue) {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (setter) setter.call(textarea, nextValue);
    else textarea.value = nextValue;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function identify(form) {
    const heading = form.querySelector(".manager-heading .eyebrow")?.textContent?.trim().toLowerCase() || "";
    if (heading === "books") {
      return {
        type: "book",
        titlePattern: /book title/i,
        secondaryPattern: null,
        descriptionPattern: /book description/i,
        venuePattern: null,
        eventAtPattern: null,
      };
    }
    if (heading.includes("plays") || heading.includes("events")) {
      return {
        type: "event",
        titlePattern: /event title/i,
        secondaryPattern: /play title/i,
        descriptionPattern: /play and event description/i,
        venuePattern: /^venue/i,
        eventAtPattern: /event date and time/i,
      };
    }
    return null;
  }

  function stateFor(form) {
    if (!states.has(form)) {
      states.set(form, {
        generated: "",
        instruction: "",
        style: "balanced",
        language: "auto",
        busy: false,
      });
    }
    return states.get(form);
  }

  function panelHtml(type) {
    const noun = type === "book" ? "book" : "play event";
    return `
      <div class="ymi-work-ai-heading">
        <div>${sparkle}<span><b>AI ${noun} writer</b><p>Give a writing direction, review the draft, then apply it to the description field.</p></span></div>
        <span class="ymi-work-ai-model">Author controlled</span>
      </div>
      <div class="ymi-work-ai-grid">
        <label>Writing style
          <select data-ymi-style>
            <option value="balanced">Balanced and professional</option>
            <option value="literary">Literary and atmospheric</option>
            <option value="sales">Persuasive sales copy</option>
            <option value="concise">Short and direct</option>
            <option value="detailed">Detailed and immersive</option>
            ${type === "event" ? '<option value="invitation">Warm event invitation</option><option value="press">Press and media style</option>' : '<option value="historical">Historical fiction focus</option><option value="reader">Reader-focused catalogue</option>'}
          </select>
        </label>
        <label>Output language
          <select data-ymi-language>
            <option value="auto">Match my title and notes</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Rajasthani or Marwari">Rajasthani / Marwari</option>
            <option value="Hindi and English bilingual">Hindi + English</option>
          </select>
        </label>
        <label class="ymi-work-ai-direction">Your writing suggestion or direction
          <textarea data-ymi-instruction maxlength="3000" placeholder="Example: Focus on Queen Krishna's emotional conflict, keep the historical tone, avoid political claims, and write about 250 words for Indian readers."></textarea>
        </label>
      </div>
      <div class="ymi-work-ai-actions">
        <button type="button" class="ymi-work-ai-action primary" data-ymi-action="write">${sparkle}<span>Write a new description</span></button>
        <button type="button" class="ymi-work-ai-action" data-ymi-action="rewrite"><span>Rewrite my current description</span></button>
      </div>
      <p class="ymi-work-ai-status" data-ymi-status hidden></p>
      <p class="ymi-work-ai-error" data-ymi-error hidden></p>
      <div class="ymi-work-ai-preview" data-ymi-preview hidden>
        <b>AI draft for review</b>
        <textarea data-ymi-generated aria-label="Generated description preview"></textarea>
        <div class="ymi-work-ai-preview-actions">
          <button type="button" class="ymi-work-ai-action primary" data-ymi-apply><span>Use this description</span></button>
          <button type="button" class="ymi-work-ai-action" data-ymi-again><span>Generate another version</span></button>
        </div>
      </div>`;
  }

  function show(panel, type, message) {
    const status = panel.querySelector("[data-ymi-status]");
    const error = panel.querySelector("[data-ymi-error]");
    status.hidden = type !== "status" || !message;
    error.hidden = type !== "error" || !message;
    status.textContent = type === "status" ? message : "";
    error.textContent = type === "error" ? message : "";
  }

  function setBusy(panel, state, busy) {
    state.busy = busy;
    panel.querySelectorAll("button").forEach((button) => { button.disabled = busy; });
  }

  async function generate(form, panel, config, action) {
    const state = stateFor(form);
    if (state.busy) return;
    const token = localStorage.getItem("ymi_admin_token") || localStorage.getItem("ymi_user_token");
    if (!token) {
      show(panel, "error", "Your session is missing. Sign in again before using the AI writer.");
      return;
    }

    const descriptionField = label(form, config.descriptionPattern)?.querySelector("textarea");
    const payload = {
      type: config.type,
      action,
      title: value(form, config.titlePattern),
      secondaryTitle: config.secondaryPattern ? value(form, config.secondaryPattern) : "",
      currentDescription: descriptionField?.value || "",
      instruction: panel.querySelector("[data-ymi-instruction]")?.value?.trim() || "",
      style: panel.querySelector("[data-ymi-style]")?.value || "balanced",
      language: panel.querySelector("[data-ymi-language]")?.value || "auto",
      venue: config.venuePattern ? value(form, config.venuePattern) : "",
      eventAt: config.eventAtPattern ? value(form, config.eventAtPattern) : "",
    };

    state.instruction = payload.instruction;
    state.style = payload.style;
    state.language = payload.language;
    state.lastAction = action;
    setBusy(panel, state, true);
    show(panel, "status", action === "rewrite" ? "Rewriting your description with the requested direction…" : "Writing a fresh description from your details and direction…");

    try {
      const response = await fetch("/api/admin/ai/work-description", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "The AI description could not be prepared.");
      state.generated = String(data.description || "").trim();
      const preview = panel.querySelector("[data-ymi-preview]");
      const generated = panel.querySelector("[data-ymi-generated]");
      generated.value = state.generated;
      preview.hidden = !state.generated;
      show(panel, "status", `Draft prepared with ${data.model || "the selected AI model"}. Review it before applying.`);
      preview.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      show(panel, "error", error.message);
    } finally {
      setBusy(panel, state, false);
    }
  }

  function enhance(form) {
    if (form.dataset.ymiDescriptionAi === "true") return;
    const config = identify(form);
    if (!config) return;
    const descriptionLabel = label(form, config.descriptionPattern);
    const descriptionField = descriptionLabel?.querySelector("textarea");
    if (!descriptionLabel || !descriptionField) return;

    form.dataset.ymiDescriptionAi = "true";
    const state = stateFor(form);
    const panel = document.createElement("section");
    panel.className = "ymi-work-ai-writer";
    panel.setAttribute("aria-label", `AI ${config.type} description writer`);
    panel.innerHTML = panelHtml(config.type);
    descriptionLabel.after(panel);

    panel.querySelector("[data-ymi-style]").value = state.style;
    panel.querySelector("[data-ymi-language]").value = state.language;
    panel.querySelector("[data-ymi-instruction]").value = state.instruction;

    panel.querySelectorAll("[data-ymi-action]").forEach((button) => {
      button.addEventListener("click", () => void generate(form, panel, config, button.dataset.ymiAction));
    });
    panel.querySelector("[data-ymi-again]").addEventListener("click", () => {
      void generate(form, panel, config, state.lastAction || "write");
    });
    panel.querySelector("[data-ymi-apply]").addEventListener("click", () => {
      const generated = panel.querySelector("[data-ymi-generated]").value.trim();
      if (!generated) return;
      state.generated = generated;
      setReactTextarea(descriptionField, generated);
      show(panel, "status", "Description applied. Review the complete form and use the normal Save button when ready.");
      descriptionField.focus({ preventScroll: true });
      descriptionField.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function scan() {
    document.querySelectorAll("form.works-form").forEach(enhance);
  }

  function activateForCurrentPage() {
    const isAdmin = /^\/admin\/?$/.test(location.pathname);
    if (!isAdmin) {
      adminObserver?.disconnect();
      adminObserver = null;
      return;
    }
    scan();
    if (adminObserver) return;
    const root = document.getElementById("root");
    if (!root) return;
    adminObserver = new MutationObserver(scan);
    adminObserver.observe(root, { childList: true, subtree: true });
  }

  window.addEventListener("popstate", () => window.setTimeout(activateForCurrentPage, 0));
  window.addEventListener("pageshow", activateForCurrentPage);
  activateForCurrentPage();
})();
