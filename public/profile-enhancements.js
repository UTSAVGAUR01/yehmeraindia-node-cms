(() => {
  "use strict";

  const token = localStorage.getItem("ymi_user_token");
  if (!token) return;

  const notice = document.getElementById("studio-notice");
  const error = document.getElementById("studio-error");
  const journalViewButton = document.querySelector("[data-profile-view='journal-messages']");
  let journalMessagesLoaded = false;

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function show(element, message) {
    if (!element) return;
    element.textContent = message || "";
    element.hidden = !message;
  }

  function showNotice(message) {
    show(error, "");
    show(notice, message);
  }

  function showError(message) {
    show(notice, "");
    show(error, message);
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
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
    if (response.status === 401) {
      localStorage.removeItem("ymi_user_token");
      localStorage.removeItem("ymi_admin_token");
      localStorage.removeItem("ymi_user");
      location.replace("/account.html?mode=signin&next=%2Fstudio.html");
      throw new Error("Session expired.");
    }
    if (!response.ok) throw new Error(data?.message || "Request failed.");
    return data;
  }

  function saveUser(user) {
    localStorage.setItem("ymi_user", JSON.stringify(user));
    if (["admin", "author"].includes(user.role)) {
      localStorage.setItem("ymi_admin_token", token);
    } else {
      localStorage.removeItem("ymi_admin_token");
    }
  }

  function updateProfileDisplay(user) {
    const name = document.getElementById("profile-name");
    const email = document.getElementById("profile-email");
    const role = document.getElementById("profile-role");
    const status = document.getElementById("profile-status");
    const input = document.getElementById("profile-name-input");
    const panelLink = document.getElementById("admin-studio-link");

    if (name) name.textContent = user.name;
    if (email) email.textContent = user.email;
    if (role) role.textContent = user.role;
    if (status) status.textContent = user.status;
    if (input) input.value = user.name;
    if (panelLink && ["admin", "author"].includes(user.role)) {
      panelLink.textContent = user.role === "admin" ? "Admin panel" : "Author panel";
    }
    saveUser(user);
  }

  async function loadProfile() {
    try {
      const data = await request("/api/profile");
      updateProfileDisplay(data.user);
    } catch (e) {
      showError(e.message);
    }
  }

  function openProfileOnlyView(name) {
    document.querySelectorAll(".studio-view").forEach((section) => {
      section.hidden = section.id !== `view-${name}`;
    });
    document.querySelectorAll(".studio-navigation [data-view]").forEach((button) => {
      button.classList.remove("active");
    });
    document.querySelectorAll(".studio-navigation [data-profile-view]").forEach((button) => {
      button.classList.toggle("active", button.dataset.profileView === name);
    });
    show(error, "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderJournalMessages(items) {
    const list = document.getElementById("journal-message-list");
    const count = document.getElementById("journal-message-count");
    if (count) count.textContent = items.length ? String(items.length) : "";
    if (!list) return;

    if (!items.length) {
      list.innerHTML = `
        <article class="studio-card journal-message-empty">
          <h3>No journal messages yet.</h3>
          <p>Open a journal article and use its contact form to send a message to the author.</p>
          <a class="button secondary" href="/journal">Browse journal</a>
        </article>`;
      return;
    }

    list.innerHTML = items.map((item) => `
      <article class="studio-card journal-message-card">
        <header>
          <div>
            <p class="card-label">Message from journal</p>
            <h3>${escapeHtml(item.postTitle)}</h3>
            <small>To ${escapeHtml(item.authorName)} · ${escapeHtml(formatDate(item.createdAt))}</small>
          </div>
          <span class="status-pill ${item.isReadByAuthor ? "approved" : "pending"}">${item.isReadByAuthor ? "Read by author" : "Sent"}</span>
        </header>
        <p class="journal-message-body">${escapeHtml(item.message)}</p>
        <footer>
          <a class="button secondary" href="/journal/${encodeURIComponent(item.postSlug)}">Open article</a>
        </footer>
      </article>`).join("");
  }

  async function loadJournalMessages(force = false) {
    if (journalMessagesLoaded && !force) return;
    const list = document.getElementById("journal-message-list");
    if (list) list.innerHTML = '<div class="studio-card">Loading journal messages…</div>';
    try {
      const items = await request("/api/profile/journal-messages");
      journalMessagesLoaded = true;
      renderJournalMessages(Array.isArray(items) ? items : []);
    } catch (e) {
      showError(e.message);
      if (list) list.innerHTML = '<div class="studio-card">Journal messages could not be loaded.</div>';
    }
  }

  journalViewButton?.addEventListener("click", () => {
    openProfileOnlyView("journal-messages");
    void loadJournalMessages();
  });

  document.querySelectorAll(".studio-navigation [data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      journalViewButton?.classList.remove("active");
    });
  });

  document.getElementById("profile-name-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = event.submitter;
    button.disabled = true;
    show(error, "");
    try {
      const name = new FormData(form).get("name");
      const data = await request("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      updateProfileDisplay(data.user);
      showNotice(data.message || "Profile name updated.");
    } catch (e) {
      showError(e.message);
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById("profile-password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = event.submitter;
    button.disabled = true;
    show(error, "");
    try {
      const values = Object.fromEntries(new FormData(form));
      if (values.newPassword !== values.confirmPassword) {
        throw new Error("The new passwords do not match.");
      }
      const data = await request("/api/profile/password", {
        method: "PUT",
        body: JSON.stringify(values),
      });
      form.reset();
      showNotice(data.message || "Password changed successfully.");
      window.setTimeout(() => {
        localStorage.removeItem("ymi_user_token");
        localStorage.removeItem("ymi_admin_token");
        localStorage.removeItem("ymi_user");
        location.assign("/account.html?mode=signin");
      }, 1400);
    } catch (e) {
      showError(e.message);
    } finally {
      button.disabled = false;
    }
  });

  void loadProfile();
})();
