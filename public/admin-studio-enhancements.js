(() => {
  "use strict";

  const ENHANCED = "data-ymi-ai-writer";
  const nativeInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  const nativeTextareaValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;

  function token() {
    return localStorage.getItem("ymi_admin_token") || localStorage.getItem("ymi_user_token") || "";
  }

  function removeLegacyProfileLink() {
    document.getElementById("ymi-admin-profile-link-host")?.remove();
    document.body?.classList.remove("ymi-admin-profile-link-enabled");
  }

  function normalise(value) {
    return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findLabel(form, labelText) {
    const wanted = normalise(labelText);
    return [...form.querySelectorAll("label")].find((label) =>
      normalise(label.childNodes[0]?.textContent || label.textContent).startsWith(wanted),
    );
  }

  function fieldIn(label) {
    return label?.querySelector("textarea, input, select") || null;
  }

  function valueFor(form, labelText) {
    return fieldIn(findLabel(form, labelText))?.value || "";
  }

  function setReactValue(field, value) {
    if (!field) return;
    const setter = field instanceof HTMLTextAreaElement ? nativeTextareaValue : nativeInputValue;
    setter?.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function api(path, options = {}) {
    const response = await fetch(path, options);
    const data = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Request failed.");
    return data;
  }

  async function waitForJob(jobId, authToken, progress) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const job = await api(`/api/admin/ai-jobs/${encodeURIComponent(jobId)}`, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (job.status === "completed") return job.result || {};
      if (job.status === "failed") throw new Error(job.error || "The AI rewrite could not be completed.");
      progress.textContent = attempt < 3
        ? "AI writer started in the background…"
        : "AI is researching and writing. Keep this form open while it completes.";
      await new Promise((resolve) => window.setTimeout(resolve, 2500));
    }
    throw new Error("The AI writer is still running. Please try again in a moment.");
  }

  function formConfiguration(form) {
    const section = normalise(form.querySelector(".manager-heading .eyebrow")?.textContent);
    if (section === "books") {
      return {
        kind: "book",
        category: "Books",
        titleLabel: "Book title",
        descriptionLabel: "Book description",
        buttonLabel: "Write book description with AI",
        previewLabel: "AI book description preview",
      };
    }
    if (section === "plays & events") {
      return {
        kind: "event",
        category: "Theatre",
        titleLabel: "Play title",
        secondaryTitleLabel: "Event title",
        descriptionLabel: "Play and event description",
        venueLabel: "Venue",
        eventAtLabel: "Event date and time",
        buttonLabel: "Write play description with AI",
        previewLabel: "AI play description preview",
      };
    }
    if (section === "instagram & youtube") {
      return {
        kind: "video",
        category: "Culture",
        titleLabel: "Video title",
        descriptionLabel: "Description",
        buttonLabel: "Rewrite video description with AI",
        previewLabel: "AI video description preview",
      };
    }
    return null;
  }

  function styleOptions() {
    return `
      <option value="balanced">Balanced catalogue style</option>
      <option value="literary and atmospheric">Literary and atmospheric</option>
      <option value="dramatic and emotional">Dramatic and emotional</option>
      <option value="simple and clear">Simple and clear</option>
      <option value="concise and direct">Concise and direct</option>
      <option value="promotional and persuasive">Promotional and persuasive</option>
      <option value="historical and cultural">Historical and cultural</option>
      <option value="search-friendly and natural">Search-friendly and natural</option>
    `;
  }

  function languageOptions() {
    return `
      <option value="auto">Match the supplied language</option>
      <option value="Indian English">Indian English</option>
      <option value="Hindi">Hindi</option>
      <option value="Hinglish">Hinglish</option>
      <option value="Rajasthani or Marwari">Rajasthani / Marwari</option>
    `;
  }

  function createPreview(panel, config) {
    const preview = document.createElement("section");
    preview.className = "ymi-ai-description-preview";
    preview.hidden = true;
    preview.innerHTML = `
      <div class="ymi-ai-preview-heading">
        <div>
          <span class="ymi-ai-kicker">${config.previewLabel}</span>
          <b>Review before replacing</b>
          <small>Your original description remains unchanged until you choose Replace original.</small>
        </div>
      </div>
      <div class="ymi-ai-preview-grid">
        <label>
          Original description
          <textarea class="ymi-ai-original" rows="9" readonly></textarea>
        </label>
        <label>
          AI generated description
          <textarea class="ymi-ai-generated" rows="9"></textarea>
        </label>
      </div>
      <p class="ymi-ai-model"></p>
      <div class="ymi-ai-preview-actions">
        <button type="button" class="button secondary light ymi-ai-keep-original">Keep original</button>
        <button type="button" class="button primary ymi-ai-replace-original">Replace original</button>
      </div>
    `;
    panel.insertAdjacentElement("afterend", preview);
    return preview;
  }

  function enhanceForm(form) {
    if (!(form instanceof HTMLFormElement) || form.hasAttribute(ENHANCED)) return;
    const config = formConfiguration(form);
    if (!config) return;

    const descriptionLabel = findLabel(form, config.descriptionLabel);
    const descriptionField = fieldIn(descriptionLabel);
    if (!descriptionLabel || !(descriptionField instanceof HTMLTextAreaElement)) return;

    form.setAttribute(ENHANCED, "true");
    const panel = document.createElement("section");
    panel.className = "ymi-catalogue-ai";

    if (config.kind === "video") {
      panel.innerHTML = `
        <div class="ymi-catalogue-ai-head">
          <div>
            <b>AI editorial assistant</b>
            <span>Generate a preview first. The current description is not changed automatically.</span>
          </div>
          <select class="ymi-ai-depth" aria-label="AI rewrite depth">
            <option value="deep">Deep research & rewrite</option>
            <option value="quick">Quick polish</option>
          </select>
        </div>
        <label class="ymi-catalogue-ai-research">
          <input type="checkbox" checked />
          Research trusted web sources
        </label>
        <button type="button" class="ymi-catalogue-ai-button">
          <span aria-hidden="true">✦</span> ${config.buttonLabel}
        </button>
        <p class="ymi-catalogue-ai-status" role="status" aria-live="polite"></p>
      `;
    } else {
      panel.innerHTML = `
        <div class="ymi-catalogue-ai-head ymi-writer-heading">
          <div>
            <b>AI description writer</b>
            <span>Choose the format and language, then preview the result before replacing your text.</span>
          </div>
        </div>
        <div class="ymi-ai-writer-options">
          <label>
            Writing action
            <select class="ymi-ai-action">
              <option value="rewrite">Rewrite existing description</option>
              <option value="write">Write a fresh description</option>
            </select>
          </label>
          <label>
            Format and writing style
            <select class="ymi-ai-style">${styleOptions()}</select>
          </label>
          <label>
            Language
            <select class="ymi-ai-language">${languageOptions()}</select>
          </label>
        </div>
        <label class="ymi-ai-direction">
          Additional direction for AI
          <textarea rows="3" maxlength="3000" placeholder="Example: Focus on the central conflict, royal Rajasthan setting and emotional journey. Keep it around 250 words."></textarea>
        </label>
        <button type="button" class="ymi-catalogue-ai-button">
          <span aria-hidden="true">✦</span> ${config.buttonLabel}
        </button>
        <p class="ymi-catalogue-ai-status" role="status" aria-live="polite"></p>
      `;
    }

    descriptionLabel.insertAdjacentElement("afterend", panel);
    const preview = createPreview(panel, config);
    const originalPreview = preview.querySelector(".ymi-ai-original");
    const generatedPreview = preview.querySelector(".ymi-ai-generated");
    const modelNote = preview.querySelector(".ymi-ai-model");
    const keepOriginal = preview.querySelector(".ymi-ai-keep-original");
    const replaceOriginal = preview.querySelector(".ymi-ai-replace-original");
    const button = panel.querySelector(".ymi-catalogue-ai-button");
    const progress = panel.querySelector(".ymi-catalogue-ai-status");

    keepOriginal.addEventListener("click", () => {
      preview.hidden = true;
      generatedPreview.value = "";
      progress.dataset.kind = "";
      progress.textContent = "Original description kept.";
      descriptionField.focus();
    });

    replaceOriginal.addEventListener("click", () => {
      const replacement = String(generatedPreview.value || "").trim();
      if (!replacement) {
        progress.dataset.kind = "error";
        progress.textContent = "The AI preview is empty. Generate it again before replacing.";
        return;
      }
      setReactValue(descriptionField, replacement);
      preview.hidden = true;
      progress.dataset.kind = "success";
      progress.textContent = "AI description replaced the original. Review the form, then save.";
      descriptionField.focus();
    });

    const depth = panel.querySelector(".ymi-ai-depth");
    const researchLabel = panel.querySelector(".ymi-catalogue-ai-research");
    const research = researchLabel?.querySelector("input");
    depth?.addEventListener("change", () => {
      const deep = depth.value === "deep";
      researchLabel.hidden = !deep;
      research.disabled = !deep;
    });

    button.addEventListener("click", async () => {
      const authToken = token();
      const currentDescription = String(descriptionField.value || "").trim();
      progress.dataset.kind = "";

      if (!authToken) {
        progress.dataset.kind = "error";
        progress.textContent = "Your session has ended. Sign in again to use the AI writer.";
        return;
      }

      if (config.kind === "video" && !currentDescription) {
        progress.dataset.kind = "error";
        progress.textContent = "Write a description first so AI can understand the intended meaning.";
        descriptionField.focus();
        return;
      }

      const title = String(valueFor(form, config.titleLabel)).trim();
      const secondaryTitle = config.secondaryTitleLabel
        ? String(valueFor(form, config.secondaryTitleLabel)).trim()
        : "";
      if (config.kind !== "video" && !title && !secondaryTitle && !currentDescription) {
        progress.dataset.kind = "error";
        progress.textContent = "Add a title, description or notes before using the AI writer.";
        return;
      }

      button.disabled = true;
      panel.querySelectorAll("select, textarea, input").forEach((control) => { control.disabled = true; });
      preview.hidden = true;
      progress.textContent = "Starting AI description writer…";

      try {
        let description = "";
        let model = "";

        if (config.kind === "video") {
          const queued = await api("/api/admin/rewrite", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              title: title || config.category,
              category: config.category,
              excerpt: currentDescription.slice(0, 500),
              content: currentDescription,
              rewriteMode: depth.value,
              useResearch: depth.value === "deep" && research.checked,
            }),
          });
          const result = await waitForJob(queued.jobId, authToken, progress);
          description = String(result.content || result.excerpt || "").trim();
        } else {
          const result = await api("/api/admin/ai/work-description", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              type: config.kind,
              action: panel.querySelector(".ymi-ai-action").value,
              title,
              secondaryTitle,
              currentDescription,
              instruction: panel.querySelector(".ymi-ai-direction textarea").value,
              style: panel.querySelector(".ymi-ai-style").value,
              language: panel.querySelector(".ymi-ai-language").value,
              venue: config.venueLabel ? valueFor(form, config.venueLabel) : "",
              eventAt: config.eventAtLabel ? valueFor(form, config.eventAtLabel) : "",
            }),
          });
          description = String(result.description || "").trim();
          model = String(result.model || "").trim();
        }

        if (!description) throw new Error("AI returned an empty description. Your original text was kept.");
        originalPreview.value = currentDescription || "No original description was supplied.";
        generatedPreview.value = description;
        modelNote.textContent = model ? `Generated with ${model}. You can edit this preview before replacing the original.` : "You can edit this preview before replacing the original.";
        preview.hidden = false;
        progress.dataset.kind = "success";
        progress.textContent = "AI description ready for preview. Your original has not been changed.";
        generatedPreview.focus();
      } catch (error) {
        progress.dataset.kind = "error";
        progress.textContent = error?.message || "AI writing failed. Your original text was kept.";
      } finally {
        button.disabled = false;
        panel.querySelectorAll("select, textarea, input").forEach((control) => { control.disabled = false; });
        if (depth && research) {
          const deep = depth.value === "deep";
          research.disabled = !deep;
        }
      }
    });
  }

  function scan() {
    removeLegacyProfileLink();
    document.querySelectorAll("form.works-form").forEach(enhanceForm);
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("pageshow", scan);
  window.addEventListener("storage", scan);
  window.addEventListener("ymi:auth-changed", scan);
  document.addEventListener("DOMContentLoaded", scan, { once: true });
  scan();
})();
