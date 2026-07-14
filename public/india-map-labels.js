(() => {
  "use strict";

  const countries = [
    ["INDIA", "भारत", 22.8, 79.2],
    ["PAKISTAN", "पाकिस्तान", 30.2, 69.4],
    ["AFGHANISTAN", "अफ़ग़ानिस्तान", 35.0, 68.7],
    ["TAJIKISTAN", "ताजिकिस्तान", 38.2, 71.0],
    ["CHINA", "चीन", 33.8, 95.2],
    ["NEPAL", "नेपाल", 28.2, 84.0],
    ["BHUTAN", "भूटान", 27.5, 90.5],
    ["BANGLADESH", "बांग्लादेश", 23.7, 90.3],
    ["MYANMAR", "म्यांमार", 23.4, 96.4],
    ["SRI LANKA", "श्रीलंका", 7.4, 80.7],
    ["MALDIVES", "मालदीव", 6.7, 73.3],
  ].map(([en, hi, lat, lon]) => ({ en, hi, lat, lon, level: "country", min: 3, max: 6 }));

  const states = [
    ["Andhra Pradesh", "आंध्र प्रदेश", 15.9, 79.7], ["Arunachal Pradesh", "अरुणाचल प्रदेश", 28.2, 94.7],
    ["Assam", "असम", 26.2, 92.9], ["Bihar", "बिहार", 25.9, 85.6], ["Chhattisgarh", "छत्तीसगढ़", 21.3, 81.6],
    ["Goa", "गोवा", 15.3, 74.0], ["Gujarat", "गुजरात", 22.3, 71.2], ["Haryana", "हरियाणा", 29.1, 76.1],
    ["Himachal Pradesh", "हिमाचल प्रदेश", 31.1, 77.2], ["Jharkhand", "झारखंड", 23.6, 85.3],
    ["Karnataka", "कर्नाटक", 15.3, 75.7], ["Kerala", "केरल", 10.2, 76.3], ["Madhya Pradesh", "मध्य प्रदेश", 23.5, 78.7],
    ["Maharashtra", "महाराष्ट्र", 19.5, 75.3], ["Manipur", "मणिपुर", 24.7, 93.9], ["Meghalaya", "मेघालय", 25.5, 91.3],
    ["Mizoram", "मिजोरम", 23.2, 92.9], ["Nagaland", "नागालैंड", 26.1, 94.5], ["Odisha", "ओडिशा", 20.5, 84.4],
    ["Punjab", "पंजाब", 31.0, 75.4], ["Rajasthan", "राजस्थान", 26.8, 73.8], ["Sikkim", "सिक्किम", 27.5, 88.5],
    ["Tamil Nadu", "तमिलनाडु", 11.1, 78.7], ["Telangana", "तेलंगाना", 17.9, 79.4], ["Tripura", "त्रिपुरा", 23.8, 91.7],
    ["Uttar Pradesh", "उत्तर प्रदेश", 26.8, 80.9], ["Uttarakhand", "उत्तराखंड", 30.1, 79.3],
    ["West Bengal", "पश्चिम बंगाल", 23.1, 87.9], ["Andaman & Nicobar", "अंडमान और निकोबार", 11.7, 92.7],
    ["Chandigarh", "चंडीगढ़", 30.73, 76.78], ["Dadra, Nagar Haveli, Daman & Diu", "दादरा नगर हवेली दमन दीव", 20.4, 72.9],
    ["Delhi", "दिल्ली", 28.61, 77.21], ["Jammu & Kashmir", "जम्मू और कश्मीर", 33.5, 75.1],
    ["Ladakh", "लद्दाख", 34.2, 77.6], ["Lakshadweep", "लक्षद्वीप", 10.6, 72.6], ["Puducherry", "पुडुचेरी", 11.94, 79.81]
  ].map(([en, hi, lat, lon]) => ({ en, hi, lat, lon, level: "state", min: 4, max: 8 }));

  const districts = [
    ["New Delhi", "नई दिल्ली", 28.61, 77.21], ["Jammu", "जम्मू", 32.73, 74.87], ["Srinagar", "श्रीनगर", 34.08, 74.80],
    ["Leh", "लेह", 34.15, 77.58], ["Kargil", "कारगिल", 34.56, 76.13], ["Amritsar", "अमृतसर", 31.63, 74.87],
    ["Ludhiana", "लुधियाना", 30.90, 75.86], ["Gurugram", "गुरुग्राम", 28.46, 77.03], ["Faridabad", "फरीदाबाद", 28.41, 77.31],
    ["Shimla", "शिमला", 31.10, 77.17], ["Dehradun", "देहरादून", 30.32, 78.03], ["Haridwar", "हरिद्वार", 29.95, 78.16],
    ["Jaipur", "जयपुर", 26.91, 75.79], ["Jodhpur", "जोधपुर", 26.24, 73.02], ["Udaipur", "उदयपुर", 24.58, 73.68],
    ["Kota", "कोटा", 25.18, 75.83], ["Ajmer", "अजमेर", 26.45, 74.64], ["Jaisalmer", "जैसलमेर", 26.92, 70.91],
    ["Bikaner", "बीकानेर", 28.02, 73.31], ["Rajsamand", "राजसमंद", 25.07, 73.88], ["Lucknow", "लखनऊ", 26.85, 80.95],
    ["Varanasi", "वाराणसी", 25.32, 82.97], ["Agra", "आगरा", 27.18, 78.01], ["Prayagraj", "प्रयागराज", 25.44, 81.85],
    ["Kanpur", "कानपुर", 26.45, 80.33], ["Patna", "पटना", 25.61, 85.14], ["Gaya", "गया", 24.80, 85.00],
    ["Ranchi", "रांची", 23.34, 85.31], ["Jamshedpur", "जमशेदपुर", 22.80, 86.20], ["Kolkata", "कोलकाता", 22.57, 88.36],
    ["Darjeeling", "दार्जिलिंग", 27.04, 88.26], ["Guwahati", "गुवाहाटी", 26.14, 91.74], ["Shillong", "शिलांग", 25.58, 91.89],
    ["Imphal", "इम्फाल", 24.82, 93.94], ["Aizawl", "आइजोल", 23.73, 92.72], ["Kohima", "कोहिमा", 25.67, 94.11],
    ["Agartala", "अगरतला", 23.83, 91.28], ["Bhubaneswar", "भुवनेश्वर", 20.30, 85.82], ["Puri", "पुरी", 19.81, 85.83],
    ["Raipur", "रायपुर", 21.25, 81.63], ["Bilaspur", "बिलासपुर", 22.08, 82.14], ["Bhopal", "भोपाल", 23.26, 77.41],
    ["Indore", "इंदौर", 22.72, 75.86], ["Gwalior", "ग्वालियर", 26.22, 78.18], ["Jabalpur", "जबलपुर", 23.18, 79.95],
    ["Ahmedabad", "अहमदाबाद", 23.02, 72.57], ["Surat", "सूरत", 21.17, 72.83], ["Vadodara", "वडोदरा", 22.31, 73.18],
    ["Rajkot", "राजकोट", 22.30, 70.80], ["Mumbai", "मुंबई", 19.08, 72.88], ["Pune", "पुणे", 18.52, 73.86],
    ["Nagpur", "नागपुर", 21.15, 79.09], ["Nashik", "नाशिक", 20.00, 73.79], ["Panaji", "पणजी", 15.49, 73.83],
    ["Bengaluru", "बेंगलुरु", 12.97, 77.59], ["Mysuru", "मैसूर", 12.30, 76.65], ["Mangaluru", "मंगलुरु", 12.91, 74.86],
    ["Hyderabad", "हैदराबाद", 17.39, 78.49], ["Warangal", "वारंगल", 17.98, 79.60], ["Vijayawada", "विजयवाड़ा", 16.51, 80.65],
    ["Visakhapatnam", "विशाखापट्टनम", 17.69, 83.22], ["Tirupati", "तिरुपति", 13.63, 79.42], ["Chennai", "चेन्नई", 13.08, 80.27],
    ["Madurai", "मदुरै", 9.93, 78.12], ["Coimbatore", "कोयंबटूर", 11.02, 76.96], ["Thanjavur", "तंजावुर", 10.79, 79.14],
    ["Kochi", "कोच्चि", 9.93, 76.27], ["Thiruvananthapuram", "तिरुवनंतपुरम", 8.52, 76.94], ["Kozhikode", "कोझिकोड", 11.26, 75.78]
  ].map(([en, hi, lat, lon]) => ({ en, hi, lat, lon, level: "district", min: 6, max: 16 }));

  const labels = [...countries, ...states, ...districts];
  const observers = new WeakMap();

  function parseTile(image) {
    const src = image.currentSrc || image.src || "";
    let match = src.match(/\/(\d+)\/(\d+)\/(\d+)(?:@2x)?\.png(?:\?|$)/);
    if (match) return { z: Number(match[1]), x: Number(match[2]), y: Number(match[3]) };
    match = src.match(/\/tile\/(\d+)\/(\d+)\/(\d+)(?:\?|$)/);
    if (match) return { z: Number(match[1]), x: Number(match[3]), y: Number(match[2]) };
    return null;
  }

  function noLabelTile(z, x, y) {
    return `https://a.basemaps.cartocdn.com/light_nolabels/${z}/${x}/${y}.png`;
  }

  function hillshadeTile(z, x, y) {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Hillshade/MapServer/tile/${z}/${y}/${x}`;
  }

  function prepareTiles(map) {
    const normal = map.classList.contains("normal-map");
    map.querySelectorAll("img.leaflet-tile").forEach((image) => {
      const src = image.currentSrc || image.src || "";
      if (src.includes("World_Boundaries_and_Places")) {
        if (image.style.display !== "none") image.style.display = "none";
        image.setAttribute("aria-hidden", "true");
        return;
      }
      if (!normal || !src.includes("tile.openstreetmap.org") || image.dataset.ymiNoLabels === "true") return;
      const coordinates = parseTile(image);
      if (!coordinates) return;
      image.dataset.ymiNoLabels = "true";
      image.dataset.ymiFallback = "0";
      image.addEventListener("error", () => {
        if (image.dataset.ymiFallback === "0") {
          image.dataset.ymiFallback = "1";
          image.src = hillshadeTile(coordinates.z, coordinates.x, coordinates.y);
        }
      });
      image.src = noLabelTile(coordinates.z, coordinates.x, coordinates.y);
    });

    const attribution = map.querySelector(".leaflet-control-attribution");
    if (attribution && normal && !attribution.textContent.includes("CARTO")) {
      attribution.innerHTML = '&copy; OpenStreetMap contributors &copy; CARTO';
    }
  }

  function referenceTile(map) {
    return [...map.querySelectorAll("img.leaflet-tile")].find((image) => {
      const src = image.currentSrc || image.src || "";
      return image.style.display !== "none" && !src.includes("World_Boundaries_and_Places") && parseTile(image);
    });
  }

  function project(lat, lon, zoom, tileSize) {
    const scale = tileSize * 2 ** zoom;
    const sin = Math.sin((Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180);
    return {
      x: ((lon + 180) / 360) * scale,
      y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
    };
  }

  function ensureLayer(map) {
    let layer = map.querySelector(":scope > .ymi-map-label-layer");
    if (layer) return layer;
    layer = document.createElement("div");
    layer.className = "ymi-map-label-layer";
    layer.setAttribute("aria-label", "Map place names in English and Hindi");
    labels.forEach((item, index) => {
      const node = document.createElement("span");
      node.className = "ymi-map-label";
      node.dataset.index = String(index);
      node.dataset.level = item.level;
      node.innerHTML = `<b>${item.en}</b><small lang="hi">${item.hi}</small>`;
      layer.appendChild(node);
    });
    map.appendChild(layer);
    return layer;
  }

  function positionLabels(map) {
    prepareTiles(map);
    const tile = referenceTile(map);
    if (!tile) return;
    const coordinates = parseTile(tile);
    if (!coordinates) return;
    const mapRect = map.getBoundingClientRect();
    const tileRect = tile.getBoundingClientRect();
    const tileSize = Math.round(tileRect.width) || 256;
    const originX = coordinates.x * tileSize - (tileRect.left - mapRect.left);
    const originY = coordinates.y * tileSize - (tileRect.top - mapRect.top);
    const layer = ensureLayer(map);

    layer.querySelectorAll(".ymi-map-label").forEach((node) => {
      const item = labels[Number(node.dataset.index)];
      const visibleAtZoom = coordinates.z >= item.min && coordinates.z <= item.max;
      const point = project(item.lat, item.lon, coordinates.z, tileSize);
      const left = point.x - originX;
      const top = point.y - originY;
      const inside = left > -80 && top > -35 && left < mapRect.width + 80 && top < mapRect.height + 35;
      node.hidden = !visibleAtZoom || !inside;
      if (!node.hidden) {
        const nextLeft = `${left}px`;
        const nextTop = `${top}px`;
        if (node.style.left !== nextLeft) node.style.left = nextLeft;
        if (node.style.top !== nextTop) node.style.top = nextTop;
      }
    });
  }

  function attach(map) {
    if (observers.has(map)) return;
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        positionLabels(map);
      });
    };
    const observer = new MutationObserver((mutations) => {
      const relevant = mutations.some((mutation) => {
        if (mutation.type === "childList") return true;
        const target = mutation.target;
        if (target instanceof HTMLImageElement && target.classList.contains("leaflet-tile")) return true;
        return target instanceof HTMLElement
          && mutation.attributeName === "style"
          && (target.classList.contains("leaflet-map-pane") || target.classList.contains("leaflet-tile-pane"));
      });
      if (relevant) schedule();
    });
    observer.observe(map, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "style", "class"] });
    observers.set(map, observer);
    ["wheel", "pointerup", "touchend", "transitionend"].forEach((event) => map.addEventListener(event, schedule, { passive: true }));
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("ymi:network-restored", schedule);
    schedule();
  }

  function discover() {
    document.querySelectorAll(".india-map").forEach(attach);
  }

  const pageObserver = new MutationObserver(discover);
  pageObserver.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", () => setTimeout(discover, 0));
  window.addEventListener("pageshow", discover);
  discover();
})();
