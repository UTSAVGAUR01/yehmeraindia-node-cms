(() => {
  "use strict";

  const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
  const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const INDIA_BOUNDS = [[65.2, 3.8], [101.8, 40.5]];
  const MAP_HOST_CLASS = "ymi-vector-map";
  const ACTIVE_CLASS = "ymi-vector-map-active";
  const SATELLITE_SOURCE = "ymi-satellite";
  const SATELLITE_LAYER = "ymi-satellite-layer";
  const INDIA_SOURCE = "ymi-india-boundary";
  const INDIA_HALO_LAYER = "ymi-india-boundary-halo";
  const INDIA_LAYER = "ymi-india-boundary-line";

  let active = null;
  let scanQueued = false;

  const HINDI_CORRECTIONS = {
    india: "भारत",
    rajasthan: "राजस्थान",
    gujarat: "गुजरात",
    maharashtra: "महाराष्ट्र",
    goa: "गोवा",
    karnataka: "कर्नाटक",
    kerala: "केरल",
    "tamil nadu": "तमिलनाडु",
    "andhra pradesh": "आंध्र प्रदेश",
    telangana: "तेलंगाना",
    odisha: "ओडिशा",
    chhattisgarh: "छत्तीसगढ़",
    "madhya pradesh": "मध्य प्रदेश",
    jharkhand: "झारखंड",
    bihar: "बिहार",
    "uttar pradesh": "उत्तर प्रदेश",
    uttarakhand: "उत्तराखंड",
    haryana: "हरियाणा",
    punjab: "पंजाब",
    "himachal pradesh": "हिमाचल प्रदेश",
    "jammu and kashmir": "जम्मू और कश्मीर",
    ladakh: "लद्दाख",
    sikkim: "सिक्किम",
    assam: "असम",
    meghalaya: "मेघालय",
    tripura: "त्रिपुरा",
    mizoram: "मिजोरम",
    manipur: "मणिपुर",
    nagaland: "नागालैंड",
    "arunachal pradesh": "अरुणाचल प्रदेश",
    "west bengal": "पश्चिम बंगाल",
    delhi: "दिल्ली",
    chandigarh: "चंडीगढ़",
    puducherry: "पुडुचेरी",
    lakshadweep: "लक्षद्वीप",
    "andaman and nicobar islands": "अंडमान और निकोबार द्वीपसमूह",
    jaipur: "जयपुर",
    jodhpur: "जोधपुर",
    udaipur: "उदयपुर",
    mumbai: "मुंबई",
    pune: "पुणे",
    ahmedabad: "अहमदाबाद",
    surat: "सूरत",
    bengaluru: "बेंगलुरु",
    chennai: "चेन्नई",
    hyderabad: "हैदराबाद",
    kolkata: "कोलकाता",
    bhopal: "भोपाल",
    lucknow: "लखनऊ",
    patna: "पटना",
    srinagar: "श्रीनगर",
    jammu: "जम्मू",
    leh: "लेह",
    "new delhi": "नई दिल्ली",
    nepal: "नेपाल",
    bhutan: "भूटान",
    bangladesh: "बांग्लादेश",
    pakistan: "पाकिस्तान",
    afghanistan: "अफ़ग़ानिस्तान",
    china: "चीन",
    myanmar: "म्यांमार",
    "sri lanka": "श्रीलंका",
    maldives: "मालदीव",
  };

  const englishName = [
    "coalesce",
    ["get", "name:en"],
    ["get", "name_en"],
    ["get", "name:latin"],
    ["get", "name"],
    "",
  ];
  const providerHindiName = [
    "coalesce",
    ["get", "name:hi"],
    ["get", "name_hi"],
    "",
  ];
  const correctedHindiName = [
    "match",
    ["downcase", englishName],
    ...Object.entries(HINDI_CORRECTIONS).flat(),
    providerHindiName,
  ];
  const bilingualName = [
    "case",
    ["all", ["!=", correctedHindiName, ""], ["!=", correctedHindiName, englishName]],
    ["concat", englishName, "\n", correctedHindiName],
    englishName,
  ];

  function normalise(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\u0900-\u097f]+/g, " ")
      .trim();
  }

  function showMessage(shell, message, timeout = 5000) {
    let node = shell.querySelector(".ymi-map-message");
    if (!node) {
      node = document.createElement("div");
      node.className = "ymi-map-message";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      shell.appendChild(node);
    }
    node.textContent = message;
    node.hidden = false;
    window.clearTimeout(node._ymiTimer);
    if (timeout > 0) {
      node._ymiTimer = window.setTimeout(() => {
        node.hidden = true;
      }, timeout);
    }
  }

  function setReactInputValue(input, value) {
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    descriptor?.set?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function waitForAndChooseResult(placeName) {
    const wanted = normalise(placeName);
    let finished = false;
    const choose = () => {
      if (finished) return true;
      const buttons = [...document.querySelectorAll(".place-results button")];
      if (!buttons.length) return false;
      const match = buttons.find((button) => normalise(button.textContent).includes(wanted)) || buttons[0];
      finished = true;
      match.click();
      return true;
    };

    if (choose()) return;
    const observer = new MutationObserver(() => {
      if (choose()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 9000);
  }

  async function chooseMapPoint(shell, event, map) {
    const { lng, lat } = event.lngLat;
    showMessage(shell, "Identifying this Indian place…", 0);
    try {
      const response = await fetch(
        `/api/places/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=${Math.round(map.getZoom())}`,
        { headers: { Accept: "application/json" } },
      );
      const place = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(place?.message || "This point is outside the supported India research area.");

      const input = document.querySelector(".place-search input");
      const form = input?.closest("form");
      const searchName = place?.nameEnglish || place?.name;
      if (!input || !form || !searchName) throw new Error("The place search is not ready yet.");

      waitForAndChooseResult(searchName);
      setReactInputValue(input, searchName);
      if (typeof form.requestSubmit === "function") form.requestSubmit();
      else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      showMessage(shell, `${searchName} selected. Loading its research cards…`, 3000);
    } catch (error) {
      showMessage(shell, error?.message || "This place could not be selected.", 6000);
    }
  }

  function layerIdentity(layer) {
    return `${String(layer?.id || "").toLowerCase()} ${String(layer?.["source-layer"] || "").toLowerCase()}`;
  }

  function isNameLayer(layer) {
    if (layer?.type !== "symbol" || !layer.layout || !("text-field" in layer.layout)) return false;
    const identity = layerIdentity(layer);
    const textField = JSON.stringify(layer.layout["text-field"] || "").toLowerCase();
    if (/shield|house.?number|road.?number|route.?number|exit|ref[_-]?label/.test(identity)) return false;
    return /name/.test(textField)
      || /label|place|poi|water|park|airport|station|country|state|city|town|village|district|suburb|neighbourhood/.test(identity);
  }

  function isAdministrativeBoundary(layer) {
    return layer?.type === "line" && /boundary|admin/.test(layerIdentity(layer));
  }

  function isCountryBoundary(layer) {
    return /country|admin[_ -]?(?:0|2)|boundary[_ -]?(?:0|2)|international/.test(layerIdentity(layer));
  }

  function applyBilingualLabels(map) {
    const layers = map.getStyle()?.layers || [];
    for (const layer of layers) {
      if (!isNameLayer(layer)) continue;
      try {
        map.setLayoutProperty(layer.id, "text-field", bilingualName);
        map.setLayoutProperty(layer.id, "text-line-height", 1.08);
        map.setLayoutProperty(layer.id, "text-optional", true);
        map.setLayoutProperty(layer.id, "text-allow-overlap", false);
        map.setLayoutProperty(layer.id, "text-ignore-placement", false);
      } catch {
        // Leave provider layers unchanged when a property cannot be edited.
      }
    }
  }

  function softenNeighbourBorders(map) {
    const layers = map.getStyle()?.layers || [];
    for (const layer of layers) {
      if (!isAdministrativeBoundary(layer)) continue;
      const country = isCountryBoundary(layer);
      try {
        map.setPaintProperty(layer.id, "line-color", country ? "#8e897f" : "#b8b2a7");
        map.setPaintProperty(layer.id, "line-opacity", country ? 0.58 : 0.36);
        map.setPaintProperty(
          layer.id,
          "line-width",
          country
            ? ["interpolate", ["linear"], ["zoom"], 3, 0.75, 7, 1.05, 12, 1.35, 18, 1.8]
            : ["interpolate", ["linear"], ["zoom"], 4, 0.45, 9, 0.7, 14, 1.0, 18, 1.25],
        );
      } catch {
        // Some style layers use immutable paint expressions.
      }
    }
  }

  function revealDetailedPlaces(map) {
    for (const layer of map.getStyle()?.layers || []) {
      if (layer.type !== "symbol") continue;
      const identity = layerIdentity(layer);
      if (!/place|city|town|village|hamlet|suburb|neighbourhood|poi|station|airport/.test(identity)) continue;
      try {
        map.setLayoutProperty(layer.id, "visibility", "visible");
        const minZoom = Number(layer.minzoom);
        if (Number.isFinite(minZoom) && minZoom > 15) {
          map.setLayerZoomRange(layer.id, 15, Number.isFinite(layer.maxzoom) ? layer.maxzoom : 24);
        }
      } catch {}
    }
  }

  function restoreBaseLayers(map, hiddenLayers) {
    for (const [layerId, visibility] of hiddenLayers) {
      if (!map.getLayer(layerId)) continue;
      try {
        map.setLayoutProperty(layerId, "visibility", visibility === "none" ? "none" : "visible");
      } catch {}
    }
    hiddenLayers.clear();
  }

  function setSatelliteMode(map, enabled, hiddenLayers) {
    if (!map.isStyleLoaded()) return;

    if (!enabled) {
      restoreBaseLayers(map, hiddenLayers);
      if (map.getLayer(SATELLITE_LAYER)) map.removeLayer(SATELLITE_LAYER);
      if (map.getSource(SATELLITE_SOURCE)) map.removeSource(SATELLITE_SOURCE);
      return;
    }

    if (!map.getSource(SATELLITE_SOURCE)) {
      map.addSource(SATELLITE_SOURCE, {
        type: "raster",
        tiles: [SATELLITE_URL],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 19,
        attribution: "Tiles © Esri, Maxar, Earthstar Geographics and the GIS User Community",
      });
    }
    if (!map.getLayer(SATELLITE_LAYER)) {
      const firstLayer = map.getStyle()?.layers?.[0]?.id;
      map.addLayer({
        id: SATELLITE_LAYER,
        type: "raster",
        source: SATELLITE_SOURCE,
        paint: {
          "raster-saturation": -0.04,
          "raster-contrast": 0.08,
          "raster-brightness-max": 0.94,
          "raster-fade-duration": 120,
        },
      }, firstLayer);
    }

    for (const layer of map.getStyle()?.layers || []) {
      if ([SATELLITE_LAYER, INDIA_HALO_LAYER, INDIA_LAYER].includes(layer.id)) continue;
      if (!["background", "fill", "fill-extrusion", "hillshade", "raster"].includes(layer.type)) continue;
      if (!hiddenLayers.has(layer.id)) hiddenLayers.set(layer.id, layer.layout?.visibility || "visible");
      try { map.setLayoutProperty(layer.id, "visibility", "none"); } catch {}
    }
  }

  function currentMode(shell) {
    const activeButton = shell.querySelector(".map-mode-switch button.active");
    return /satellite/i.test(activeButton?.textContent || "") ? "satellite" : "normal";
  }

  function syncMode(instance) {
    if (!instance?.map?.isStyleLoaded()) return;
    const mode = currentMode(instance.shell);
    instance.mode = mode;
    setSatelliteMode(instance.map, mode === "satellite", instance.hiddenLayers);
  }

  function addIndiaBoundary(instance) {
    const { map, boundary } = instance;
    if (!boundary || !map.isStyleLoaded()) return;
    const data = { type: "Feature", properties: { name: "India" }, geometry: boundary };

    if (map.getSource(INDIA_SOURCE)) {
      map.getSource(INDIA_SOURCE).setData(data);
      return;
    }

    map.addSource(INDIA_SOURCE, { type: "geojson", data });
    const before = (map.getStyle()?.layers || []).find((layer) => layer.type === "symbol")?.id;
    map.addLayer({
      id: INDIA_HALO_LAYER,
      type: "line",
      source: INDIA_SOURCE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "rgba(255,255,255,0.92)",
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 4.3, 7, 5.4, 12, 7.2, 18, 9.2],
        "line-opacity": 0.9,
        "line-blur": 0.15,
      },
    }, before);
    map.addLayer({
      id: INDIA_LAYER,
      type: "line",
      source: INDIA_SOURCE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#15120d",
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 2.6, 7, 3.4, 12, 4.7, 18, 6.2],
        "line-opacity": 1,
      },
    }, before);
  }

  async function loadBoundary(instance) {
    try {
      const response = await fetch("/api/places/india-boundary", { headers: { Accept: "application/json" } });
      const payload = await response.json();
      if (!response.ok || !payload?.geometry) return;
      instance.boundary = payload.geometry;
      addIndiaBoundary(instance);
    } catch {}
  }

  function destroyActive() {
    if (!active) return;
    active.shell.removeEventListener("click", active.modeClickHandler);
    active.shell.classList.remove(ACTIVE_CLASS);
    try { active.map.remove(); } catch {}
    active.host.remove();
    active = null;
  }

  function mount(shell) {
    if (!window.maplibregl || active?.shell === shell) return;
    destroyActive();

    const host = document.createElement("div");
    host.className = MAP_HOST_CLASS;
    host.setAttribute("aria-label", "Interactive HD English and Hindi map of India");
    shell.appendChild(host);

    const map = new window.maplibregl.Map({
      container: host,
      style: STYLE_URL,
      center: [79.2, 22.7],
      zoom: 3.45,
      minZoom: 3,
      maxZoom: 20,
      maxBounds: INDIA_BOUNDS,
      renderWorldCopies: false,
      attributionControl: true,
      localIdeographFontFamily: "Noto Sans Devanagari, Noto Sans, sans-serif",
      fadeDuration: 120,
      refreshExpiredTiles: true,
      crossSourceCollisions: true,
      cooperativeGestures: false,
      trackResize: true,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2.5),
      pitchWithRotate: false,
      dragRotate: false,
      maxPitch: 0,
    });
    map.addControl(new window.maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), "top-left");
    map.touchZoomRotate?.disableRotation?.();
    map.dragRotate?.disable?.();

    const instance = {
      shell,
      host,
      map,
      mode: currentMode(shell),
      boundary: null,
      hiddenLayers: new Map(),
      modeClickHandler: null,
    };
    active = instance;

    instance.modeClickHandler = (event) => {
      if (!event.target.closest(".map-mode-switch button")) return;
      window.setTimeout(() => syncMode(instance), 0);
    };
    shell.addEventListener("click", instance.modeClickHandler);

    map.on("load", () => {
      shell.classList.add(ACTIVE_CLASS);
      map.fitBounds(INDIA_BOUNDS, { padding: 12, duration: 0, maxZoom: 4.1 });
      softenNeighbourBorders(map);
      applyBilingualLabels(map);
      revealDetailedPlaces(map);
      syncMode(instance);
      addIndiaBoundary(instance);
    });
    map.on("click", (event) => chooseMapPoint(shell, event, map));
    map.on("error", () => {
      if (!shell.classList.contains(ACTIVE_CLASS)) {
        showMessage(shell, "The HD bilingual map could not load. The previous map remains available.", 6500);
      }
    });

    loadBoundary(instance);
  }

  function scan() {
    scanQueued = false;
    const shell = document.querySelector(".india-map-shell");
    if (!shell) {
      destroyActive();
      return;
    }
    if (active?.shell === shell) return;
    if (window.maplibregl) mount(shell);
  }

  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    window.requestAnimationFrame(scan);
  }

  const observer = new MutationObserver(queueScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", queueScan);
  window.addEventListener("pageshow", queueScan);
  document.addEventListener("DOMContentLoaded", queueScan, { once: true });
  queueScan();
})();
