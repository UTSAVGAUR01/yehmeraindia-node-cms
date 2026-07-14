(() => {
  "use strict";

  function currentUser() {
    try { return JSON.parse(localStorage.getItem("ymi_user") || "null"); }
    catch { return null; }
  }

  function openStudio() {
    window.location.assign("/studio");
  }

  function enhancePublicHeader(user) {
    const authLinks = document.querySelector(".auth-links");
    if (!authLinks || !user || authLinks.querySelector("[data-member-studio-link]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "auth-button ghost";
    button.dataset.memberStudioLink = "true";
    button.textContent = "My Studio";
    button.addEventListener("click", openStudio);
    const signout = [...authLinks.querySelectorAll("button")].find((item) => /sign out/i.test(item.textContent || ""));
    authLinks.insertBefore(button, signout || null);
  }

  function enhanceAdminSidebar(user) {
    if (!user || user.role !== "admin") return;
    const aside = document.querySelector(".admin-page > aside");
    if (!aside || aside.querySelector("[data-member-admin-link]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.memberAdminLink = "true";
    button.textContent = "Member requests";
    button.addEventListener("click", openStudio);
    const viewWebsite = [...aside.querySelectorAll("button")].find((item) => /view website/i.test(item.textContent || ""));
    aside.insertBefore(button, viewWebsite || null);
  }

  function enhance() {
    const user = currentUser();
    if (!user) return;
    enhancePublicHeader(user);
    enhanceAdminSidebar(user);
  }

  const observer = new MutationObserver(enhance);
  const start = () => {
    enhance();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
