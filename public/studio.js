(() => {
  "use strict";

  const token = localStorage.getItem("ymi_user_token");
  if (!token) {
    location.replace("/account.html?mode=signin&next=%2Fstudio");
    return;
  }

  const state = {
    summary: null,
    memberThreads: [],
    adminThreads: [],
    roleRequests: [],
    activeMemberThread: null,
    activeAdminThread: null,
    view: "overview",
  };

  const notice = document.getElementById("studio-notice");
  const error = document.getElementById("studio-error");
  const authHeaders = { Authorization: `Bearer ${token}` };

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  function show(element, message) {
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

  async function request(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const data = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (response.status === 401) {
      localStorage.removeItem("ymi_user_token");
      localStorage.removeItem("ymi_admin_token");
      localStorage.removeItem("ymi_user");
      location.replace("/account.html?mode=signin&next=%2Fstudio");
      throw new Error("Session expired.");
    }
    if (!response.ok) throw new Error(data?.message || "Request failed.");
    return data;
  }

  function saveCurrentUser(user) {
    localStorage.setItem("ymi_user", JSON.stringify(user));
    if (["admin", "author"].includes(user.role)) localStorage.setItem("ymi_admin_token", token);
    else localStorage.removeItem("ymi_admin_token");
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll(".studio-view").forEach((section) => {
      section.hidden = section.id !== `view-${view}`;
    });
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === view);
    });
    show(error, "");
    if (view === "conversations") renderMemberConversationList();
    if (view === "admin-requests") loadRoleRequests();
    if (view === "admin-conversations") loadAdminConversations();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderProfile() {
    const user = state.summary.user;
    document.getElementById("welcome-title").textContent = `Welcome, ${user.name}.`;
    document.getElementById("account-summary").textContent = user.role === "viewer"
      ? "Talk with Yeh Mera India, follow replies and request additional publishing access."
      : user.role === "author"
        ? "Manage your member conversations here and continue to the Author Studio for publishing."
        : "Review member requests and conversations, or continue to the Admin Studio.";
    document.getElementById("role-badge").textContent = user.role;
    document.getElementById("profile-name").textContent = user.name;
    document.getElementById("profile-email").textContent = user.email;
    document.getElementById("profile-role").textContent = user.role;
    document.getElementById("profile-status").textContent = user.status;
    const isAdmin = user.role === "admin";
    document.getElementById("admin-studio-link").hidden = !["admin", "author"].includes(user.role);
    document.getElementById("admin-requests-tab").hidden = !isAdmin;
    document.getElementById("admin-conversations-tab").hidden = !isAdmin;
    saveCurrentUser(user);
  }

  function roleRequestMarkup(roleRequest) {
    if (!roleRequest) return "";
    return `
      <div class="role-request-box">
        <span class="status-pill ${escapeHtml(roleRequest.status)}">${escapeHtml(roleRequest.status)}</span>
        <h3>${escapeHtml(roleRequest.requestedRole)} access requested</h3>
        <p>${escapeHtml(roleRequest.reason)}</p>
        ${roleRequest.adminNote ? `<p><strong>Admin response:</strong> ${escapeHtml(roleRequest.adminNote)}</p>` : ""}
        <div class="role-request-meta">Submitted ${escapeHtml(formatDate(roleRequest.createdAt))}${roleRequest.reviewedAt ? ` · Reviewed ${escapeHtml(formatDate(roleRequest.reviewedAt))}` : ""}</div>
        ${roleRequest.status === "pending" ? `<button id="cancel-role-request" type="button" class="button secondary">Cancel pending request</button>` : ""}
      </div>`;
  }

  function renderRoleRequest() {
    const user = state.summary.user;
    const roleRequest = state.summary.roleRequest;
    const summary = document.getElementById("role-request-summary");
    const form = document.getElementById("role-request-form");

    if (user.role !== "viewer") {
      summary.innerHTML = `<div class="role-request-box"><span class="status-pill approved">active</span><h3>You have ${escapeHtml(user.role)} access.</h3><p>Your account already has publishing or administration permissions.</p></div>`;
      form.hidden = true;
      return;
    }

    if (roleRequest) summary.innerHTML = roleRequestMarkup(roleRequest);
    else summary.innerHTML = `<div class="role-request-box"><h3>Request more access.</h3><p>Viewer accounts can ask Admin for Author or Admin access. Explain your work and why the role is needed.</p></div>`;
    form.hidden = roleRequest?.status === "pending";

    document.getElementById("cancel-role-request")?.addEventListener("click", async () => {
      try {
        const updated = await request(`/api/studio/role-requests/${roleRequest.id}/cancel`, { method: "POST", body: "{}" });
        state.summary.roleRequest = updated;
        renderRoleRequest();
        showNotice("Role request cancelled.");
      } catch (e) { showError(e.message); }
    });
  }

  function renderMemberConversationList() {
    const list = document.getElementById("member-conversation-list");
    const unread = state.memberThreads.reduce((total, thread) => total + Number(thread.unreadCount || 0), 0);
    document.getElementById("member-unread-count").textContent = unread ? String(unread) : "";
    if (!state.memberThreads.length) {
      list.innerHTML = '<div class="list-empty">No conversations yet.</div>';
      return;
    }
    list.innerHTML = state.memberThreads.map((thread) => `
      <button type="button" class="conversation-item ${state.activeMemberThread === thread.id ? "active" : ""}" data-member-thread="${escapeHtml(thread.id)}">
        <strong>${escapeHtml(thread.subject)}</strong>
        <p>${escapeHtml(thread.lastMessage || "No messages")}</p>
        <footer><time>${escapeHtml(formatDate(thread.lastMessageAt))}</time>${thread.unreadCount ? `<span class="unread-dot">${Number(thread.unreadCount)}</span>` : `<span class="status-pill ${escapeHtml(thread.status)}">${escapeHtml(thread.status)}</span>`}</footer>
      </button>`).join("");
    list.querySelectorAll("[data-member-thread]").forEach((button) => {
      button.addEventListener("click", () => openMemberThread(button.dataset.memberThread));
    });
  }

  function messageMarkup(message, ownType) {
    const own = message.senderType === ownType;
    const label = message.senderType === "staff" ? "Yeh Mera India" : message.senderName || "Member";
    return `<article class="message-bubble ${own ? "own" : ""}"><b>${escapeHtml(label)}</b><p>${escapeHtml(message.body)}</p><time>${escapeHtml(formatDate(message.createdAt))}</time></article>`;
  }

  function renderThread(panel, data, adminMode) {
    const thread = data.thread;
    const ownType = adminMode ? "staff" : "member";
    panel.className = "thread-panel";
    panel.innerHTML = `
      <header class="thread-heading">
        <div><p class="eyebrow">${adminMode ? escapeHtml(thread.userName || "Member") : "Conversation"}</p><h3>${escapeHtml(thread.subject)}</h3><p>${adminMode ? escapeHtml(thread.userEmail || "") : `Started ${escapeHtml(formatDate(thread.createdAt))}`}</p></div>
        ${adminMode ? `<button type="button" class="button secondary" id="thread-status-button">${thread.status === "open" ? "Close" : "Reopen"}</button>` : `<span class="status-pill ${escapeHtml(thread.status)}">${escapeHtml(thread.status)}</span>`}
      </header>
      <div class="thread-messages">${data.messages.map((message) => messageMarkup(message, ownType)).join("")}</div>
      ${thread.status === "open" ? `<form class="thread-reply"><label>${adminMode ? "Reply as Yeh Mera India" : "Your reply"}<textarea name="message" rows="4" minlength="3" maxlength="4000" required></textarea></label><div class="form-actions"><span></span><button type="submit" class="button primary">Send reply</button></div></form>` : '<p class="thread-closed">This conversation is closed.</p>'}`;

    const messages = panel.querySelector(".thread-messages");
    messages.scrollTop = messages.scrollHeight;

    panel.querySelector(".thread-reply")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.submitter;
      button.disabled = true;
      try {
        const message = new FormData(event.currentTarget).get("message");
        const path = adminMode
          ? `/api/admin/conversations/${thread.id}/messages`
          : `/api/studio/conversations/${thread.id}/messages`;
        await request(path, { method: "POST", body: JSON.stringify({ message }) });
        event.currentTarget.reset();
        if (adminMode) {
          await openAdminThread(thread.id);
          await loadAdminConversations(false);
        } else {
          await openMemberThread(thread.id);
          await loadSummary(false);
        }
        showNotice("Reply sent.");
      } catch (e) { showError(e.message); }
      finally { button.disabled = false; }
    });

    panel.querySelector("#thread-status-button")?.addEventListener("click", async () => {
      try {
        const nextStatus = thread.status === "open" ? "closed" : "open";
        await request(`/api/admin/conversations/${thread.id}/status`, { method: "PUT", body: JSON.stringify({ status: nextStatus }) });
        await openAdminThread(thread.id);
        await loadAdminConversations(false);
        showNotice(`Conversation ${nextStatus}.`);
      } catch (e) { showError(e.message); }
    });
  }

  async function openMemberThread(id) {
    try {
      state.activeMemberThread = String(id);
      renderMemberConversationList();
      const data = await request(`/api/studio/conversations/${id}`);
      renderThread(document.getElementById("member-thread-panel"), data, false);
      await loadSummary(false);
    } catch (e) { showError(e.message); }
  }

  function renderAdminConversationList() {
    const list = document.getElementById("admin-conversation-list");
    const unread = state.adminThreads.reduce((total, thread) => total + Number(thread.unreadCount || 0), 0);
    document.getElementById("admin-unread-count").textContent = unread ? String(unread) : "";
    if (!state.adminThreads.length) {
      list.innerHTML = '<div class="list-empty">No member conversations yet.</div>';
      return;
    }
    list.innerHTML = state.adminThreads.map((thread) => `
      <button type="button" class="conversation-item ${state.activeAdminThread === thread.id ? "active" : ""}" data-admin-thread="${escapeHtml(thread.id)}">
        <strong>${escapeHtml(thread.subject)}</strong>
        <p>${escapeHtml(thread.userName)} · ${escapeHtml(thread.lastMessage || "No messages")}</p>
        <footer><time>${escapeHtml(formatDate(thread.lastMessageAt))}</time>${thread.unreadCount ? `<span class="unread-dot">${Number(thread.unreadCount)}</span>` : `<span class="status-pill ${escapeHtml(thread.status)}">${escapeHtml(thread.status)}</span>`}</footer>
      </button>`).join("");
    list.querySelectorAll("[data-admin-thread]").forEach((button) => {
      button.addEventListener("click", () => openAdminThread(button.dataset.adminThread));
    });
  }

  async function openAdminThread(id) {
    try {
      state.activeAdminThread = String(id);
      renderAdminConversationList();
      const data = await request(`/api/admin/conversations/${id}`);
      renderThread(document.getElementById("admin-thread-panel"), data, true);
    } catch (e) { showError(e.message); }
  }

  async function loadAdminConversations(render = true) {
    if (state.summary?.user.role !== "admin") return;
    try {
      state.adminThreads = await request("/api/admin/conversations");
      if (render) renderAdminConversationList();
      else renderAdminConversationList();
    } catch (e) { showError(e.message); }
  }

  function renderRoleRequests() {
    const list = document.getElementById("admin-role-request-list");
    const pending = state.roleRequests.filter((item) => item.status === "pending").length;
    document.getElementById("request-count").textContent = pending ? String(pending) : "";
    if (!state.roleRequests.length) {
      list.innerHTML = '<div class="studio-card"><p>No role requests match this filter.</p></div>';
      return;
    }
    list.innerHTML = state.roleRequests.map((item) => `
      <article class="request-item" data-request-id="${escapeHtml(item.id)}">
        <div>
          <span class="status-pill ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
          <h3>${escapeHtml(item.userName)} requested ${escapeHtml(item.requestedRole)} access</h3>
          <small>${escapeHtml(item.userEmail)} · Current role: ${escapeHtml(item.currentRole)} · ${escapeHtml(formatDate(item.createdAt))}</small>
          <p>${escapeHtml(item.reason)}</p>
          ${item.adminNote ? `<p><strong>Admin note:</strong> ${escapeHtml(item.adminNote)}</p>` : ""}
        </div>
        <div class="request-actions">
          ${item.status === "pending" ? `<label>Admin note<textarea rows="5" maxlength="2000" placeholder="Optional reason or instructions"></textarea></label><div class="request-buttons"><button type="button" class="button primary" data-decision="approved">Approve</button><button type="button" class="button danger" data-decision="rejected">Reject</button></div>` : `<p>Reviewed ${escapeHtml(formatDate(item.reviewedAt))}${item.reviewerName ? ` by ${escapeHtml(item.reviewerName)}` : ""}</p>`}
        </div>
      </article>`).join("");

    list.querySelectorAll("[data-decision]").forEach((button) => {
      button.addEventListener("click", async () => {
        const card = button.closest("[data-request-id]");
        const adminNote = card.querySelector("textarea")?.value || "";
        button.disabled = true;
        try {
          await request(`/api/admin/role-requests/${card.dataset.requestId}`, {
            method: "PUT",
            body: JSON.stringify({ status: button.dataset.decision, adminNote }),
          });
          showNotice(`Role request ${button.dataset.decision}.`);
          await loadRoleRequests();
        } catch (e) { showError(e.message); }
        finally { button.disabled = false; }
      });
    });
  }

  async function loadRoleRequests() {
    if (state.summary?.user.role !== "admin") return;
    try {
      const filter = document.getElementById("role-request-filter").value;
      state.roleRequests = await request(`/api/admin/role-requests${filter ? `?status=${encodeURIComponent(filter)}` : ""}`);
      renderRoleRequests();
    } catch (e) { showError(e.message); }
  }

  async function loadSummary(render = true) {
    try {
      state.summary = await request("/api/studio/summary");
      state.memberThreads = state.summary.conversations || [];
      if (render) {
        renderProfile();
        renderRoleRequest();
        renderMemberConversationList();
      } else {
        renderProfile();
        renderRoleRequest();
        renderMemberConversationList();
      }
      if (state.summary.user.role === "admin") {
        await Promise.all([loadRoleRequests(), loadAdminConversations()]);
      }
    } catch (e) { showError(e.message); }
  }

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.getElementById("role-request-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      state.summary.roleRequest = await request("/api/studio/role-requests", { method: "POST", body: JSON.stringify(values) });
      event.currentTarget.reset();
      renderRoleRequest();
      showNotice("Your role request was sent to Admin.");
    } catch (e) { showError(e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("new-conversation-toggle").addEventListener("click", () => {
    document.getElementById("new-conversation-form").hidden = false;
    document.querySelector("#new-conversation-form input")?.focus();
  });
  document.getElementById("start-conversation-button").addEventListener("click", () => {
    setView("conversations");
    document.getElementById("new-conversation-form").hidden = false;
    document.querySelector("#new-conversation-form input")?.focus();
  });
  document.getElementById("cancel-new-conversation").addEventListener("click", () => {
    const form = document.getElementById("new-conversation-form");
    form.reset();
    form.hidden = true;
  });
  document.getElementById("new-conversation-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const thread = await request("/api/studio/conversations", { method: "POST", body: JSON.stringify(values) });
      event.currentTarget.reset();
      event.currentTarget.hidden = true;
      await loadSummary(false);
      await openMemberThread(thread.id);
      showNotice("Conversation started.");
    } catch (e) { showError(e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("role-request-filter").addEventListener("change", loadRoleRequests);
  document.getElementById("signout-button").addEventListener("click", () => {
    localStorage.removeItem("ymi_user_token");
    localStorage.removeItem("ymi_admin_token");
    localStorage.removeItem("ymi_user");
    location.assign("/");
  });

  setView("overview");
  loadSummary();
})();
