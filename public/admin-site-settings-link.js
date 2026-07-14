(() => {
  "use strict";

  function currentUser() {
    try {
      return JSON.parse(localStorage.getItem("ymi_user") || "null");
    } catch {
      return null;
    }
  }

  function inject() {
    if (location.pathname !== "/admin") return;
    const user = currentUser();
    if (user?.role !== "admin") return;
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

  const observer = new MutationObserver(inject);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", inject);
  inject();
})();
