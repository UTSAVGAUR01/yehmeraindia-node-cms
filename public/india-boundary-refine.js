(() => {
  "use strict";

  let sequence = 0;

  function isIndiaBoundary(path) {
    const stroke = String(path.getAttribute("stroke") || "").trim().toLowerCase();
    if (["#f08a32", "#e8c659", "#70b7d6"].includes(stroke)) return false;
    if (stroke === "#c8922e" || stroke === "rgb(200, 146, 46)") return true;
    const computed = getComputedStyle(path).stroke.replace(/\s+/g, "").toLowerCase();
    return computed === "rgb(200,146,46)";
  }

  function ensureClip(svg, path) {
    const namespace = "http://www.w3.org/2000/svg";
    let id = path.dataset.ymiBoundaryClip;
    let clip = id ? svg.querySelector(`#${CSS.escape(id)}`) : null;
    let clone = clip?.querySelector("path") || null;

    if (!clip) {
      id = `ymi-india-land-clip-${++sequence}`;
      let defs = svg.querySelector("defs[data-ymi-india-boundary-defs]");
      if (!defs) {
        defs = document.createElementNS(namespace, "defs");
        defs.dataset.ymiIndiaBoundaryDefs = "true";
        svg.prepend(defs);
      }
      clip = document.createElementNS(namespace, "clipPath");
      clip.id = id;
      clip.setAttribute("clipPathUnits", "userSpaceOnUse");
      clone = document.createElementNS(namespace, "path");
      clone.setAttribute("fill", "white");
      clone.setAttribute("stroke", "none");
      clone.setAttribute("fill-rule", "evenodd");
      clone.setAttribute("clip-rule", "evenodd");
      clip.append(clone);
      defs.append(clip);
      path.dataset.ymiBoundaryClip = id;
    }

    const d = path.getAttribute("d") || "";
    if (d && clone.getAttribute("d") !== d) clone.setAttribute("d", d);

    path.dataset.ymiIndiaBoundary = "true";
    path.setAttribute("clip-path", `url(#${id})`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-width", "2.2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("vector-effect", "non-scaling-stroke");
  }

  function refine() {
    document.querySelectorAll(".india-map .leaflet-overlay-pane svg").forEach((svg) => {
      [...svg.querySelectorAll(":scope > g path, :scope > path")]
        .filter(isIndiaBoundary)
        .forEach((path) => ensureClip(svg, path));
    });
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      refine();
    });
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["d", "stroke"],
  });
  window.addEventListener("resize", schedule);
  window.addEventListener("popstate", schedule);
  schedule();
})();
