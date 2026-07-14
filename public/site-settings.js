(() => {
  "use strict";

  const token = localStorage.getItem("ymi_admin_token") || localStorage.getItem("ymi_user_token");
  if (!token) {
    location.replace("/account.html?mode=signin&next=%2Fsite-settings.html");
    return;
  }

  const notice = document.getElementById("settings-notice");
  const errorBox = document.getElementById("settings-error");
  const footerForm = document.getElementById("footer-settings-form");
  const authorForm = document.getElementById("admin-author-social-form");
  const authorSelect = document.getElementById("author-profile-select");
  let authors = [];

  function show(type, message) {
    const active = type === "error" ? errorBox : notice;
    const inactive = type === "error" ? notice : errorBox;
    if (inactive) { inactive.textContent = ""; inactive.hidden = true; }
    if (active) { active.textContent = message || ""; active.hidden = !message; }
  }

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
    if (response.status === 401 || response.status === 403) {
      if (response.status === 401) {
        localStorage.removeItem("ymi_admin_token");
        localStorage.removeItem("ymi_user_token");
        localStorage.removeItem("ymi_user");
      }
      throw new Error(data?.message || "Admin access required.");
    }
    if (!response.ok) throw new Error(data?.message || "Request failed.");
    return data;
  }

  function fillForm(form, values = {}) {
    [...form.elements].forEach((element) => {
      if (!element.name || element.type === "submit") return;
      if (Object.hasOwn(values, element.name)) element.value = values[element.name] || "";
    });
  }

  function authorById(id) {
    return authors.find((author) => String(author.userId) === String(id));
  }

  function fillAuthor(id) {
    const author = authorById(id) || {};
    fillForm(authorForm, author);
    authorSelect.value = id || "";
  }

  async function load() {
    try {
      const [footer, loadedAuthors] = await Promise.all([
        request("/api/admin/footer-settings"),
        request("/api/admin/authors/socials"),
      ]);
      fillForm(footerForm, footer);
      authors = Array.isArray(loadedAuthors) ? loadedAuthors : [];
      authorSelect.innerHTML = authors.length
        ? authors.map((author) => `<option value="${String(author.userId)}">${String(author.name)} · ${String(author.role)}</option>`).join("")
        : '<option value="">No Author accounts available</option>';
      if (authors[0]) fillAuthor(authors[0].userId);
    } catch (error) {
      show("error", error.message);
    }
  }

  authorSelect?.addEventListener("change", () => fillAuthor(authorSelect.value));

  footerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    if (button) button.disabled = true;
    try {
      const payload = Object.fromEntries(new FormData(footerForm));
      const data = await request("/api/admin/footer-settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      fillForm(footerForm, data);
      show("notice", data.message || "Footer settings updated.");
    } catch (error) {
      show("error", error.message);
    } finally {
      if (button) button.disabled = false;
    }
  });

  authorForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    if (button) button.disabled = true;
    try {
      const payload = Object.fromEntries(new FormData(authorForm));
      const authorId = payload.authorId;
      delete payload.authorId;
      if (!authorId) throw new Error("Choose an Author account.");
      const data = await request(`/api/admin/authors/${encodeURIComponent(authorId)}/socials`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const index = authors.findIndex((author) => String(author.userId) === String(authorId));
      if (index >= 0) authors[index] = data.profile;
      fillAuthor(authorId);
      show("notice", data.message || "Author follow profile updated.");
    } catch (error) {
      show("error", error.message);
    } finally {
      if (button) button.disabled = false;
    }
  });

  document.getElementById("settings-signout")?.addEventListener("click", () => {
    localStorage.removeItem("ymi_admin_token");
    localStorage.removeItem("ymi_user_token");
    localStorage.removeItem("ymi_user");
    location.assign("/");
  });

  void load();
})();
