(() => {
  "use strict";

  const isProfilePage = location.pathname === "/studio.html" || location.pathname === "/studio" || location.pathname === "/profile";
  if (isProfilePage) document.documentElement.classList.add("ymi-session-checking");

  function clearSession(email = "") {
    localStorage.removeItem("ymi_user_token");
    localStorage.removeItem("ymi_admin_token");
    localStorage.removeItem("ymi_user");
    if (email) sessionStorage.setItem("ymi_verification_required_email", String(email).slice(0, 254));
  }

  function reveal() {
    document.documentElement.classList.remove("ymi-session-checking");
    document.documentElement.classList.add("ymi-session-ready");
  }

  function redirectForVerification(email = "") {
    clearSession(email);
    const next = encodeURIComponent("/studio.html");
    location.replace(`/account.html?mode=signin&verification=required&next=${next}`);
  }

  async function validate() {
    const token = localStorage.getItem("ymi_user_token");
    if (!token) {
      reveal();
      return;
    }

    let storedUser = null;
    try { storedUser = JSON.parse(localStorage.getItem("ymi_user") || "null"); } catch {}
    if (["admin", "author"].includes(storedUser?.role)) {
      reveal();
      return;
    }

    try {
      const response = await fetch("/api/auth/verification-status", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data?.code === "EMAIL_VERIFICATION_REQUIRED" || response.status === 403) {
          redirectForVerification(data?.email || storedUser?.email || "");
          return;
        }
        if (response.status === 401) {
          clearSession();
          if (isProfilePage) location.replace("/account.html?mode=signin&next=%2Fstudio.html");
          else location.reload();
          return;
        }
        throw new Error(data?.message || "Unable to confirm this session.");
      }

      if (data?.user) {
        localStorage.setItem("ymi_user", JSON.stringify({ ...storedUser, ...data.user, emailVerified: true }));
      }
      reveal();
    } catch {
      reveal();
    }
  }

  window.setTimeout(reveal, 5000);
  validate();
})();
