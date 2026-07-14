(() => {
  "use strict";
  document.documentElement.classList.add("ymi-vector-preferred");
  window.setTimeout(() => {
    const active = document.querySelector(".india-map-shell.ymi-vector-map-active");
    const pending = document.querySelector(".india-map-shell.ymi-vector-map-pending");
    if (!active && !pending) document.documentElement.classList.remove("ymi-vector-preferred");
  }, 12000);
})();
