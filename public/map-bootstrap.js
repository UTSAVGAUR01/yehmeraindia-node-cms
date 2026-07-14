(() => {
  "use strict";

  document.documentElement.classList.add("ymi-vector-preferred");

  window.setTimeout(() => {
    const shell = document.querySelector(".india-map-shell");
    const ready = shell?.classList.contains("ymi-vector-map-active");
    const pending = shell?.classList.contains("ymi-vector-map-pending");
    if (!ready && !pending) document.documentElement.classList.remove("ymi-vector-preferred");
  }, 12000);
})();
