(() => {
  const forms = [...document.querySelectorAll("form[data-mode]")];
  const title = document.getElementById("title");
  const intro = document.getElementById("intro");
  const eyebrow = document.getElementById("eyebrow");
  const notice = document.getElementById("notice");
  const error = document.getElementById("error");
  const securityPanel = document.getElementById("security-panel");
  const params = new URLSearchParams(location.search);
  const challengeStorageKey = "ymi_auth_challenge";
  let mode = params.get("mode") || "signin";

  function readChallenge() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(challengeStorageKey) || "null");
      if (!saved?.id || !saved?.email || !["signup", "login"].includes(saved.purpose)) return null;
      return saved;
    } catch {
      return null;
    }
  }

  let challenge = readChallenge();

  const copy = {
    signin: ["Welcome back", "Sign in to continue.", "Use your password. If two-factor login is enabled, a one-time code will be sent to your email."],
    signup: ["Join the community", "Create your account.", "Your email must be verified with a six-digit one-time code before the account becomes active."],
    otp: ["Email verification", "Enter your one-time code.", "The six-digit code expires in 10 minutes and can be used once."],
    forgot: ["Account recovery", "Reset your password.", "Enter your registered email. We will send a single-use reset link that expires in 30 minutes."],
    reset: ["Choose a new password", "Reset your password.", "Use at least 10 characters with uppercase, lowercase and a number."],
  };

  function showMessage(element, message) {
    element.textContent = message || "";
    element.hidden = !message;
  }

  function saveChallenge(value) {
    challenge = value;
    if (value) sessionStorage.setItem(challengeStorageKey, JSON.stringify(value));
    else sessionStorage.removeItem(challengeStorageKey);
  }

  function safeEmail(value) {
    const email = String(value || "").trim().toLowerCase();
    return /^\S+@\S+\.\S+$/.test(email) ? email : "";
  }

  function switchMode(next) {
    mode = next;
    forms.forEach((form) => { form.hidden = form.dataset.mode !== next; });
    securityPanel.hidden = true;
    const values = copy[next] || copy.signin;
    eyebrow.textContent = values[0];
    title.textContent = values[1];
    intro.textContent = values[2];
    showMessage(error, "");

    const nextParams = new URLSearchParams({ mode: next });
    if (next === "reset" && params.get("token")) nextParams.set("token", params.get("token"));
    if (params.get("next")) nextParams.set("next", params.get("next"));
    history.replaceState({}, "", `/account.html?${nextParams.toString()}`);
  }

  async function request(path, body, token) {
    const response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  }

  function storeSession(data) {
    localStorage.setItem("ymi_user_token", data.token);
    localStorage.setItem("ymi_user", JSON.stringify(data.user));
    if (["admin", "author"].includes(data.user?.role)) localStorage.setItem("ymi_admin_token", data.token);
  }

  function finishLogin(data) {
    saveChallenge(null);
    storeSession(data);
    const requested = params.get("next");
    const defaultDestination = ["admin", "author"].includes(data.user?.role) ? "/admin" : "/";
    const destination = requested === "/admin" && ["admin", "author"].includes(data.user?.role)
      ? "/admin"
      : defaultDestination;
    location.assign(destination);
  }

  function beginOtp(data, fallbackEmail, purpose) {
    if (data?.token && data?.user && !data?.challengeId) {
      finishLogin(data);
      return false;
    }
    const email = safeEmail(data?.email || data?.user?.email || fallbackEmail);
    const id = String(data?.challengeId || "").trim();
    if (!id || !email) throw new Error("The verification request was incomplete. Please request a new code.");
    saveChallenge({ id, email, purpose });
    switchMode("otp");
    showMessage(notice, `${purpose === "signup" ? "A verification code" : "A login code"} was sent to ${email}.`);
    return true;
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-switch]");
    if (!button) return;
    const next = button.dataset.switch;
    if (next !== "otp") saveChallenge(null);
    showMessage(notice, "");
    switchMode(next);
  });

  document.getElementById("signin-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    showMessage(error, ""); showMessage(notice, "");
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const data = await request("/api/auth/signin", body);
      if (data.twoFactorRequired || data.challengeId) beginOtp(data, body.email, "login");
      else finishLogin(data);
    } catch (e) { showMessage(error, e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("signup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    showMessage(error, ""); showMessage(notice, "");
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      values.enableTwoFactor = Boolean(event.currentTarget.elements.enableTwoFactor.checked);
      const data = await request("/api/auth/signup", values);
      if (data.verificationRequired || data.challengeId) beginOtp(data, values.email, "signup");
      else finishLogin(data);
    } catch (e) { showMessage(error, e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("otp-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    showMessage(error, "");
    try {
      if (!challenge?.id || !challenge?.email) throw new Error("Start sign-in or sign-up again to request a new code.");
      const code = new FormData(event.currentTarget).get("code");
      const endpoint = challenge.purpose === "signup" ? "/api/auth/verify-signup" : "/api/auth/verify-login";
      const data = await request(endpoint, { challengeId: challenge.id, email: challenge.email, code });
      finishLogin(data);
    } catch (e) { showMessage(error, e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("forgot-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    showMessage(error, "");
    try {
      const email = new FormData(event.currentTarget).get("email");
      const data = await request("/api/auth/forgot-password", { email });
      showMessage(notice, data.message);
    } catch (e) { showMessage(error, e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("reset-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    showMessage(error, "");
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      if (values.password !== values.confirmPassword) throw new Error("The passwords do not match.");
      const data = await request("/api/auth/reset-password", { token: params.get("token"), password: values.password });
      showMessage(notice, data.message);
      setTimeout(() => switchMode("signin"), 1400);
    } catch (e) { showMessage(error, e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("security-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    showMessage(error, "");
    try {
      const token = localStorage.getItem("ymi_user_token");
      const body = { password: event.currentTarget.elements.password.value, enabled: event.currentTarget.elements.enabled.checked };
      const response = await fetch("/api/auth/security", { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to save security settings.");
      document.getElementById("security-status").textContent = data.twoFactorEnabled ? "Email OTP is enabled for every sign-in." : "Password-only sign-in is enabled.";
      showMessage(notice, "Security setting updated.");
      event.currentTarget.elements.password.value = "";
    } catch (e) { showMessage(error, e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("continue-button").addEventListener("click", () => location.assign("/"));

  async function openSecurity() {
    const token = localStorage.getItem("ymi_user_token");
    if (!token) return switchMode("signin");
    try {
      const data = await request("/api/auth/security", undefined, token);
      forms.forEach((form) => { form.hidden = true; });
      securityPanel.hidden = false;
      eyebrow.textContent = "Account protection";
      title.textContent = "Login security.";
      intro.textContent = "Use your current password to enable or disable email OTP for future sign-ins.";
      document.getElementById("security-form").elements.enabled.checked = data.twoFactorEnabled;
      document.getElementById("security-status").textContent = data.twoFactorEnabled ? "Email OTP is enabled for every sign-in." : "Password-only sign-in is enabled.";
    } catch { switchMode("signin"); }
  }

  if (mode === "security") openSecurity();
  else if (mode === "otp") {
    if (challenge) {
      switchMode("otp");
      showMessage(notice, `${challenge.purpose === "signup" ? "A verification code" : "A login code"} was sent to ${challenge.email}.`);
    } else {
      switchMode("signin");
      showMessage(error, "Start sign-in or sign-up again to request a new code.");
    }
  } else switchMode(mode === "reset" ? "reset" : mode === "signup" ? "signup" : mode === "forgot" ? "forgot" : "signin");
})();
