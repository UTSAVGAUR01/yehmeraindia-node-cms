(() => {
  "use strict";

  const studioPath = String(window.location.pathname || "").replace(/\/+$/, "") || "/";
  if (studioPath !== "/admin") return;

  const token = localStorage.getItem("ymi_admin_token") || localStorage.getItem("ymi_user_token");
  if (!token) return;

  function storedUser() {
    try {
      return JSON.parse(localStorage.getItem("ymi_user") || "null");
    } catch {
      return null;
    }
  }

  function render(user) {
    if (!user || !["admin", "author"].includes(user.role)) return;
    if (document.getElementById("ymi-admin-profile-link-host")) return;

    const host = document.createElement("div");
    host.id = "ymi-admin-profile-link-host";
    host.setAttribute("data-role", user.role);
    host.innerHTML = `
      <a class="ymi-admin-profile-link" href="/studio.html" aria-label="Open my profile" title="My profile">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4"></circle>
          <path d="M4.8 20c.8-4 3.2-6 7.2-6s6.4 2 7.2 6"></path>
        </svg>
        <span>My profile</span>
      </a>`;

    document.body.appendChild(host);
    document.body.classList.add("ymi-admin-profile-link-enabled");
  }

  const cachedUser = storedUser();
  if (cachedUser) render(cachedUser);

  fetch("/api/auth/me", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("Profile unavailable")))
    .then((data) => {
      if (data?.user) {
        localStorage.setItem("ymi_user", JSON.stringify(data.user));
        render(data.user);
      }
    })
    .catch(() => {
      // Keep the cached authenticated profile link when the API is temporarily unavailable.
    });
})();
