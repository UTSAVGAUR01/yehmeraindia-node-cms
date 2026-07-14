(() => {
  const redirect = () => {
    const path = window.location.pathname;
    const token = localStorage.getItem("ymi_user_token");

    if (path === "/signin" || path === "/signup") {
      const mode = path === "/signup" ? "signup" : "signin";
      window.location.replace(`/account.html?mode=${mode}`);
      return;
    }

    if (path === "/studio" || path === "/profile") {
      if (!token) {
        window.location.replace("/account.html?mode=signin&next=%2Fstudio.html");
      } else {
        window.location.replace("/studio.html");
      }
      return;
    }

    if (path === "/studio.html" && !token) {
      window.location.replace("/account.html?mode=signin&next=%2Fstudio.html");
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
