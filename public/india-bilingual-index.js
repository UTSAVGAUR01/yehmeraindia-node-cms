(() => {
  "use strict";
  if (!/^\/know-india(?:\/|$)/.test(location.pathname)) return;

  const places = [
    ["Andhra Pradesh", "आंध्र प्रदेश"], ["Arunachal Pradesh", "अरुणाचल प्रदेश"],
    ["Assam", "असम"], ["Bihar", "बिहार"], ["Chhattisgarh", "छत्तीसगढ़"],
    ["Goa", "गोवा"], ["Gujarat", "गुजरात"], ["Haryana", "हरियाणा"],
    ["Himachal Pradesh", "हिमाचल प्रदेश"], ["Jharkhand", "झारखंड"],
    ["Karnataka", "कर्नाटक"], ["Kerala", "केरल"], ["Madhya Pradesh", "मध्य प्रदेश"],
    ["Maharashtra", "महाराष्ट्र"], ["Manipur", "मणिपुर"], ["Meghalaya", "मेघालय"],
    ["Mizoram", "मिजोरम"], ["Nagaland", "नागालैंड"], ["Odisha", "ओडिशा"],
    ["Punjab", "पंजाब"], ["Rajasthan", "राजस्थान"], ["Sikkim", "सिक्किम"],
    ["Tamil Nadu", "तमिलनाडु"], ["Telangana", "तेलंगाना"], ["Tripura", "त्रिपुरा"],
    ["Uttar Pradesh", "उत्तर प्रदेश"], ["Uttarakhand", "उत्तराखंड"],
    ["West Bengal", "पश्चिम बंगाल"], ["Andaman and Nicobar Islands", "अंडमान और निकोबार द्वीपसमूह"],
    ["Chandigarh", "चंडीगढ़"], ["Dadra and Nagar Haveli and Daman and Diu", "दादरा और नगर हवेली और दमन और दीव"],
    ["Delhi", "दिल्ली"], ["Jammu and Kashmir", "जम्मू और कश्मीर"], ["Ladakh", "लद्दाख"],
    ["Lakshadweep", "लक्षद्वीप"], ["Puducherry", "पुडुचेरी"],
  ];

  function install() {
    const shell = document.querySelector(".india-map-shell");
    if (!shell || shell.querySelector(".ymi-bilingual-index")) return false;

    const wrapper = document.createElement("div");
    wrapper.className = "ymi-bilingual-index";
    wrapper.innerHTML = `
      <button type="button" class="ymi-bilingual-toggle" aria-expanded="false" aria-controls="ymi-bilingual-panel">
        <span>English</span><b>हिन्दी</b>
      </button>
      <section id="ymi-bilingual-panel" class="ymi-bilingual-panel" hidden aria-label="Indian State and Union Territory names in English and Hindi">
        <header><div><small>India place names</small><h2>English · हिन्दी</h2></div><button type="button" aria-label="Close bilingual names">×</button></header>
        <p>Search results, selected places and the names below use English and Hindi. Third-party raster map text may vary by zoom level.</p>
        <div class="ymi-bilingual-grid">${places.map(([en, hi]) => `<div><b>${en}</b><span lang="hi">${hi}</span></div>`).join("")}</div>
      </section>`;
    shell.append(wrapper);

    const toggle = wrapper.querySelector(".ymi-bilingual-toggle");
    const panel = wrapper.querySelector(".ymi-bilingual-panel");
    const close = panel.querySelector("header button");
    const setOpen = (open) => {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      wrapper.classList.toggle("open", open);
    };
    toggle.addEventListener("click", () => setOpen(panel.hidden));
    close.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (event) => event.key === "Escape" && setOpen(false));
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (install() || attempts >= 24) window.clearInterval(timer);
  }, 250);
  install();
})();
