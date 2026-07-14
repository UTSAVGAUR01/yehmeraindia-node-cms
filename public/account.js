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
  const resetStorageKey = "ymi_password_reset_session";
  let mode = params.get("mode") || "signin";

  function readChallenge() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(challengeStorageKey) || "null");
      if (!saved?.id || !saved?.email || !["signup", "login", "password_reset"].includes(saved.purpose)) return null;
      return saved;
    } catch {
      return null;
    }
  }

  function readResetSession() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(resetStorageKey) || "null");
      if (!saved?.resetToken) return null;
      return saved;
    } catch {
      return null;
    }
  }

  let challenge = readChallenge();
  let resetSession = readResetSession();

  const copy = {
    signin: ["Welcome back", "Sign in to continue.", "Use your password. If two-factor login is enabled, a one-time code will be sent to your email."],
    signup: ["Join the community", "Create your account.", "Your email must be verified with a six-digit one-time code before the account becomes active."],
    otp: ["Email verification", "Enter your one-time code.", "The six-digit code expires in 10 minutes and can be used once."],
    forgot: ["Account recovery", "Reset your password.", "Enter your registered email. We will send a six-digit code that expires in 10 minutes."],
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

  function saveResetSession(value) {
    resetSession = value;
    if (value) sessionStorage.setItem(resetStorageKey, JSON.stringify(value));
    else sessionStorage.removeItem(resetStorageKey);
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
    else localStorage.removeItem("ymi_admin_token");
  }

  function finishLogin(data) {
    saveChallenge(null);
    saveResetSession(null);
    storeSession(data);
    const requested = params.get("next");
    const isStaff = ["admin", "author"].includes(data.user?.role);
    const defaultDestination = isStaff ? "/admin" : "/studio";
    const destination = requested === "/admin" && isStaff
      ? "/admin"
      : requested === "/studio"
        ? "/studio"
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
    const label = purpose === "signup" ? "A verification code" : purpose === "login" ? "A login code" : "A password reset code";
    showMessage(notice, `${label} was sent to ${email}.`);
    return true;
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-switch]");
    if (!button) return;
    const next = button.dataset.switch;
    if (next !== "otp") saveChallenge(null);
    if (next !== "reset") saveResetSession(null);
    showMessage(notice, "");
    switchMode(next);
  });

  document.getElementById("signin-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = event.submitter;
    button.disabled = true;
    showMessage(error, ""); showMessage(notice, "");
    try {
      const body = Object.fromEntries(new FormData(form));
      const data = await request("/api/auth/signin", body);
      if (data.twoFactorRequired || data.challengeId) beginOtp(data, body.email, "login");
      else finishLogin(data);
    } catch (e) { showMessage(error, e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("signup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = event.submitter;
    button.disabled = true;
    showMessage(error, ""); showMessage(notice, "");
    try {
      const values = Object.fromEntries(new FormData(form));
      values.enableTwoFactor = Boolean(form.elements.enableTwoFactor.checked);
      const data = await request("/api/auth/signup", values);
      if (data.verificationRequired || data.challengeId) beginOtp(data, values.email, "signup");
      else finishLogin(data);
    } catch (e) { showMessage(error, e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("otp-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = event.submitter;
    button.disabled = true;
    showMessage(error, "");
    try {
      if (!challenge?.id || !challenge?.email) throw new Error("Start the process again to request a new code.");
      const code = new FormData(form).get("code");
      if (challenge.purpose === "password_reset") {
        const data = await request("/api/auth/password-reset/verify", {
          challengeId: challenge.id,
          email: challenge.email,
          code,
        });
        saveResetSession({ resetToken: data.resetToken, email: challenge.email });
        saveChallenge(null);
        form.reset();
        switchMode("reset");
        showMessage(notice, data.message || "Code verified. Choose a new password.");
        return;
      }
      const endpoint = challenge.purpose === "signup" ? "/api/auth/verify-signup" : "/api/auth/verify-login";
      const data = await request(endpoint, { challengeId: challenge.id, email: challenge.email, code });
      finishLogin(data);
    } catch (e) { showMessage(error, e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("forgot-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = event.submitter;
    button.disabled = true;
    showMessage(error, ""); showMessage(notice, "");
    try {
      const email = new FormData(form).get("email");
      const data = await request("/api/auth/password-reset/request", { email });
      beginOtp(data, email, "password_reset");
    } catch (e) { showMessage(error, e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("reset-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = event.submitter;
    button.disabled = true;
    showMessage(error, "");
    try {
      const values = Object.fromEntries(new FormData(form));
      if (values.password !== values.confirmPassword) throw new Error("The passwords do not match.");
      let data;
      if (resetSession?.resetToken) {
        data = await request("/api/auth/password-reset/complete", {
          resetToken: resetSession.resetToken,
          password: values.password,
        });
      } else if (params.get("token")) {
        data = await request("/api/auth/reset-password", { token: params.get("token"), password: values.password });
      } else {
        throw new Error("Verify a password reset code before choosing a new password.");
      }
      saveResetSession(null);
      saveChallenge(null);
      form.reset();
      showMessage(notice, data.message);
      setTimeout(() => switchMode("signin"), 1400);
    } catch (e) { showMessage(error, e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("security-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = event.submitter;
    button.disabled = true;
    showMessage(error, "");
    try {
      const token = localStorage.getItem("ymi_user_token");
      const body = { password: form.elements.password.value, enabled: form.elements.enabled.checked };
      const response = await fetch("/api/auth/security", { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to save security settings.");
      document.getElementById("security-status").textContent = data.twoFactorEnabled ? "Email OTP is enabled for every sign-in." : "Password-only sign-in is enabled.";
      showMessage(notice, "Security setting updated.");
      form.elements.password.value = "";
    } catch (e) { showMessage(error, e.message); }
    finally { button.disabled = false; }
  });

  document.getElementById("continue-button").addEventListener("click", () => location.assign("/studio"));

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
      const label = challenge.purpose === "signup" ? "A verification code" : challenge.purpose === "login" ? "A login code" : "A password reset code";
      showMessage(notice, `${label} was sent to ${challenge.email}.`);
    } else {
      switchMode("signin");
      showMessage(error, "Start sign-in, sign-up or password reset again to request a new code.");
    }
  } else if (mode === "reset" && !resetSession && !params.get("token")) {
    switchMode("forgot");
    showMessage(error, "Request and verify a password reset code first.");
  } else switchMode(mode === "reset" ? "reset" : mode === "signup" ? "signup" : mode === "forgot" ? "forgot" : "signin");
})();
