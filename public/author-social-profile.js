(() => {
  "use strict";

  const token = localStorage.getItem("ymi_user_token");
  if (!token) return;

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  async function request(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Request failed.");
    return data;
  }

  function showMessage(type, message) {
    const notice = document.getElementById(type === "error" ? "studio-error" : "studio-notice");
    const other = document.getElementById(type === "error" ? "studio-notice" : "studio-error");
    if (other) { other.textContent = ""; other.hidden = true; }
    if (notice) { notice.textContent = message || ""; notice.hidden = !message; }
  }

  function field(name, label, placeholder) {
    return `<label>${escapeHtml(label)}<input type="url" name="${name}" maxlength="1000" placeholder="${escapeHtml(placeholder)}" /></label>`;
  }

  function createSection(data) {
    const overview = document.getElementById("view-overview");
    if (!overview || document.getElementById("author-social-profile-card")) return null;

    const section = document.createElement("article");
    section.id = "author-social-profile-card";
    section.className = "studio-card author-social-profile-card";

    if (!data.editable) {
      section.innerHTML = `
        <div class="author-social-heading">
          <div><p class="card-label">Author visibility</p><h3>Follow profile</h3></div>
          <span class="author-social-lock">Available for Authors</span>
        </div>
        <p>${escapeHtml(data.message || "Request Author access to publish social follow links on your articles.")}</p>`;
      overview.append(section);
      return section;
    }

    section.innerHTML = `
      <div class="author-social-heading">
        <div>
          <p class="card-label">Grow your readership</p>
          <h3>Author follow profile</h3>
          <p>These links appear as follow icons on every journal article assigned to you.</p>
        </div>
        <span class="author-social-live">Public on articles</span>
      </div>
      <form id="author-social-profile-form">
        <label class="author-social-bio">Short author introduction<textarea name="bio" rows="4" maxlength="1200" placeholder="Introduce your writing, theatre work, language, interests and current projects."></textarea></label>
        <div class="author-social-form-grid">
          ${field("instagramUrl", "Instagram", "https://instagram.com/yourname")}
          ${field("facebookUrl", "Facebook", "https://facebook.com/yourpage")}
          ${field("xUrl", "X / Twitter", "https://x.com/yourname")}
          ${field("youtubeUrl", "YouTube", "https://youtube.com/@yourchannel")}
          ${field("linkedinUrl", "LinkedIn", "https://linkedin.com/in/yourname")}
          ${field("websiteUrl", "Personal website", "https://yourwebsite.com")}
          <label>Other platform name<input name="otherLabel" maxlength="80" placeholder="Podcast, Goodreads, Threads…" /></label>
          ${field("otherUrl", "Other platform link", "https://...")}
        </div>
        <div class="author-social-form-actions">
          <p>Only complete http or https links are published. Empty fields remain hidden.</p>
          <button class="button primary" type="submit">Save follow profile</button>
        </div>
      </form>`;

    overview.append(section);
    return section;
  }

  function fill(form, profile = {}) {
    ["bio", "instagramUrl", "facebookUrl", "xUrl", "youtubeUrl", "linkedinUrl", "websiteUrl", "otherLabel", "otherUrl"]
      .forEach((name) => {
        const input = form.elements.namedItem(name);
        if (input) input.value = profile[name] || "";
      });
  }

  async function load() {
    try {
      const data = await request("/api/profile/socials");
      const section = createSection(data);
      const form = section?.querySelector("#author-social-profile-form");
      if (!form) return;
      fill(form, data.profile);
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = event.submitter;
        if (button) button.disabled = true;
        try {
          const payload = Object.fromEntries(new FormData(form));
          const result = await request("/api/profile/socials", {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          fill(form, result.profile);
          showMessage("notice", result.message || "Author follow profile updated.");
        } catch (error) {
          showMessage("error", error.message);
        } finally {
          if (button) button.disabled = false;
        }
      });
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  void load();
})();
