(() => {
  const redirect = () => {
    const path = window.location.pathname;
    if (path === "/signin" || path === "/signup") {
      const mode = path === "/signup" ? "signup" : "signin";
      window.location.replace(`/account.html?mode=${mode}`);
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
