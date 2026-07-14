import express from "express";
import { createHash } from "node:crypto";
import { query } from "./db.js";

let installed = false;
let installing = false;
let queue = Promise.resolve();
let lastRequestAt = 0;

const INDIA_BOUNDS = { south: 5.5, north: 38.8, west: 67.5, east: 98.8 };
const HINDI_NAMES = new Map(Object.entries({
  "andhra pradesh": "आंध्र प्रदेश",
  "arunachal pradesh": "अरुणाचल प्रदेश",
  "assam": "असम",
  "bihar": "बिहार",
  "chhattisgarh": "छत्तीसगढ़",
  "goa": "गोवा",
  "gujarat": "गुजरात",
  "haryana": "हरियाणा",
  "himachal pradesh": "हिमाचल प्रदेश",
  "jharkhand": "झारखंड",
  "karnataka": "कर्नाटक",
  "kerala": "केरल",
  "madhya pradesh": "मध्य प्रदेश",
  "maharashtra": "महाराष्ट्र",
  "manipur": "मणिपुर",
  "meghalaya": "मेघालय",
  "mizoram": "मिजोरम",
  "nagaland": "नागालैंड",
  "odisha": "ओडिशा",
  "orissa": "ओडिशा",
  "punjab": "पंजाब",
  "rajasthan": "राजस्थान",
  "sikkim": "सिक्किम",
  "tamil nadu": "तमिलनाडु",
  "telangana": "तेलंगाना",
  "tripura": "त्रिपुरा",
  "uttar pradesh": "उत्तर प्रदेश",
  "uttarakhand": "उत्तराखंड",
  "west bengal": "पश्चिम बंगाल",
  "andaman and nicobar islands": "अंडमान और निकोबार द्वीपसमूह",
  "chandigarh": "चंडीगढ़",
  "dadra and nagar haveli and daman and diu": "दादरा और नगर हवेली और दमन और दीव",
  "delhi": "दिल्ली",
  "national capital territory of delhi": "राष्ट्रीय राजधानी क्षेत्र दिल्ली",
  "jammu and kashmir": "जम्मू और कश्मीर",
  "jammu & kashmir": "जम्मू और कश्मीर",
  "ladakh": "लद्दाख",
  "lakshadweep": "लक्षद्वीप",
  "puducherry": "पुडुचेरी",
  "india": "भारत",
  "new delhi": "नई दिल्ली",
  "jammu": "जम्मू",
  "srinagar": "श्रीनगर",
  "leh": "लेह",
  "jaipur": "जयपुर",
  "jodhpur": "जोधपुर",
  "udaipur": "उदयपुर",
  "mumbai": "मुंबई",
  "kolkata": "कोलकाता",
  "chennai": "चेन्नई",
  "bengaluru": "बेंगलुरु",
  "bangalore": "बेंगलुरु",
  "hyderabad": "हैदराबाद",
  "ahmedabad": "अहमदाबाद",
  "pune": "पुणे",
  "lucknow": "लखनऊ",
  "bhopal": "भोपाल",
  "patna": "पटना",
  "dehradun": "देहरादून",
  "shimla": "शिमला",
  "chandigarh city": "चंडीगढ़",
  "gangtok": "गंगटोक",
  "dispur": "दिसपुर",
  "itanagar": "ईटानगर",
  "kohima": "कोहिमा",
  "imphal": "इम्फाल",
  "aizawl": "आइजोल",
  "agartala": "अगरतला",
  "shillong": "शिलांग",
  "ranchi": "रांची",
  "raipur": "रायपुर",
  "bhubaneswar": "भुवनेश्वर",
  "thiruvananthapuram": "तिरुवनंतपुरम",
  "panaji": "पणजी",
  "gandhinagar": "गांधीनगर",
  "port blair": "पोर्ट ब्लेयर",
  "kavaratti": "कवरत्ती"
}));

const clean = (value, max = 500) => String(value || "").trim().slice(0, max);
const hash = (value) => createHash("sha256").update(String(value)).digest("hex");

function scriptValue(details, language) {
  const keys = language === "hi"
    ? ["name:hi", "official_name:hi", "short_name:hi", "alt_name:hi"]
    : ["name:en", "official_name:en", "short_name:en", "alt_name:en"];
  for (const key of keys) {
    const value = clean(details?.[key], 300);
    if (value) return value;
  }
  return "";
}

function knownHindi(value) {
  return HINDI_NAMES.get(clean(value, 300).toLowerCase()) || "";
}

function bilingual(english, hindi) {
  const en = clean(english, 300);
  const hi = clean(hindi, 300);
  if (!en) return hi;
  if (!hi || hi.toLocaleLowerCase() === en.toLocaleLowerCase()) return en;
  return `${en} / ${hi}`;
}

function plainPrimary(item = {}) {
  return clean(item.name || String(item.display_name || "").split(",")[0], 300);
}

function hierarchyName(address, key) {
  if (key === "district") return address.state_district || address.district || address.county || "";
  if (key === "city") return address.city || address.town || address.municipality || "";
  if (key === "village") return address.village || address.hamlet || address.locality || address.suburb || "";
  return address[key] || "";
}

