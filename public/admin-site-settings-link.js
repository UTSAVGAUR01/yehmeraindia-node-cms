(() => {
  "use strict";

  let roleChecked = false;
  let isAdmin = false;

  function cachedUser() {
    try {
      return JSON.parse(localStorage.getItem("ymi_user") || "null");
    } catch {
      return null;
    }
  }

  async function verifyRole() {
    if (roleChecked) return isAdmin;
    roleChecked = true;
    const cached = cachedUser();
    if (cached?.role === "admin") {
      isAdmin = true;
      return true;
    }
    const token = localStorage.getItem("ymi_admin_token") || localStorage.getItem("ymi_user_token");
    if (!token) return false;
    try {
      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!response.ok) return false;
      const data = await response.json().catch(() => ({}));
      isAdmin = data?.user?.role === "admin";
      return isAdmin;
    } catch {
      return false;
    }
  }

  function insertButton() {
    if (!/^\/admin\/?$/.test(location.pathname) || !isAdmin) return;
    const aside = document.querySelector(".admin-page > aside");
    if (!aside || aside.querySelector("[data-footer-social-settings]")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.footerSocialSettings = "true";
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.2M8.7 13.3l6.6 4.2"/></svg><span>Footer &amp; social</span>';
    button.addEventListener("click", () => location.assign("/site-settings.html"));

    const messages = [...aside.querySelectorAll("button")].find((item) => item.textContent.trim() === "Messages");
    if (messages) messages.before(button);
    else aside.append(button);
  }

  async function inject() {
    if (!/^\/admin\/?$/.test(location.pathname)) return;
    if (!roleChecked) await verifyRole();
    insertButton();
  }

  const observer = new MutationObserver(() => void inject());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", () => void inject());
  void inject();
})();
