(() => {
  "use strict";

  const STYLE_URLS = [
    "https://tiles.openfreemap.org/styles/bright",
    "https://tiles.openfreemap.org/styles/liberty",
  ];
  const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const INDIA_VIEW_BOUNDS = [[67.0, 5.5], [98.8, 38.9]];
  const MAP_PAN_BOUNDS = [[60.0, 0.0], [110.0, 45.0]];
  const MAP_HOST_CLASS = "ymi-vector-map";
  const PENDING_CLASS = "ymi-vector-map-pending";
  const ACTIVE_CLASS = "ymi-vector-map-active";
  const FALLBACK_CLASS = "ymi-vector-map-fallback";
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
    ["get", "name_latin"],
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
    ["all", ["!=", englishName, ""], ["!=", correctedHindiName, ""]],
    [
      "format",
      englishName,
      { "font-scale": 1 },
      "\n",
      {},
      correctedHindiName,
      { "font-scale": 0.84 },
    ],
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
      if (!response.ok) throw new Error(place?.message || "Choose a point within India.");

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

  function identity(layer) {
    return `${String(layer?.id || "").toLowerCase()} ${String(layer?.["source-layer"] || "").toLowerCase()}`;
  }

  function isTextNameLayer(layer) {
    if (layer?.type !== "symbol" || !layer.layout || !("text-field" in layer.layout)) return false;
    return !/shield|house.?number|road.?number|route.?number|exit|ref[_-]?label/.test(identity(layer));
  }

  function isCountryBoundary(layer) {
    return /country|international|admin[_ -]?(?:0|2)|boundary[_ -]?(?:0|2)/.test(identity(layer));
  }

  function isAdminBoundary(layer) {
    return layer?.type === "line" && /boundary|admin/.test(identity(layer));
  }

  function absoluteUrl(value, baseUrl) {
    if (typeof value !== "string" || !value) return value;
    if (/^(?:https?:|data:|mapbox:|pmtiles:)/i.test(value)) return value;
    try {
      return new URL(value, baseUrl).href;
    } catch {
      return value;
    }
  }

  function prepareStyle(style, styleUrl) {
    const prepared = structuredClone(style);
    prepared.glyphs = absoluteUrl(prepared.glyphs, styleUrl);
    if (typeof prepared.sprite === "string") prepared.sprite = absoluteUrl(prepared.sprite, styleUrl);
    if (Array.isArray(prepared.sprite)) {
      prepared.sprite = prepared.sprite.map((entry) => ({ ...entry, url: absoluteUrl(entry.url, styleUrl) }));
    }

    for (const source of Object.values(prepared.sources || {})) {
      if (source.url) source.url = absoluteUrl(source.url, styleUrl);
      if (Array.isArray(source.tiles)) source.tiles = source.tiles.map((url) => absoluteUrl(url, styleUrl));
      if (source.data && typeof source.data === "string") source.data = absoluteUrl(source.data, styleUrl);
    }

    for (const layer of prepared.layers || []) {
      const layerId = identity(layer);
      if (isTextNameLayer(layer)) {
        layer.layout = {
          ...layer.layout,
          "text-field": bilingualName,
          "text-line-height": 1.05,
          "text-optional": true,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-padding": Math.max(2, Number(layer.layout?.["text-padding"] || 0)),
        };

        const detailZoom = /poi|station|airport/.test(layerId)
          ? 14
          : /neighbourhood|neighborhood|suburb/.test(layerId)
            ? 12
            : /village|hamlet/.test(layerId)
              ? 10
              : /town/.test(layerId)
                ? 8
                : /city/.test(layerId)
                  ? 5
                  : null;
        if (detailZoom !== null && (!Number.isFinite(layer.minzoom) || layer.minzoom > detailZoom)) {
          layer.minzoom = detailZoom;
        }
        if (!Number.isFinite(layer.maxzoom) || layer.maxzoom < 22) layer.maxzoom = 22;
      }

      if (isAdminBoundary(layer)) {
        const country = isCountryBoundary(layer);
        layer.paint = {
          ...layer.paint,
          "line-color": country ? "#8c857a" : "#c3bcb1",
          "line-opacity": country ? 0.62 : 0.36,
          "line-width": country
            ? ["interpolate", ["linear"], ["zoom"], 3, 0.8, 7, 1.1, 12, 1.45, 18, 1.9]
            : ["interpolate", ["linear"], ["zoom"], 4, 0.45, 9, 0.7, 14, 1.0, 18, 1.3],
        };
      }

      if (layer.type === "line" && /road|street|transportation/.test(layerId)) {
        if (!Number.isFinite(layer.maxzoom) || layer.maxzoom < 22) layer.maxzoom = 22;
      }
    }

    return prepared;
  }

  async function fetchJson(url, timeout = 10000) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`Map style returned ${response.status}.`);
      return await response.json();
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function loadPreparedStyle() {
    let lastError = null;
    for (const styleUrl of STYLE_URLS) {
      try {
        const style = await fetchJson(styleUrl);
        return prepareStyle(style, styleUrl);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("The vector map style could not be loaded.");
  }

  function waitForMapLibre(timeout = 8000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        if (window.maplibregl?.Map) return resolve(window.maplibregl);
        if (Date.now() - started >= timeout) return reject(new Error("The vector map library did not load."));
        window.setTimeout(check, 80);
      };
      check();
    });
  }

  function currentMode(shell) {
    const activeButton = shell.querySelector(".map-mode-switch button.active");
    return /satellite/i.test(activeButton?.textContent || "") ? "satellite" : "normal";
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
          "raster-fade-duration": 80,
        },
      }, firstLayer);
    }

    for (const layer of map.getStyle()?.layers || []) {
      if ([SATELLITE_LAYER, INDIA_HALO_LAYER, INDIA_LAYER].includes(layer.id)) continue;
      if (!['background', 'fill', 'fill-extrusion', 'hillshade', 'raster'].includes(layer.type)) continue;
      if (!hiddenLayers.has(layer.id)) hiddenLayers.set(layer.id, layer.layout?.visibility || "visible");
      try { map.setLayoutProperty(layer.id, "visibility", "none"); } catch {}
    }
  }

  function syncMode(instance) {
    if (!instance?.map?.isStyleLoaded()) return;
    instance.mode = currentMode(instance.shell);
    setSatelliteMode(instance.map, instance.mode === "satellite", instance.hiddenLayers);
  }

  function addIndiaBoundary(instance) {
    const { map, boundary } = instance;
    if (!boundary || !map.isStyleLoaded()) return;
    const data = boundary.type === "FeatureCollection" || boundary.type === "Feature"
      ? boundary
      : { type: "Feature", properties: { name: "India" }, geometry: boundary };

    if (map.getSource(INDIA_SOURCE)) {
      map.getSource(INDIA_SOURCE).setData(data);
      return;
    }

    map.addSource(INDIA_SOURCE, { type: "geojson", data });
    map.addLayer({
      id: INDIA_HALO_LAYER,
      type: "line",
      source: INDIA_SOURCE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "rgba(255,255,255,0.96)",
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 4.8, 7, 6.0, 12, 7.8, 18, 9.8],
        "line-opacity": 0.94,
      },
    });
    map.addLayer({
      id: INDIA_LAYER,
      type: "line",
      source: INDIA_SOURCE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#17120c",
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 2.8, 7, 3.7, 12, 5.0, 18, 6.5],
        "line-opacity": 1,
      },
    });
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

  function fallback(instance, message) {
    if (!instance || active !== instance) return;
    window.clearTimeout(instance.loadTimer);
    try { instance.map?.remove(); } catch {}
    instance.host?.remove();
    instance.shell.classList.remove(PENDING_CLASS, ACTIVE_CLASS);
    instance.shell.classList.add(FALLBACK_CLASS);
    document.documentElement.classList.remove("ymi-vector-preferred");
    if (message) showMessage(instance.shell, message, 6500);
    active = null;
  }

  function destroyActive() {
    if (!active) return;
    active.shell.removeEventListener("click", active.modeClickHandler);
    window.clearTimeout(active.loadTimer);
    try { active.map?.remove(); } catch {}
    active.host?.remove();
    active.shell.classList.remove(PENDING_CLASS, ACTIVE_CLASS, FALLBACK_CLASS);
    active = null;
  }

  async function mount(shell) {
    if (active?.shell === shell) return;
    destroyActive();

    shell.classList.remove(FALLBACK_CLASS);
    shell.classList.add(PENDING_CLASS);
    document.documentElement.classList.add("ymi-vector-preferred");

    const host = document.createElement("div");
    host.className = MAP_HOST_CLASS;
    host.setAttribute("aria-label", "Interactive English and Hindi vector map of India");
    host.innerHTML = '<div class="ymi-map-loading" role="status"><span></span><b>Loading detailed India map…</b></div>';
    shell.appendChild(host);

    const instance = {
      shell,
      host,
      map: null,
      mode: currentMode(shell),
      boundary: null,
      hiddenLayers: new Map(),
      modeClickHandler: null,
      loadTimer: null,
      loaded: false,
    };
    active = instance;

    instance.modeClickHandler = (event) => {
      if (!event.target.closest(".map-mode-switch button")) return;
      window.setTimeout(() => syncMode(instance), 0);
    };
    shell.addEventListener("click", instance.modeClickHandler);

    try {
      const [maplibregl, style] = await Promise.all([waitForMapLibre(), loadPreparedStyle()]);
      if (active !== instance || !shell.isConnected) return;

      const map = new maplibregl.Map({
        container: host,
        style,
        center: [79.2, 22.7],
        zoom: 3.5,
        minZoom: 3,
        maxZoom: 20,
        maxBounds: MAP_PAN_BOUNDS,
        renderWorldCopies: false,
        attributionControl: true,
        localIdeographFontFamily: "Noto Sans Devanagari, Noto Sans, sans-serif",
        fadeDuration: 0,
        refreshExpiredTiles: true,
        crossSourceCollisions: true,
        cooperativeGestures: false,
        trackResize: true,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2.5),
        antialias: true,
        pitchWithRotate: false,
        dragRotate: false,
        maxPitch: 0,
        cancelPendingTileRequestsWhileZooming: true,
      });
      instance.map = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), "top-left");
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
      map.touchZoomRotate?.disableRotation?.();
      map.dragRotate?.disable?.();

      instance.loadTimer = window.setTimeout(() => {
        if (!instance.loaded) fallback(instance, "The detailed map did not finish loading. The previous map is available instead.");
      }, 15000);

      map.on("load", () => {
        if (active !== instance) return;
        instance.loaded = true;
        window.clearTimeout(instance.loadTimer);
        shell.classList.remove(PENDING_CLASS, FALLBACK_CLASS);
        shell.classList.add(ACTIVE_CLASS);
        host.querySelector(".ymi-map-loading")?.remove();
        map.fitBounds(INDIA_VIEW_BOUNDS, { padding: 12, duration: 0, maxZoom: 4.2 });
        syncMode(instance);
        addIndiaBoundary(instance);
      });
      map.on("click", (event) => chooseMapPoint(shell, event, map));
      map.on("error", (event) => {
        if (!instance.loaded && event?.error) {
          console.error("India vector map load error:", event.error.message || event.error);
        }
      });

      loadBoundary(instance);
    } catch (error) {
      console.error("India vector map startup failed:", error?.message || error);
      fallback(instance, "The detailed vector map could not load. The previous map is available instead.");
    }
  }

  function scan() {
    scanQueued = false;
    const shell = document.querySelector(".india-map-shell");
    if (!shell) {
      destroyActive();
      return;
    }
    if (active?.shell === shell) return;
    mount(shell);
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
