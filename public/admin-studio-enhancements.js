(() => {
  "use strict";

  const ENHANCED = "data-ymi-ai-rewrite";
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
    return [...form.querySelectorAll("label")].find((label) => normalise(label.childNodes[0]?.textContent || label.textContent).startsWith(wanted));
  }

  function fieldIn(label) {
    return label?.querySelector("textarea, input") || null;
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
        ? "AI rewrite started in the background…"
        : "AI is researching and rewriting. Keep this form open while it completes.";
      await new Promise((resolve) => window.setTimeout(resolve, 2500));
    }
    throw new Error("The AI rewrite is still running. Please try again in a moment.");
  }

  function formConfiguration(form) {
    const section = normalise(form.querySelector(".manager-heading .eyebrow")?.textContent);
    if (section === "books") {
      return {
        category: "Books",
        titleFields: ["Book title"],
        descriptionLabel: "Book description",
        buttonLabel: "Rewrite book description with AI",
      };
    }
    if (section === "plays & events") {
      return {
        category: "Theatre",
        titleFields: ["Play title", "Event title"],
        descriptionLabel: "Play and event description",
        buttonLabel: "Rewrite play description with AI",
      };
    }
    if (section === "instagram & youtube") {
      return {
        category: "Culture",
        titleFields: ["Video title"],
        descriptionLabel: "Description",
        buttonLabel: "Rewrite video description with AI",
      };
    }
    return null;
  }

  function enhanceForm(form) {
    if (!(form instanceof HTMLFormElement) || form.hasAttribute(ENHANCED)) return;
    const config = formConfiguration(form);
    if (!config) return;

    const descriptionLabel = findLabel(form, config.descriptionLabel);
    const descriptionField = fieldIn(descriptionLabel);
    if (!descriptionLabel || !descriptionField) return;

    form.setAttribute(ENHANCED, "true");
    const panel = document.createElement("section");
    panel.className = "ymi-catalogue-ai";
    panel.innerHTML = `
      <div class="ymi-catalogue-ai-head">
        <div>
          <b>AI editorial assistant</b>
          <span>Available to Admin and Author accounts. Review the rewritten text before saving.</span>
        </div>
        <select aria-label="AI rewrite depth">
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
    descriptionLabel.insertAdjacentElement("afterend", panel);

    const depth = panel.querySelector("select");
    const researchLabel = panel.querySelector(".ymi-catalogue-ai-research");
    const research = researchLabel.querySelector("input");
    const button = panel.querySelector("button");
    const progress = panel.querySelector(".ymi-catalogue-ai-status");

    depth.addEventListener("change", () => {
      const deep = depth.value === "deep";
      researchLabel.hidden = !deep;
      research.disabled = !deep;
    });

    button.addEventListener("click", async () => {
      const authToken = token();
      const title = config.titleFields
        .map((label) => fieldIn(findLabel(form, label))?.value || "")
        .filter(Boolean)
        .join(" · ")
        .trim();
      const content = String(descriptionField.value || "").trim();

      progress.dataset.kind = "";
      if (!authToken) {
        progress.dataset.kind = "error";
        progress.textContent = "Your session has ended. Sign in again to use AI rewrite.";
        return;
      }
      if (!content) {
        progress.dataset.kind = "error";
        progress.textContent = "Write a description first so AI can understand the intended meaning.";
        descriptionField.focus();
        return;
      }

      button.disabled = true;
      depth.disabled = true;
      research.disabled = true;
      progress.textContent = "Starting AI rewrite…";
      try {
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
            excerpt: content.slice(0, 500),
            content,
            rewriteMode: depth.value,
            useResearch: depth.value === "deep" && research.checked,
          }),
        });
        const result = await waitForJob(queued.jobId, authToken, progress);
        const rewritten = String(result.content || result.excerpt || "").trim();
        if (!rewritten) throw new Error("AI returned an empty rewrite. Your original text was kept.");
        setReactValue(descriptionField, rewritten);
        progress.dataset.kind = "success";
        progress.textContent = "AI rewrite applied. Review it, then save the form.";
        descriptionField.focus();
      } catch (error) {
        progress.dataset.kind = "error";
        progress.textContent = error?.message || "AI rewrite failed. Your original text was kept.";
      } finally {
        button.disabled = false;
        depth.disabled = false;
        const deep = depth.value === "deep";
        research.disabled = !deep;
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
