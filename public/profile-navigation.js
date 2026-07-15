(() => {
  "use strict";

  const ENTRY = "data-ymi-profile-entry";
  let resolvingUser = false;

  function token() {
    return localStorage.getItem("ymi_user_token") || localStorage.getItem("ymi_admin_token") || "";
  }

  function storedUser() {
    try {
      return JSON.parse(localStorage.getItem("ymi_user") || "null");
    } catch {
      return null;
    }
  }

  function clearEntries() {
    document.querySelectorAll(`[${ENTRY}]`).forEach((node) => node.remove());
  }

  function profileIcon() {
    return `
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21a8 8 0 0 0-16 0"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>`;
  }

  function openProfile() {
    window.location.assign("/studio.html");
  }

  function addHeaderEntry() {
    document.querySelectorAll(".header .auth-links").forEach((authLinks) => {
      if (authLinks.querySelector(`[${ENTRY}="header"]`)) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "auth-button ghost ymi-profile-navigation-entry";
      button.setAttribute(ENTRY, "header");
      button.setAttribute("aria-label", "Open my profile");
      button.innerHTML = `${profileIcon()}<span>My profile</span>`;
      button.addEventListener("click", openProfile);

      const signOut = [...authLinks.querySelectorAll("button")]
        .find((node) => /sign\s*out/i.test(node.textContent || ""));
      if (signOut) authLinks.insertBefore(button, signOut);
      else authLinks.appendChild(button);
    });
  }

  function addStudioEntry() {
    document.querySelectorAll(".admin-page > aside").forEach((aside) => {
      if (aside.querySelector(`[${ENTRY}="studio"]`)) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ymi-profile-navigation-entry";
      button.setAttribute(ENTRY, "studio");
      button.innerHTML = `${profileIcon()}<span>My profile</span>`;
      button.addEventListener("click", openProfile);

      const viewWebsite = [...aside.querySelectorAll(":scope > button")]
        .find((node) => /view\s*website/i.test(node.textContent || ""));
      if (viewWebsite) aside.insertBefore(button, viewWebsite);
      else {
        const signOut = aside.querySelector(":scope > button.logout");
        if (signOut) aside.insertBefore(button, signOut);
        else aside.appendChild(button);
      }
    });
  }

  function render(user) {
    if (!token() || !user?.id || !["viewer", "author", "admin"].includes(user.role)) {
      clearEntries();
      return;
    }
    addHeaderEntry();
    addStudioEntry();
  }

  async function recoverUser(authToken) {
    if (resolvingUser || !authToken) return;
    resolvingUser = true;
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        localStorage.removeItem("ymi_user_token");
        localStorage.removeItem("ymi_admin_token");
        localStorage.removeItem("ymi_user");
        clearEntries();
        return;
      }
      if (!response.ok || !data?.user) return;
      localStorage.setItem("ymi_user", JSON.stringify(data.user));
      render(data.user);
    } catch {
      // Keep the current page usable when the account check is temporarily unavailable.
    } finally {
      resolvingUser = false;
    }
  }

  function sync() {
    const authToken = token();
    if (!authToken) {
      clearEntries();
      return;
    }
    const user = storedUser();
    if (user?.id) render(user);
    else void recoverUser(authToken);
  }

  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("click", (event) => {
    if (/sign\s*out/i.test(event.target.closest("button")?.textContent || "")) {
      window.setTimeout(sync, 0);
    }
  }, true);
  window.addEventListener("pageshow", sync);
  window.addEventListener("storage", sync);
  window.addEventListener("popstate", sync);
  window.addEventListener("ymi:auth-changed", sync);
  document.addEventListener("DOMContentLoaded", sync, { once: true });
  sync();
})();
