(() => {
  "use strict";

  let sequence = 0;
  let mapObserver = null;
  let observedMap = null;
  let discoveryTimer = null;
  let queued = false;

  function setAttributeIfChanged(element, name, value) {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  }

  function isIndiaBoundary(path) {
    if (path.closest("clipPath")) return false;
    if (path.dataset.ymiIndiaBoundary === "true") return true;
    const stroke = String(path.getAttribute("stroke") || "").trim().toLowerCase();
    if (["#f08a32", "#e8c659", "#70b7d6"].includes(stroke)) return false;
    if (stroke === "#c8922e" || stroke === "rgb(200, 146, 46)") return true;
    const computed = getComputedStyle(path).stroke.replace(/\s+/g, "").toLowerCase();
    return computed === "rgb(200,146,46)";
  }

  function ensureClip(svg, path) {
    const namespace = "http://www.w3.org/2000/svg";
    let id = path.dataset.ymiBoundaryClip;
    let clip = id ? document.getElementById(id) : null;
    let clone = clip?.querySelector("path") || null;

    if (!clip || !svg.contains(clip)) {
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
    if (d) setAttributeIfChanged(clone, "d", d);

    path.dataset.ymiIndiaBoundary = "true";
    setAttributeIfChanged(path, "clip-path", `url(#${id})`);
    setAttributeIfChanged(path, "fill", "none");
    setAttributeIfChanged(path, "stroke-width", "2.2");
    setAttributeIfChanged(path, "stroke-linecap", "round");
    setAttributeIfChanged(path, "stroke-linejoin", "round");
    setAttributeIfChanged(path, "vector-effect", "non-scaling-stroke");
  }

  function refine() {
    if (!observedMap?.isConnected) return;
    observedMap.querySelectorAll(".leaflet-overlay-pane svg").forEach((svg) => {
      [...svg.querySelectorAll("path")]
        .filter(isIndiaBoundary)
        .forEach((path) => ensureClip(svg, path));
    });
  }

  function schedule() {
    if (queued || !observedMap) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      refine();
    });
  }

  function attachToMap() {
    const map = document.querySelector(".india-map");
    if (!map) return false;
    if (map === observedMap && mapObserver) {
      schedule();
      return true;
    }

    mapObserver?.disconnect();
    observedMap = map;
    mapObserver = new MutationObserver(schedule);
    mapObserver.observe(map, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["d", "stroke"],
    });
    schedule();
    return true;
  }

  function discoverMap() {
    window.clearInterval(discoveryTimer);
    discoveryTimer = null;
    if (attachToMap()) return;

    let attempts = 0;
    discoveryTimer = window.setInterval(() => {
      attempts += 1;
      if (attachToMap() || attempts >= 16) {
        window.clearInterval(discoveryTimer);
        discoveryTimer = null;
      }
    }, 250);
  }

  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("popstate", () => window.setTimeout(discoverMap, 0));
  window.addEventListener("pageshow", discoverMap);
  discoverMap();
})();
