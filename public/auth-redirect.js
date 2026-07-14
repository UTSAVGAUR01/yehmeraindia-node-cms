(() => {
  const redirect = () => {
    const path = window.location.pathname;
    if (path === "/signin" || path === "/signup") {
      const mode = path === "/signup" ? "signup" : "signin";
      window.location.replace(`/account.html?mode=${mode}`);
      return;
    }
    if (path === "/studio") {
      if (!localStorage.getItem("ymi_user_token")) {
        window.location.replace("/account.html?mode=signin&next=%2Fstudio");
      } else {
        window.location.replace("/studio.html");
      }
      return;
    }
    if (path === "/admin" && !localStorage.getItem("ymi_admin_token")) {
      window.location.replace("/account.html?mode=signin&next=%2Fadmin");
    }
  };
  const pushState = history.pushState.bind(history);
  history.pushState = (...args) => {
    pushState(...args);
    redirect();
  };
  window.addEventListener("popstate", redirect);
  redirect();
})();