function mapPlace(item = {}) {
  const address = item.address || {};
  const details = item.namedetails || {};
  const type = String(item.addresstype || item.type || "place");
  let level = "place";
  if (["state", "union_territory"].includes(type)) level = "state";
  else if (["state_district", "district", "county"].includes(type)) level = "district";
  else if (["city", "town", "municipality"].includes(type)) level = "city";
  else if (["village", "hamlet", "locality", "suburb"].includes(type)) level = "village";
  else if (address.village || address.hamlet) level = "village";
  else if (address.city || address.town || address.municipality) level = "city";
  else if (address.state_district || address.district || address.county) level = "district";
  else if (address.state) level = "state";

  const primaryRaw = hierarchyName(address, level) || plainPrimary(item);
  const english = scriptValue(details, "en") || primaryRaw;
  const hindi = scriptValue(details, "hi") || knownHindi(english) || knownHindi(primaryRaw);
  const stateEnglish = clean(address.state, 300);
  const stateHindi = knownHindi(stateEnglish);
  const districtEnglish = clean(hierarchyName(address, "district"), 300);
  const cityEnglish = clean(hierarchyName(address, "city"), 300);
  const villageEnglish = clean(hierarchyName(address, "village"), 300);

  const hierarchy = {
    country: "India / भारत",
    state: bilingual(stateEnglish, stateHindi),
    district: districtEnglish,
    city: cityEnglish,
    village: villageEnglish,
  };
  const parts = [
    bilingual(english, hindi),
    level !== "district" ? hierarchy.district : "",
    level !== "state" ? hierarchy.state : "",
    "India / भारत",
  ].filter(Boolean);

  return {
    placeId: `${item.osm_type || "place"}:${item.osm_id || item.place_id || hash(item.display_name || english).slice(0, 16)}:${level}`,
    name: bilingual(english, hindi) || "Selected place / चयनित स्थान",
    nameEnglish: english,
    nameHindi: hindi,
    displayName: parts.join(", "),
    displayNameEnglish: clean(item.display_name, 1000) || parts.join(", "),
    displayNameHindi: hindi ? [hindi, stateHindi, "भारत"].filter(Boolean).join(", ") : "",
    level,
    hierarchy,
    hierarchyBilingual: hierarchy,
    lat: Number(item.lat),
    lon: Number(item.lon),
    boundingBox: Array.isArray(item.boundingbox) ? item.boundingbox.map(Number) : [],
  };
}

async function cached(key) {
  try {
    const rows = await query(
      "SELECT result FROM place_geocode_cache WHERE cache_key = ? AND expires_at > NOW() LIMIT 1",
      [key],
    );
    return rows.length ? JSON.parse(rows[0].result) : null;
  } catch {
    return null;
  }
}

async function saveCache(key, type, text, result) {
  try {
    await query(
      `INSERT INTO place_geocode_cache (cache_key, request_type, query_text, result, expires_at)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
       ON DUPLICATE KEY UPDATE result = VALUES(result), expires_at = VALUES(expires_at)`,
      [key, type, clean(text, 1000), JSON.stringify(result)],
    );
  } catch {}
}

async function nominatim(type, text, url) {
  const key = hash(`bilingual-v2:${type}:${text}`);
  const saved = await cached(key);
  if (saved) return saved;

  const run = queue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastRequestAt));
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
    const response = await fetch(url, {
      headers: {
        "User-Agent": `YehMeraIndia/2.1 (${process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL || "https://yehmeraindia.com"})`,
        "Accept-Language": "en-IN,hi-IN;q=0.95,en;q=0.9,hi;q=0.85",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Place service returned ${response.status}.`);
    return response.json();
  });
  queue = run.catch(() => {});
  const result = await run;
  await saveCache(key, type, text, result);
  return result;
}

function insideIndia(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= INDIA_BOUNDS.south && lat <= INDIA_BOUNDS.north
    && lon >= INDIA_BOUNDS.west && lon <= INDIA_BOUNDS.east;
}

function install(app) {
  if (installed || installing) return;
  installing = true;

  app.get("/api/places/search", async (req, res, next) => {
    try {
      const text = clean(req.query.q, 120);
      if (text.length < 2) return res.status(400).json({ message: "Enter at least two characters." });
      const params = new URLSearchParams({
        format: "jsonv2",
        q: text,
        addressdetails: "1",
        namedetails: "1",
        extratags: "1",
        countrycodes: "in",
        limit: "8",
        dedupe: "1",
        "accept-language": "en,hi",
      });
      const rows = await nominatim("search", text, `https://nominatim.openstreetmap.org/search?${params}`);
      res.json((Array.isArray(rows) ? rows : []).map(mapPlace).filter((place) => insideIndia(place.lat, place.lon)));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/places/reverse", async (req, res, next) => {
    try {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      const zoom = Math.min(18, Math.max(3, Number(req.query.zoom || 10)));
      if (!insideIndia(lat, lon)) return res.status(400).json({ message: "Choose a location within India." });
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(lat),
        lon: String(lon),
        zoom: String(Math.round(zoom)),
        addressdetails: "1",
        namedetails: "1",
        extratags: "1",
        "accept-language": "en,hi",
      });
      const row = await nominatim("reverse", `${lat.toFixed(6)},${lon.toFixed(6)},${zoom}`, `https://nominatim.openstreetmap.org/reverse?${params}`);
      const place = mapPlace(row || {});
      if (!insideIndia(place.lat, place.lon)) return res.status(400).json({ message: "Choose a location within India." });
      res.json(place);
    } catch (error) {
      next(error);
    }
  });

  installed = true;
  installing = false;
}

const previousUse = express.application.use;
express.application.use = function bilingualPlaceAwareUse(...args) {
  const result = previousUse.apply(this, args);
  const middleware = args.length === 1 && typeof args[0] === "function" ? args[0] : null;
  if (!installed && !installing && middleware?.name === "jsonParser") install(this);
  return result;
};
