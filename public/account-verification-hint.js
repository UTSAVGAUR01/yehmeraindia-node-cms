(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  if (params.get("verification") !== "required") return;
  const email = sessionStorage.getItem("ymi_verification_required_email") || "";
  const notice = document.getElementById("notice");
  const input = document.querySelector("#signin-form input[name='email']");
  if (input && email) input.value = email;
  if (notice) {
    notice.hidden = false;
    notice.textContent = "Verify this Viewer account before opening My Profile, role requests or messages. Sign in with the account password and a six-digit verification code will be sent by email.";
  }
})();
