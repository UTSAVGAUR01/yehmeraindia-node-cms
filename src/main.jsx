import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  BookOpen,
  Bot,
  CalendarDays,
  ChevronRight,
  Compass,
  FilePenLine,
  ImagePlus,
  Instagram,
  Landmark,
  Languages,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  PenLine,
  Plus,
  Search,
  Save,
  Share2,
  UserPlus,
  Users,
  Sparkles,
  Lightbulb,
  ShoppingBag,
  Theater,
  Ticket,
  Trash2,
  Upload,
  Video,
  Newspaper,
  X,
  Youtube,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "";
const emptyPost = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Journal",
  status: "draft",
  coverImage: "",
  imageAlt: "",
  featured: false,
  generateImage: true,
  keywords: "",
};

const emptyBook = {
  title: "",
  description: "",
  purchaseUrl: "",
  coverImage: "",
  imagePrompt: "",
  keywords: "",
  status: "draft",
};

const emptyPlayEvent = {
  playTitle: "",
  eventTitle: "",
  description: "",
  venue: "",
  eventAt: "",
  ticketUrl: "",
  keywords: "",
  status: "draft",
};

const emptyVideo = {
  title: "",
  description: "",
  videoUrl: "",
  keywords: "Rajasthani proverb, Rajasthani language, Rajasthan culture",
  relatedType: "none",
  relatedId: "",
  status: "draft",
};

const defaultHomepage = {
  heroEyebrow: "Author · Playwright · AI Explorer",
  heroTitle: "Stories rooted in India.\nIdeas shaped for tomorrow.",
  heroBody: "A home for stories, stagecraft, and experiments at the meeting point of culture and artificial intelligence.",
  heroImage: "",
  aboutEyebrow: "Writer · dramatist · curious technologist",
  aboutTitle: "One creative life, many forms of expression.",
  aboutBody: "This platform presents an Indian author and playwright whose work moves between the written page, the living stage and emerging technology. Yeh Mera India is both a personal archive and an open invitation to think, feel and imagine.",
  aboutImage: "",
  workEyebrow: "Selected work",
  workTitle: "Words made to be read, heard and performed.",
  workBody: "Books, drama and responsible experiments with artificial intelligence.",
  workImage: "",
  aiEyebrow: "The AI Lab",
  aiTitle: "New tools. Human imagination.",
  aiBody: "Experiments with generative art, multilingual storytelling and research tools, always guided by authorship, attribution and respect for culture.",
  aiImage: "",
  journalEyebrow: "From the journal",
  journalTitle: "Notes from the page, stage and lab.",
  journalBody: "Recent writing from Yeh Mera India.",
  journalImage: "",
  contactTitle: "Stories, stagecraft and ideas for tomorrow.",
  contactBody: "Start a conversation with Yeh Mera India.",
  contactImage: "",
  contactEmail: "hello@yehmeraindia.com",
  journalPageEyebrow: "Yeh Mera India Journal",
  journalPageTitle: "Ideas from the page, the stage and the future.",
  journalPageBody: "Read essays, theatre notes, cultural reflections and responsible AI experiments.",
  journalPageImage: "",
};

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  const data =
    response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Request failed.");
  return data;
}

const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function waitForAiJob(jobId, token, onProgress) {
  let attempts = 0;
  while (true) {
    const job = await request(`/api/admin/ai-jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (job.status === "completed") return job.result || {};
    if (job.status === "failed")
      throw new Error(job.error || "The AI job could not be completed.");
    attempts += 1;
    onProgress?.(
      attempts < 4
        ? "AI job started in the background…"
        : "Still working—deep research and high-quality images can take several minutes. You can keep this screen open.",
    );
    await wait(2500);
  }
}

async function waitForPlaceResearch(researchId, onProgress) {
  let attempts = 0;
  while (true) {
    const research = await request(`/api/places/research/${researchId}`);
    if (research.status === "completed") return research;
    if (research.status === "failed")
      throw new Error(research.error || "Place research could not be completed.");
    attempts += 1;
    onProgress?.(
      attempts < 4
        ? "The research agent is checking trusted sources…"
        : "Still researching history, facts, the present scenario and recent news. This may take a few minutes.",
    );
    await wait(2500);
  }
}

function usePageMeta(title, description, keywords = []) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const values = { description, keywords: Array.isArray(keywords) ? keywords.join(", ") : keywords };
    const previous = {};
    Object.entries(values).forEach(([name, content]) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      previous[name] = tag?.getAttribute("content") ?? null;
      if (!tag) {
        tag = document.createElement("meta"); tag.setAttribute("name", name); document.head.appendChild(tag);
      }
      tag.setAttribute("content", content || "");
    });
    return () => {
      document.title = previousTitle;
      Object.entries(previous).forEach(([name, content]) => {
        const tag = document.querySelector(`meta[name="${name}"]`);
        if (tag && content !== null) tag.setAttribute("content", content);
      });
    };
  }, [title, description, JSON.stringify(keywords)]);
}

function KeywordChips({ keywords }) {
  if (!keywords?.length) return null;
  return <div className="keyword-chips" aria-label="Related topics">{keywords.map((keyword) => <span key={keyword}>#{keyword.replace(/\s+/g, "")}</span>)}</div>;
}

function safeExternalLink(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function go(path) {
  if (path.startsWith("/#")) {
    const id = path.slice(2);
    if (window.location.pathname !== "/") {
      window.location.assign(path);
      return;
    }
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.setTimeout(
      () =>
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    );
    return;
  }
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function Logo() {
  return (
    <button
      className="logo"
      onClick={() => go("/")}
      aria-label="Yeh Mera India home"
    >
      Yeh Mera India
    </button>
  );
}

function Header({ dark = true }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ymi_user") || "null");
    } catch {
      return null;
    }
  });
  const link = (label, path) => (
    <button
      onClick={() => {
        go(path);
        setOpen(false);
      }}
    >
      {label}
    </button>
  );
  const signOut = () => {
    localStorage.removeItem("ymi_user_token");
    localStorage.removeItem("ymi_admin_token");
    localStorage.removeItem("ymi_user");
    setUser(null);
    go("/");
  };
  return (
    <header className={`header ${dark ? "header-dark" : ""}`}>
      <Logo />
      <button
        className="menu-button"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        <Menu />
      </button>
      <nav className={open ? "nav-open" : ""} aria-label="Main navigation">
        {link("Home", "/")}
        {link("Know My India", "/know-india")}
        {link("About", "/#about")}
        {link("Books & Plays", "/#work")}
        {link("AI Lab", "/#ai")}
        {link("Journal", "/journal")}
        {link("Videos", "/videos")}
        {link("Contact", "/#contact")}
        <span className="auth-links">
          {user ? (
            <>
              <b>{user.name}</b>
              {["admin", "author"].includes(user.role) && link("Studio", "/admin")}
              <button className="auth-button ghost" onClick={signOut}>
                <LogOut size={15} /> Sign out
              </button>
            </>
          ) : (
            <>
              <button
                className="auth-button ghost"
                onClick={() => {
                  go("/signin");
                  setOpen(false);
                }}
              >
                <LogIn size={15} /> Sign in
              </button>
              <button
                className="auth-button"
                onClick={() => {
                  go("/signup");
                  setOpen(false);
                }}
              >
                <UserPlus size={15} /> Sign up
              </button>
            </>
          )}
        </span>
      </nav>
    </header>
  );
}

function Cover({ post, className = "" }) {
  return post.coverImage ? (
    <img
      className={className}
      src={`${API}${post.coverImage}`}
      alt={post.imageAlt || post.title}
    />
  ) : (
    <div
      className={`cover-fallback ${className}`}
      aria-label={post.imageAlt || post.title}
    >
      <span>{post.category}</span>
      <PenLine />
      <strong>{post.title}</strong>
    </div>
  );
}

const insightCategories = {
  overview: { icon: MapPin, label: "Place & identity", prompt: "Where it is, what defines it and why it matters" },
  history: { icon: Landmark, label: "History", prompt: "Origins, turning points and historical context" },
  amazingFacts: { icon: Lightbulb, label: "Amazing facts", prompt: "Verified details that surprise and delight" },
  culture: { icon: Languages, label: "Culture & language", prompt: "People, traditions, food, arts and local speech" },
  places: { icon: Compass, label: "Places to know", prompt: "Landmarks, landscapes and meaningful destinations" },
  presentScenario: { icon: Building2, label: "Present scenario", prompt: "Administration, economy, infrastructure and life today" },
  currentNews: { icon: Newspaper, label: "Current news", prompt: "Recent verified developments with dates and sources" },
};

function IndiaMapEvents({ onChoose }) {
  const map = useMapEvents({
    click(event) {
      onChoose(event.latlng.lat, event.latlng.lng, Math.max(5, map.getZoom()));
    },
  });
  return null;
}

function IndiaMapFocus({ place }) {
  const map = useMap();
  useEffect(() => {
    if (!place) return;
    if (place.boundingBox?.length === 4) {
      const [south, north, west, east] = place.boundingBox;
      map.fitBounds([[south, west], [north, east]], { padding: [35, 35], maxZoom: 12 });
    } else if (Number.isFinite(place.lat) && Number.isFinite(place.lon)) {
      map.flyTo([place.lat, place.lon], place.level === "state" ? 6 : place.level === "district" ? 8 : 12);
    }
  }, [map, place?.placeId]);
  return null;
}

function KnowMyIndia() {
  const [stage, setStage] = useState("map");
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const selectedPlaceRef = useRef(null);
  const [categoryResearch, setCategoryResearch] = useState({});
  const [verifiedPhotos, setVerifiedPhotos] = useState([]);
  const [photoStatus, setPhotoStatus] = useState("idle");
  const [activeCard, setActiveCard] = useState(null);
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const categories = Object.entries(insightCategories).map(([key, visual]) => ({ key, title: visual.label }));
  usePageMeta(
    selectedPlace ? `${selectedPlace.name} | Know My India` : "Know My India | Explore Every Place",
    selectedPlace?.displayName || "Explore Indian states, districts, cities and villages through researched history, facts, culture, present-day information and current news.",
    [selectedPlace?.name, selectedPlace?.hierarchy?.state, "India history", "Indian places"].filter(Boolean),
  );
  useEffect(() => {
    const close = (event) => event.key === "Escape" && setActiveCard(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    document.body.style.overflow = activeCard ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeCard]);

  function selectPlace(place) {
    selectedPlaceRef.current = place.placeId;
    setSelectedPlace(place);
    setSearchResults([]);
    setCategoryResearch({});
    setVerifiedPhotos([]);
    setPhotoStatus("idle");
    setActiveCard(null);
    setStage("cards");
    setBusy("");
    setError("");
    setProgress("");
  }

  async function loadVerifiedPhotos() {
    if (!selectedPlace || photoStatus === "loading" || photoStatus === "completed") return;
    const requestedPlaceId = selectedPlace.placeId;
    setPhotoStatus("loading");
    try {
      const photoQuery = [selectedPlace.name, selectedPlace.hierarchy?.state].filter(Boolean).join(", ");
      const photos = await request(`/api/places/photos?q=${encodeURIComponent(photoQuery)}`);
      if (selectedPlaceRef.current !== requestedPlaceId) return;
      setVerifiedPhotos(Array.isArray(photos) ? photos : []);
      setPhotoStatus("completed");
    } catch {
      if (selectedPlaceRef.current !== requestedPlaceId) return;
      setVerifiedPhotos([]);
      setPhotoStatus("failed");
    }
  }

  async function openCategory(categoryKey) {
    setActiveCard(categoryKey);
    if (categoryKey === "places") void loadVerifiedPhotos();
    if (categoryResearch[categoryKey]?.status === "completed") return;
    if (categoryResearch[categoryKey]?.status === "in_progress") return;
    setCategoryResearch((old) => ({ ...old, [categoryKey]: { status: "in_progress" } }));
    setBusy(`category:${categoryKey}`); setError("");
    setProgress(`Researching ${insightCategories[categoryKey]?.label || "this category"}…`);
    const requestedPlaceId = selectedPlace?.placeId;
    try {
      let data = await request("/api/places/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place: selectedPlace, category: categoryKey }),
      });
      if (data.status !== "completed") data = await waitForPlaceResearch(data.researchId, setProgress);
      if (selectedPlaceRef.current !== requestedPlaceId) return;
      setCategoryResearch((old) => ({ ...old, [categoryKey]: data }));
      setProgress("");
    } catch (e) {
      if (selectedPlaceRef.current !== requestedPlaceId) return;
      setCategoryResearch((old) => ({ ...old, [categoryKey]: { status: "failed", error: e.message } }));
      setProgress("");
    } finally { setBusy(""); }
  }

  async function searchPlaces(event) {
    event?.preventDefault();
    if (searchText.trim().length < 2) return;
    setBusy("search"); setError("");
    try { setSearchResults(await request(`/api/places/search?q=${encodeURIComponent(searchText.trim())}`)); }
    catch (e) { setError(e.message); setSearchResults([]); }
    finally { setBusy(""); }
  }

  async function chooseMapPoint(lat, lon, zoom) {
    setBusy("map"); setError("");
    try {
      const place = await request(`/api/places/reverse?lat=${lat}&lon=${lon}&zoom=${Math.round(zoom)}`);
      selectPlace(place);
    } catch (e) { setError(e.message); }
    finally { setBusy(""); }
  }

  const hierarchy = selectedPlace
    ? [
        ["State", selectedPlace.hierarchy?.state],
        ["District", selectedPlace.hierarchy?.district],
        ["City", selectedPlace.hierarchy?.city],
        ["Village", selectedPlace.hierarchy?.village],
      ].filter(([, value]) => value)
    : [];
  const activeVisual = activeCard ? insightCategories[activeCard] || insightCategories.overview : null;
  const activeResearch = activeCard ? categoryResearch[activeCard] : null;
  const activeResult = activeResearch?.result || null;
  const active = activeResult?.category || null;
  const researchedPhotos = active?.key === "places" && Array.isArray(active.photos) ? active.photos : [];
  const placePhotos = [...researchedPhotos, ...verifiedPhotos]
    .filter((photo, index, photos) => photo?.imageUrl && photos.findIndex((item) => item?.imageUrl === photo.imageUrl) === index)
    .slice(0, 4);
  const nearbyAreas = active?.key === "places" && Array.isArray(active.nearbyAreas) ? active.nearbyAreas : [];
  const visitPlan = active?.key === "places" ? active.visitPlan : null;
  const ActiveIcon = activeVisual?.icon || MapPin;

  return (
    <main className="know-india-page">
      <Header />
      {stage === "map" && (
        <section className="india-explorer">
          <div className="india-map-copy">
            <p className="eyebrow">The Golden Bird · researched place by place</p>
            <h1>Know My India</h1>
            <p>Tap the map or search any Indian state, district, city or village. Our research agent gathers history, remarkable facts, culture, today’s scenario and recent news into golden knowledge cards.</p>
            <form className="place-search" onSubmit={searchPlaces}>
              <Search />
              <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search Rajasthan, Rajsamand, Deogarh or a village" aria-label="Search a place in India" />
              <button className="button primary" disabled={busy === "search"}>{busy === "search" ? "Searching…" : "Search"}</button>
            </form>
            {error && <div className="form-error">{error}</div>}
            {searchResults.length > 0 && <div className="place-results">{searchResults.map((place) => (
              <button key={place.placeId} onClick={() => selectPlace(place)}>
                <MapPin /><span><b>{place.name}</b><small>{place.displayName}</small></span><em>{place.level}</em>
              </button>
            ))}</div>}
            <div className="map-instructions"><Compass /><span><b>Choose your depth</b>Start with a state, then zoom or search deeper for a district, city or village.</span></div>
          </div>
          <div className="india-map-shell">
            <MapContainer center={[22.7, 79.2]} zoom={4} minZoom={4} maxZoom={16} maxBounds={[[5.5, 66.5], [38.5, 99.5]]} scrollWheelZoom className="india-map">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <IndiaMapEvents onChoose={chooseMapPoint} />
              <IndiaMapFocus place={selectedPlace} />
              {selectedPlace && <CircleMarker center={[selectedPlace.lat, selectedPlace.lon]} radius={10} pathOptions={{ color: "#8f5b08", fillColor: "#f4c34f", fillOpacity: 0.9 }} />}
            </MapContainer>
            {busy === "map" && <div className="map-busy"><span />Identifying this place…</div>}
          </div>
        </section>
      )}

      {stage === "cards" && selectedPlace && (
        <section className="golden-card-page">
          <header className="golden-card-head">
            <button className="back-gold" onClick={() => setStage("map")}><ArrowLeft /> Back to India map</button>
            <p className="eyebrow">{selectedPlace?.level} · Know My India</p>
            <h1>{selectedPlace.name}</h1>
            <p>{selectedPlace.displayName}</p>
            {hierarchy.length > 0 && <div className="place-breadcrumbs">{hierarchy.map(([label, value]) => <span key={`${label}-${value}`}><small>{label}</small>{value}</span>)}</div>}
          </header>
          <div className="gold-card-grid">
            {categories.map((category, index) => {
              const visual = insightCategories[category.key] || insightCategories.overview;
              const Icon = visual.icon;
              const loaded = categoryResearch[category.key]?.status === "completed";
              return <button className="gold-category-card" style={{ "--card-delay": `${index * 70}ms` }} key={category.key} onClick={() => openCategory(category.key)}>
                <span className="gold-card-number">{String(index + 1).padStart(2, "0")}</span><Icon /><div><small>{loaded ? "Ready · cached" : visual.label}</small><h2>{category.title}</h2><p>{visual.prompt}</p></div><b>{loaded ? "Open instantly" : "Research & open"} <ArrowRight /></b>
              </button>;
            })}
          </div>
          <div className="research-note"><Sparkles /><p>Cards appear immediately. Research starts only when you open a category, and completed cards are cached for faster repeat visits.</p></div>
          <button className="button secondary gold-outline" onClick={() => { setStage("map"); setSearchText(""); }}>Go deeper: district, city or village</button>
        </section>
      )}

      {activeCard && (
        <div className="gold-card-overlay" role="dialog" aria-modal="true" aria-label={`${active?.title || activeVisual?.label} information`}>
          <button className="gold-overlay-back" onClick={() => setActiveCard(null)}><ArrowLeft /> Back to categories</button>
          <div className="gold-flap-stage">
            <article className="gold-flap-card">
              <div className="gold-flap-lid"><ActiveIcon /><p>{activeVisual.label}</p><h2>{active?.title || activeVisual.label}</h2><span>Open</span></div>
              <div className="gold-flap-content" aria-live="polite">
                {busy === `category:${activeCard}` && <div className="category-research-loading"><div className="gold-orbit"><Compass /></div><p className="eyebrow">Fast category research</p><h2>{activeVisual.label}</h2><p>{progress}</p></div>}
                {activeResearch?.status === "failed" && <div className="category-research-loading"><Lightbulb /><h2>Research needs another try</h2><p>{activeResearch.error}</p><button className="button primary" onClick={() => openCategory(activeCard)}>Try again</button></div>}
                {active && <>
                  <div className="gold-data-head"><ActiveIcon /><div><p className="eyebrow">{activeResult.placeTitle || selectedPlace.name}</p><h2>{active.title}</h2></div></div>
                  <p className="gold-summary">{active.summary}</p>
                  <ul className="gold-highlights">{active.highlights.map((highlight, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span>{highlight}</li>)}</ul>
                  {placePhotos.length > 0 && <section className="place-photo-section">
                    <div className="gold-section-title"><Compass /><div><p className="eyebrow">See the destination</p><h3>Related photographs</h3></div></div>
                    <div className="place-photo-grid">{placePhotos.map((photo, index) => {
                      const imageUrl = safeExternalLink(photo.imageUrl);
                      const sourceUrl = safeExternalLink(photo.sourcePageUrl);
                      if (!imageUrl || !sourceUrl) return null;
                      return <figure className="place-photo" key={`${imageUrl}-${index}`}>
                        <img src={imageUrl} alt={photo.alt || photo.placeName || selectedPlace.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.closest(".place-photo")?.classList.add("image-unavailable"); }} />
                        <figcaption><b>{photo.placeName}</b><span>{photo.attribution}</span><a href={sourceUrl} target="_blank" rel="noopener noreferrer">View image source <ArrowRight /></a></figcaption>
                      </figure>;
                    })}</div>
                  </section>}
                  {active?.key === "places" && photoStatus === "loading" && placePhotos.length === 0 && <p className="photo-loading">Loading verified destination photographs…</p>}
                  {(nearbyAreas.length > 0 || visitPlan) && <section className="visit-planner">
                    <div className="gold-section-title"><MapPin /><div><p className="eyebrow">Plan your visit</p><h3>Nearby places and suggested route</h3></div></div>
                    {visitPlan && <div className="visit-plan-summary">
                      <span><small>Start from</small><b>{visitPlan.startingPoint}</b></span>
                      <span><small>Suggested duration</small><b>{visitPlan.totalTimeGuidance}</b></span>
                      <span><small>Getting around</small><b>{visitPlan.transportGuidance}</b></span>
                    </div>}
                    {Array.isArray(visitPlan?.suggestedOrder) && visitPlan.suggestedOrder.length > 0 && <ol className="visit-route">{visitPlan.suggestedOrder.map((stop, index) => <li key={`${stop}-${index}`}><span>{index + 1}</span>{stop}</li>)}</ol>}
                    {nearbyAreas.length > 0 && <div className="nearby-area-grid">{nearbyAreas.map((area, index) => <article key={`${area.name}-${index}`}>
                      <small>{area.type}</small><h4>{area.name}</h4><p>{area.whyVisit}</p><div><span>{area.distanceGuidance}</span><span>{area.travelTimeGuidance}</span></div>
                    </article>)}</div>}
                    {Array.isArray(visitPlan?.practicalNotes) && visitPlan.practicalNotes.length > 0 && <div className="visit-notes"><b>Before you go</b><ul>{visitPlan.practicalNotes.map((note, index) => <li key={index}>{note}</li>)}</ul></div>}
                    <p className="visit-disclaimer">Distances and travel times are approximate planning guidance. Confirm current routes, access, opening times and local conditions before travelling.</p>
                  </section>}
                  {active.sources?.length > 0 && <div className="gold-sources"><b>Sources used by the research agent</b>{active.sources.map((source, index) => {
                    const href = safeExternalLink(source.url);
                    return href ? <a key={`${href}-${index}`} href={href} target="_blank" rel="noopener noreferrer">{source.title || href}<ArrowRight /></a> : null;
                  })}</div>}
                </>}
              </div>
            </article>
          </div>
        </div>
      )}
    </main>
  );
}

function Home() {
  const [posts, setPosts] = useState([]);
  const [works, setWorks] = useState({ books: [], events: [] });
  const [workTab, setWorkTab] = useState("books");
  const [homepage, setHomepage] = useState(defaultHomepage);
  useEffect(() => {
    request("/api/posts")
      .then(setPosts)
      .catch(() => setPosts([]));
    request("/api/homepage")
      .then((data) => setHomepage({ ...defaultHomepage, ...data }))
      .catch(() => setHomepage(defaultHomepage));
    request("/api/works")
      .then(setWorks)
      .catch(() => setWorks({ books: [], events: [] }));
  }, []);
  const featured = posts.find((post) => post.featured) || posts[0];

  return (
    <main>
      <div className="hero-shell">
        <Header />
        <section className="hero">
          <div
            className="hero-art"
            style={homepage.heroImage ? { backgroundImage: `url(${homepage.heroImage})` } : undefined}
          />
          <div className="hero-scrim" />
          <div className="hero-copy reveal">
            <p className="eyebrow">{homepage.heroEyebrow}</p>
            <h1 className="multiline">{homepage.heroTitle}</h1>
            <p>{homepage.heroBody}</p>
            <div className="hero-actions">
              <button className="button primary know-india-cta" onClick={() => go("/know-india")}>
                <Compass size={18} /> Know My India
              </button>
              <button className="button primary" onClick={() => go("/journal")}>
                Explore the work <ArrowRight size={18} />
              </button>
              <a className="button secondary" href="#about">
                Meet the author
              </a>
            </div>
          </div>
        </section>
        <div className="hero-rail">
          <span>Books</span>
          <i />
          <span>Stage</span>
          <i />
          <span>AI Experiments</span>
          <b>01</b>
        </div>
      </div>

      <section id="about" className="section author-section">
        <div className="section-kicker">
          <span>01</span> The voice behind the work
        </div>
        <div className="author-grid">
          <div>
            {homepage.aboutImage && <img className="section-image about-image" src={homepage.aboutImage} alt={homepage.aboutTitle} />}
            <p className="eyebrow">{homepage.aboutEyebrow}</p>
            <h2>{homepage.aboutTitle}</h2>
          </div>
          <div>
            <p>{homepage.aboutBody}</p>
            <a href="#work" className="text-link">
              Discover the journey <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <section id="work" className="section work-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{homepage.workEyebrow}</p>
            <h2>{homepage.workTitle}</h2>
            {homepage.workBody && <p>{homepage.workBody}</p>}
          </div>
          <button className="text-link" onClick={() => go("/journal")}>
            View journal <ArrowRight size={18} />
          </button>
        </div>
        {homepage.workImage && <img className="section-image wide-section-image" src={homepage.workImage} alt={homepage.workTitle} />}
        <div className="work-tabs" role="tablist" aria-label="Books and plays">
          <button className={workTab === "books" ? "active" : ""} onClick={() => setWorkTab("books")} role="tab">
            <BookOpen /> Books
          </button>
          <button className={workTab === "plays" ? "active" : ""} onClick={() => setWorkTab("plays")} role="tab">
            <Theater /> Plays & events
          </button>
        </div>
        {workTab === "books" ? (
          works.books.length ? (
            <div className="book-grid">
              {works.books.map((book) => (
                <article className="book-card" key={book.id}>
                  {book.coverImage ? <img src={book.coverImage} alt={`Cover artwork for ${book.title}`} /> : <div className="book-cover-fallback"><BookOpen /><span>{book.title}</span></div>}
                  <div>
                    <p className="eyebrow">Book {book.authorName && `· ${book.authorName}`}</p>
                    <h3>{book.title}</h3>
                    <p>{book.description}</p>
                    <KeywordChips keywords={book.keywords} />
                    <a className="button primary" href={book.purchaseUrl} target="_blank" rel="noopener noreferrer sponsored">
                      <ShoppingBag /> Purchase book
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : <div className="work-empty"><BookOpen /><h3>Books will appear here soon.</h3></div>
        ) : (
          works.events.length ? (
            <div className="play-event-grid">
              {works.events.map((event) => (
                <article className="play-event-card" key={event.id}>
                  <p className="eyebrow">{event.playTitle}</p>
                  <h3>{event.eventTitle}</h3>
                  <div className="event-meta">
                    <span><CalendarDays /> {new Date(event.eventAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</span>
                    <span><MapPin /> {event.venue}</span>
                  </div>
                  <p>{event.description}</p>
                  <KeywordChips keywords={event.keywords} />
                  {event.ticketUrl && <a className="button secondary light" href={event.ticketUrl} target="_blank" rel="noopener noreferrer sponsored"><Ticket /> Event tickets</a>}
                </article>
              ))}
            </div>
          ) : <div className="work-empty"><Theater /><h3>Upcoming play events will appear here.</h3></div>
        )}
      </section>

      <section id="ai" className="section ai-section">
        <div>
          <p className="eyebrow">{homepage.aiEyebrow}</p>
          <h2 className="multiline">{homepage.aiTitle}</h2>
          <p>{homepage.aiBody}</p>
        </div>
        {homepage.aiImage ? (
          <img className="section-image ai-section-image" src={homepage.aiImage} alt={homepage.aiTitle} />
        ) : (
          <div className="ai-orbit">
            <Bot />
            <span className="orbit one" />
            <span className="orbit two" />
            <b>Responsible<br />AI</b>
          </div>
        )}
      </section>

      <section className="section journal-preview">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{homepage.journalEyebrow}</p>
            <h2>{homepage.journalTitle}</h2>
            {homepage.journalBody && <p>{homepage.journalBody}</p>}
          </div>
          <button
            className="button secondary light"
            onClick={() => go("/journal")}
          >
            All posts
          </button>
        </div>
        {homepage.journalImage && <img className="section-image wide-section-image" src={homepage.journalImage} alt={homepage.journalTitle} />}
        {posts.length ? (
          <div className="post-grid">
            {posts.slice(0, 3).map((post) => (
              <PostCard post={post} key={post.id} />
            ))}
          </div>
        ) : (
          <div className="empty-public">
            <PenLine />
            <h3>The first story is being prepared.</h3>
            <p>
              Published posts from the admin panel will appear here
              automatically.
            </p>
          </div>
        )}
      </section>

      {featured && (
        <section
          className="featured-story"
          onClick={() => go(`/journal/${featured.slug}`)}
        >
          <Cover post={featured} className="featured-cover" />
          <div>
            <p className="eyebrow">Featured story</p>
            <h2>{featured.title}</h2>
            <p>{featured.excerpt}</p>
            <span>
              Read story <ArrowRight size={18} />
            </span>
          </div>
        </section>
      )}

      <footer
        id="contact"
        style={homepage.contactImage ? { backgroundImage: `linear-gradient(rgba(5,7,22,.88), rgba(5,7,22,.88)), url(${homepage.contactImage})` } : undefined}
      >
        <Logo />
        <p>{homepage.contactTitle}</p>
        {homepage.contactBody && <span>{homepage.contactBody}</span>}
        <div>
          <button onClick={() => go("/journal")}>Journal</button>
          <button onClick={() => go("/videos")}>Videos</button>
          <a href={`mailto:${homepage.contactEmail}`}>{homepage.contactEmail}</a>
        </div>
        <small>© {new Date().getFullYear()} Yeh Mera India</small>
      </footer>
    </main>
  );
}

function PostCard({ post }) {
  return (
    <article
      className="post-card"
      onClick={() => go(`/journal/${post.slug}`)}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && go(`/journal/${post.slug}`)}
    >
      <Cover post={post} />
      <div>
        <span>{post.category}</span>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <small>
          {new Date(post.publishedAt || post.updatedAt).toLocaleDateString(
            "en-IN",
            { day: "numeric", month: "long", year: "numeric" },
          )}
        </small>
      </div>
    </article>
  );
}

function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    request("/api/videos").then(setVideos).catch((e) => setError(e.message));
  }, []);
  const keywords = [...new Set(videos.flatMap((video) => video.keywords || []))];
  usePageMeta(
    "Rajasthani Proverbs & Videos | Yeh Mera India",
    "Watch Rajasthani language proverbs, author videos and cultural stories, then discover related books, plays and articles.",
    keywords.length ? keywords : ["Rajasthani proverb", "Rajasthani language", "Rajasthan culture"],
  );
  return (
    <main className="paper-page videos-page">
      <Header dark={false} />
      <section className="videos-head">
        <p className="eyebrow">Rajasthani language · proverbs · performance</p>
        <h1>Watch the words come alive.</h1>
        <p>Instagram and YouTube videos from the author, with related books, play information and articles available to every visitor.</p>
      </section>
      <section className="video-feed">
        {error && <div className="form-error">{error}</div>}
        {!error && !videos.length && <div className="work-empty"><Video /><h3>The first Rajasthani proverb video is coming soon.</h3></div>}
        {videos.map((video) => (
          <article className="social-video-card" key={video.id}>
            <div className={`video-embed ${video.platform}`}>
              {video.embedUrl ? (
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">Open video</a>}
            </div>
            <div className="video-copy">
              <p className="eyebrow">{video.platform === "youtube" ? <><Youtube /> YouTube</> : <><Instagram /> Instagram</>} {video.authorName && `· ${video.authorName}`}</p>
              <h2>{video.title}</h2>
              <p>{video.description}</p>
              <KeywordChips keywords={video.keywords} />
              {video.relatedContent && (
                video.relatedContent.url.startsWith("/") ? (
                  <button className="button primary" onClick={() => go(video.relatedContent.url)}>{video.relatedContent.action} <ArrowRight /></button>
                ) : (
                  <a className="button primary" href={video.relatedContent.url} target="_blank" rel="noopener noreferrer sponsored">{video.relatedContent.action} <ArrowRight /></a>
                )
              )}
            </div>
          </article>
        ))}
      </section>
      <footer><Logo /><p>Rajasthani words, stories and stages for the world.</p><button onClick={() => go("/#work")}>Books & plays</button><small>© {new Date().getFullYear()} Yeh Mera India</small></footer>
    </main>
  );
}

function Journal() {
  const [posts, setPosts] = useState([]);
  const [homepage, setHomepage] = useState(defaultHomepage);
  const [category, setCategory] = useState("All");
  useEffect(() => {
    request("/api/posts")
      .then(setPosts)
      .catch(() => setPosts([]));
    request("/api/homepage")
      .then((data) => setHomepage({ ...defaultHomepage, ...data }))
      .catch(() => setHomepage(defaultHomepage));
  }, []);
  const categories = useMemo(
    () => ["All", ...new Set(posts.map((post) => post.category))],
    [posts],
  );
  const visible =
    category === "All"
      ? posts
      : posts.filter((post) => post.category === category);
  return (
    <main className="paper-page">
      <Header dark={false} />
      <section
        className="journal-head"
        style={homepage.journalPageImage ? { backgroundImage: `linear-gradient(rgba(246,242,234,.9), rgba(246,242,234,.9)), url(${homepage.journalPageImage})` } : undefined}
      >
        <p className="eyebrow">{homepage.journalPageEyebrow}</p>
        <h1>{homepage.journalPageTitle}</h1>
        {homepage.journalPageBody && <p>{homepage.journalPageBody}</p>}
        <div className="filters">
          {categories.map((item) => (
            <button
              className={category === item ? "active" : ""}
              key={item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      <section className="journal-grid">
        {visible.map((post) => (
          <PostCard post={post} key={post.id} />
        ))}
      </section>
      <footer>
        <Logo />
        <p>Stories, stagecraft and ideas for tomorrow.</p>
        <small>© {new Date().getFullYear()} Yeh Mera India</small>
      </footer>
    </main>
  );
}

function Article({ slug }) {
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("ymi_user") || "null"); }
    catch { return null; }
  })();
  useEffect(() => {
    request(`/api/posts/${slug}`)
      .then(setPost)
      .catch((e) => setError(e.message));
  }, [slug]);
  usePageMeta(
    post ? `${post.title} | Yeh Mera India` : "Yeh Mera India Journal",
    post?.excerpt || "Indian stories, theatre, culture and Rajasthani language writing.",
    post?.keywords || [],
  );
  async function shareArticle() {
    const share = { title: post.title, text: post.excerpt, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(share);
      else {
        await navigator.clipboard.writeText(window.location.href);
        setFeedback("Article link copied.");
      }
    } catch (e) {
      if (e.name !== "AbortError") setFeedback("Unable to share this article.");
    }
  }
  async function sendMessage(event) {
    event.preventDefault();
    setSending(true);
    setFeedback("");
    try {
      const data = await request(`/api/posts/${post.id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ymi_user_token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      setMessage("");
      setFeedback(data.message);
    } catch (e) {
      setFeedback(e.message);
    } finally {
      setSending(false);
    }
  }
  if (error)
    return (
      <main className="paper-page">
        <Header dark={false} />
        <div className="not-found">
          <h1>Story not found</h1>
          <button className="button primary" onClick={() => go("/journal")}>
            Back to journal
          </button>
        </div>
      </main>
    );
  if (!post) return <div className="loading">Opening the manuscript…</div>;
  return (
    <main className="paper-page">
      <Header dark={false} />
      <article className="article">
        <div className="article-head">
          <p className="eyebrow">{post.category}</p>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <span>
            <CalendarDays size={16} />{" "}
            {new Date(post.publishedAt || post.updatedAt).toLocaleDateString(
              "en-IN",
              { day: "numeric", month: "long", year: "numeric" },
            )}
          </span>
          {post.authorName && <span>By {post.authorName}</span>}
          <button className="button secondary light article-share" onClick={shareArticle}>
            <Share2 size={17} /> Share article
          </button>
        </div>
        <Cover post={post} className="article-cover" />
        <div className="article-body">
          {post.content.split(/\n\n+/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <KeywordChips keywords={post.keywords} />
        <section className="author-contact">
          <MessageCircle />
          <div>
            <p className="eyebrow">Contact the author</p>
            <h2>Send a message about this article.</h2>
            {!user && (
              <p>Please <button onClick={() => go("/signin")}>sign in</button> as a viewer to message the author.</p>
            )}
            {user?.role === "viewer" && post.authorId && (
              <form onSubmit={sendMessage}>
                <textarea
                  required
                  minLength="3"
                  maxLength="2000"
                  rows="5"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message to the author"
                />
                <button className="button primary" disabled={sending}>
                  <Mail size={17} /> {sending ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
            {user && user.role !== "viewer" && <p>Viewer accounts can send article messages.</p>}
            {user?.role === "viewer" && !post.authorId && <p>This article does not have an assigned author.</p>}
            {feedback && <div className="notice compact">{feedback}</div>}
          </div>
        </section>
      </article>
      <footer>
        <Logo />
        <button onClick={() => go("/journal")}>Back to Journal</button>
        <small>© {new Date().getFullYear()} Yeh Mera India</small>
      </footer>
    </main>
  );
}

function AuthPage({ mode }) {
  const signingUp = mode === "signup";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await request(
        `/api/auth/${signingUp ? "signup" : "signin"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      localStorage.setItem("ymi_user_token", data.token);
      localStorage.setItem("ymi_user", JSON.stringify(data.user));
      if (["admin", "author"].includes(data.user?.role)) {
        localStorage.setItem("ymi_admin_token", data.token);
        go("/admin");
      } else {
        go("/");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Header />
      <section>
        <form className="auth-card" onSubmit={submit}>
          <p className="eyebrow">
            {signingUp ? "Join the community" : "Welcome back"}
          </p>
          <h1>{signingUp ? "Create your account." : "Sign in to continue."}</h1>
          <p>
            Read, follow and take part in stories from the page, stage and AI
            lab.
          </p>
          {signingUp && (
            <label>
              Your name
              <input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              minLength={signingUp ? 8 : undefined}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              autoComplete={signingUp ? "new-password" : "current-password"}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="button primary" disabled={busy}>
            {busy ? "Please wait…" : signingUp ? "Create account" : "Sign in"}
          </button>
          <div className="auth-switch">
            {signingUp ? "Already have an account?" : "New to Yeh Mera India?"}{" "}
            <button
              type="button"
              onClick={() => go(signingUp ? "/signin" : "/signup")}
            >
              {signingUp ? "Sign in" : "Create account"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await request("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("ymi_admin_token", data.token);
      localStorage.setItem("ymi_user_token", data.token);
      localStorage.setItem("ymi_user", JSON.stringify(data.user));
      onLogin(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-login">
      <button className="back-home" onClick={() => go("/")}>
        <X /> Close
      </button>
      <form onSubmit={submit}>
        <Logo />
        <p className="eyebrow">Author and admin studio</p>
        <h1>Welcome backstage.</h1>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@yehmeraindia.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="button primary" disabled={busy}>
          {busy ? "Signing in…" : "Enter admin panel"}
        </button>
      </form>
    </main>
  );
}

function Admin() {
  const [token, setToken] = useState(localStorage.getItem("ymi_admin_token"));
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [managingUsers, setManagingUsers] = useState(false);
  const [editingHomepage, setEditingHomepage] = useState(false);
  const [editingAiSettings, setEditingAiSettings] = useState(false);
  const [managingWorks, setManagingWorks] = useState(false);
  const [managingVideos, setManagingVideos] = useState(false);
  const [viewingMessages, setViewingMessages] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const auth = { Authorization: `Bearer ${token}` };
  function load() {
    if (!token) return;
    Promise.all([
      request("/api/auth/me", { headers: auth }),
      request("/api/admin/posts", { headers: auth }),
    ])
      .then(([account, loadedPosts]) => {
        if (!["admin", "author"].includes(account.user?.role)) throw new Error("Studio access required.");
        setUser(account.user);
        setPosts(loadedPosts);
      })
      .catch(() => {
        localStorage.removeItem("ymi_admin_token");
        setToken(null);
      });
  }
  useEffect(load, [token]);
  if (!token) return <AdminLogin onLogin={(data) => { setUser(data.user); setToken(data.token); }} />;
  async function remove(post) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`))
      return;
    try {
      await request(`/api/admin/posts/${post.id}`, {
        method: "DELETE",
        headers: auth,
      });
      setNotice("Post deleted.");
      load();
    } catch (e) {
      setError(e.message);
    }
  }
  function logout() {
    localStorage.removeItem("ymi_admin_token");
    localStorage.removeItem("ymi_user_token");
    localStorage.removeItem("ymi_user");
    setToken(null);
  }
  return (
    <main className="admin-page">
      <aside>
        <Logo />
        <div className="admin-nav active">
          <LayoutDashboard /> Posts
        </div>
        <button onClick={() => setEditing({ ...emptyPost })}>
          <Plus /> New post
        </button>
        <button onClick={() => setManagingWorks(true)}>
          <Theater /> Books & plays
        </button>
        <button onClick={() => setManagingVideos(true)}>
          <Video /> Social videos
        </button>
        {user?.role === "admin" && (
          <button onClick={() => setManagingUsers(true)}>
            <Users /> Users & roles
          </button>
        )}
        {user?.role === "admin" && (
          <button onClick={() => setEditingHomepage(true)}>
            <LayoutDashboard /> Page designer
          </button>
        )}
        {user?.role === "admin" && (
          <button onClick={() => setEditingAiSettings(true)}>
            <Sparkles /> AI settings
          </button>
        )}
        <button onClick={() => setViewingMessages(true)}>
          <Mail /> Messages
        </button>
        <button onClick={() => go("/")}>
          <BookOpen /> View website
        </button>
        <button className="logout" onClick={logout}>
          <LogOut /> Sign out
        </button>
      </aside>
      <section className="admin-content">
        <header>
          <div>
            <p className="eyebrow">Content studio</p>
            <h1>{user?.role === "author" ? "My posts" : "All posts"}</h1>
            <p>{user?.role === "author" ? "Create and manage your own published work." : "Create, update and publish stories across Yeh Mera India."}</p>
          </div>
          <button
            className="button primary"
            onClick={() => setEditing({ ...emptyPost })}
          >
            <Plus /> Create post
          </button>
        </header>
        {notice && (
          <div className="notice">
            {notice}
            <button onClick={() => setNotice("")}>
              <X />
            </button>
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
        <div className="stats">
          <div>
            <b>{posts.length}</b>
            <span>Total posts</span>
          </div>
          <div>
            <b>{posts.filter((p) => p.status === "published").length}</b>
            <span>Published</span>
          </div>
          <div>
            <b>{posts.filter((p) => p.status === "draft").length}</b>
            <span>Drafts</span>
          </div>
          <div>
            <b>{posts.filter((p) => p.coverImage).length}</b>
            <span>With media</span>
          </div>
        </div>
        <div className="admin-table">
          <div className="table-head">
            <span>Story</span>
            <span>Status</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>
          {posts.map((post) => (
            <div className="table-row" key={post.id}>
              <div>
                <Cover post={post} />
                <span>
                  <b>{post.title}</b>
                  <small>
                    {post.category} · /{post.slug}
                  </small>
                </span>
              </div>
              <span className={`status ${post.status}`}>{post.status}</span>
              <span>
                {new Date(post.updatedAt).toLocaleDateString("en-IN")}
              </span>
              <div>
                <button
                  title="Edit"
                  onClick={() => setEditing({ ...post, generateImage: false })}
                >
                  <FilePenLine />
                </button>
                <button title="Delete" onClick={() => remove(post)}>
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {editing && (
        <PostEditor
          post={editing}
          token={token}
          role={user?.role}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setNotice("Post saved successfully.");
            load();
          }}
        />
      )}
      {managingUsers && (
        <UserManager token={token} currentUser={user} onClose={() => setManagingUsers(false)} />
      )}
      {editingHomepage && (
        <HomepageEditor token={token} onClose={() => setEditingHomepage(false)} />
      )}
      {editingAiSettings && (
        <AiSettings token={token} onClose={() => setEditingAiSettings(false)} />
      )}
      {managingWorks && (
        <WorksManager token={token} role={user?.role} onClose={() => setManagingWorks(false)} />
      )}
      {managingVideos && (
        <VideoManager token={token} role={user?.role} onClose={() => setManagingVideos(false)} />
      )}
      {viewingMessages && (
        <MessageManager token={token} onClose={() => setViewingMessages(false)} />
      )}
    </main>
  );
}

function BookEditor({ book, token, onCancel, onSaved }) {
  const [form, setForm] = useState({ ...book, keywords: Array.isArray(book.keywords) ? book.keywords.join(", ") : book.keywords || "" });
  const [generateCover, setGenerateCover] = useState(false);
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const auth = { Authorization: `Bearer ${token}` };
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  async function uploadCover(file) {
    if (!file) return;
    setBusy("upload"); setError("");
    try {
      const body = new FormData(); body.append("image", file);
      const data = await request("/api/admin/upload", { method: "POST", headers: auth, body });
      update("coverImage", data.url);
      setGenerateCover(false);
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }
  async function save(event) {
    event.preventDefault(); setBusy("save"); setError(""); setProgress("");
    if (generateCover && !String(form.imagePrompt || "").trim()) {
      setError("Describe the cover image before asking AI to generate it.");
      setBusy("");
      return;
    }
    try {
      const saved = await request(form.id ? `/api/admin/books/${form.id}` : "/api/admin/books", {
        method: form.id ? "PUT" : "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm(saved);
      if (generateCover) {
        setBusy("image");
        setProgress("Starting high-quality portrait cover artwork…");
        const job = await request(`/api/admin/books/${saved.id}/generate-cover`, {
          method: "POST",
          headers: { ...auth, "Content-Type": "application/json" },
          body: "{}",
        });
        const result = await waitForAiJob(job.jobId, token, setProgress);
        setForm((old) => ({ ...old, coverImage: result.image }));
      }
      onSaved(generateCover ? "Book saved and AI cover generated." : "Book saved successfully.");
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }
  return (
    <form className="works-form" onSubmit={save}>
      <div className="manager-heading"><div><p className="eyebrow">Books</p><h3>{form.id ? "Edit book" : "Add book"}</h3></div><button type="button" onClick={onCancel}><X /></button></div>
      {error && <div className="form-error">{error}</div>}
      {progress && <p className="ai-progress" role="status">{progress}</p>}
      <div className="works-form-grid">
        <div>
          <label>Book title<input required maxLength="220" value={form.title} onChange={(e) => update("title", e.target.value)} /></label>
          <label>Book description<textarea required rows="7" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the book, its themes and who it is for." /></label>
          <label>Purchase link<input required type="url" maxLength="2000" value={form.purchaseUrl} onChange={(e) => update("purchaseUrl", e.target.value)} placeholder="https://amazon.in/... or another bookstore" /></label>
          <label>Related search keywords<textarea rows="3" value={form.keywords} onChange={(e) => update("keywords", e.target.value)} placeholder="Rajasthani literature, Rajasthan author, Indian books" /></label>
          <label>Publishing status<select value={form.status} onChange={(e) => update("status", e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></label>
        </div>
        <div>
          <div className="book-cover-admin">
            {form.coverImage ? <img src={form.coverImage} alt="Book cover preview" /> : <div><BookOpen /><span>No cover artwork</span></div>}
          </div>
          <label className="upload-button"><Upload /> {busy === "upload" ? "Uploading…" : "Upload book cover"}<input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => uploadCover(e.target.files?.[0])} /></label>
          <label>AI cover image description<textarea rows="5" value={form.imagePrompt} onChange={(e) => update("imagePrompt", e.target.value)} placeholder="Describe the characters, place, mood, symbols, period and visual style you want." /></label>
          <label className="checkbox research-toggle"><input type="checkbox" checked={generateCover} onChange={(e) => setGenerateCover(e.target.checked)} />Generate or replace cover with AI after saving</label>
          <p className="ai-helper">AI creates portrait artwork from your book description and visual direction. The job runs in the background and may take several minutes.</p>
        </div>
      </div>
      <div className="works-form-actions"><button type="button" className="button secondary light" onClick={onCancel}>Cancel</button><button className="button primary" disabled={Boolean(busy)}><Save /> {busy === "image" ? "Generating cover…" : busy ? "Saving…" : "Save book"}</button></div>
    </form>
  );
}

function PlayEventEditor({ event, token, onCancel, onSaved }) {
  const initial = {
    ...event,
    eventAt: event.eventAt ? new Date(event.eventAt).toISOString().slice(0, 16) : "",
    keywords: Array.isArray(event.keywords) ? event.keywords.join(", ") : event.keywords || "",
  };
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const auth = { Authorization: `Bearer ${token}` };
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  async function save(eventObject) {
    eventObject.preventDefault(); setBusy(true); setError("");
    try {
      await request(form.id ? `/api/admin/play-events/${form.id}` : "/api/admin/play-events", {
        method: form.id ? "PUT" : "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, eventAt: new Date(form.eventAt).toISOString() }),
      });
      onSaved("Play event saved successfully.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return (
    <form className="works-form" onSubmit={save}>
      <div className="manager-heading"><div><p className="eyebrow">Plays & events</p><h3>{form.id ? "Edit performance" : "Create performance"}</h3></div><button type="button" onClick={onCancel}><X /></button></div>
      {error && <div className="form-error">{error}</div>}
      <div className="works-form-grid event-form-grid">
        <div>
          <label>Play title<input required maxLength="220" value={form.playTitle} onChange={(e) => update("playTitle", e.target.value)} placeholder="Name of the play" /></label>
          <label>Event title<input required maxLength="220" value={form.eventTitle} onChange={(e) => update("eventTitle", e.target.value)} placeholder="Opening night, city performance…" /></label>
          <label>Play and event description<textarea required rows="8" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the story, performance and what the audience can expect." /></label>
        </div>
        <div>
          <label>Venue<input required maxLength="300" value={form.venue} onChange={(e) => update("venue", e.target.value)} /></label>
          <label>Event date and time<input required type="datetime-local" value={form.eventAt} onChange={(e) => update("eventAt", e.target.value)} /></label>
          <label>Ticket or registration link (optional)<input type="url" maxLength="2000" value={form.ticketUrl} onChange={(e) => update("ticketUrl", e.target.value)} placeholder="https://..." /></label>
          <label>Related search keywords<textarea rows="3" value={form.keywords} onChange={(e) => update("keywords", e.target.value)} placeholder="Rajasthani theatre, Rajasthan plays, live performance" /></label>
          <label>Publishing status<select value={form.status} onChange={(e) => update("status", e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></label>
        </div>
      </div>
      <div className="works-form-actions"><button type="button" className="button secondary light" onClick={onCancel}>Cancel</button><button className="button primary" disabled={busy}><Save /> {busy ? "Saving…" : "Save event"}</button></div>
    </form>
  );
}

function WorksManager({ token, role, onClose }) {
  const [tab, setTab] = useState("books");
  const [books, setBooks] = useState([]);
  const [events, setEvents] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const auth = { Authorization: `Bearer ${token}` };
  function load() {
    Promise.all([
      request("/api/admin/books", { headers: auth }),
      request("/api/admin/play-events", { headers: auth }),
    ]).then(([loadedBooks, loadedEvents]) => { setBooks(loadedBooks); setEvents(loadedEvents); }).catch((e) => setError(e.message));
  }
  useEffect(load, []);
  async function remove(type, item) {
    const label = type === "books" ? item.title : item.eventTitle;
    if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) return;
    try {
      await request(type === "books" ? `/api/admin/books/${item.id}` : `/api/admin/play-events/${item.id}`, { method: "DELETE", headers: auth });
      setNotice(`${type === "books" ? "Book" : "Play event"} deleted.`); load();
    } catch (e) { setError(e.message); }
  }
  const saved = (message) => { setEditingBook(null); setEditingEvent(null); setNotice(message); load(); };
  return (
    <div className="editor-overlay">
      <section className="editor manager-panel works-manager">
        <header><div><p className="eyebrow">Author catalogue</p><h2>Books & plays</h2></div><button onClick={onClose}><X /></button></header>
        <div className="manager-body">
          {notice && <div className="notice compact">{notice}</div>}
          {error && <div className="form-error">{error}</div>}
          {editingBook ? <BookEditor book={editingBook} token={token} onCancel={() => setEditingBook(null)} onSaved={saved} /> : editingEvent ? <PlayEventEditor event={editingEvent} token={token} onCancel={() => setEditingEvent(null)} onSaved={saved} /> : (
            <>
              <div className="works-manager-toolbar">
                <div className="work-tabs manager-tabs"><button className={tab === "books" ? "active" : ""} onClick={() => setTab("books")}><BookOpen /> Books</button><button className={tab === "plays" ? "active" : ""} onClick={() => setTab("plays")}><Theater /> Plays & events</button></div>
                <button className="button primary" onClick={() => tab === "books" ? setEditingBook({ ...emptyBook }) : setEditingEvent({ ...emptyPlayEvent })}><Plus /> {tab === "books" ? "Add book" : "Add event"}</button>
              </div>
              <p>{role === "author" ? "You can manage your own books and performances." : "Admin can manage catalogue entries from every author."}</p>
              <div className="works-list">
                {(tab === "books" ? books : events).map((item) => (
                  <article key={item.id}>
                    <div>{tab === "books" && item.coverImage ? <img src={item.coverImage} alt="" /> : tab === "books" ? <BookOpen /> : <Theater />}</div>
                    <span><b>{tab === "books" ? item.title : item.eventTitle}</b><small>{tab === "books" ? item.purchaseUrl : `${item.playTitle} · ${new Date(item.eventAt).toLocaleString("en-IN")}`}</small></span>
                    <em className={`status ${item.status}`}>{item.status}</em>
                    <div><button title="Edit" onClick={() => tab === "books" ? setEditingBook({ ...item }) : setEditingEvent({ ...item })}><FilePenLine /></button><button title="Delete" onClick={() => remove(tab, item)}><Trash2 /></button></div>
                  </article>
                ))}
                {!(tab === "books" ? books : events).length && <div className="work-empty"><p>No {tab === "books" ? "books" : "play events"} added yet.</p></div>}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function VideoEditor({ video, references, token, onCancel, onSaved }) {
  const [form, setForm] = useState({
    ...video,
    keywords: Array.isArray(video.keywords) ? video.keywords.join(", ") : video.keywords || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const auth = { Authorization: `Bearer ${token}` };
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const choices = form.relatedType === "book" ? references.books : form.relatedType === "play" ? references.events : form.relatedType === "post" ? references.posts : [];
  async function save(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await request(form.id ? `/api/admin/videos/${form.id}` : "/api/admin/videos", {
        method: form.id ? "PUT" : "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onSaved("Social video saved successfully.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return (
    <form className="works-form video-form" onSubmit={save}>
      <div className="manager-heading"><div><p className="eyebrow">Instagram & YouTube</p><h3>{form.id ? "Edit video" : "Share video"}</h3></div><button type="button" onClick={onCancel}><X /></button></div>
      {error && <div className="form-error">{error}</div>}
      <div className="works-form-grid">
        <div>
          <label>Video title<input required maxLength="220" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="A Rajasthani proverb about courage" /></label>
          <label>Instagram or YouTube link<input required type="url" maxLength="2000" value={form.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..." /></label>
          <label>Description<textarea required rows="7" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Explain the proverb, translation, cultural meaning and context." /></label>
          <label>Related search keywords<textarea rows="4" value={form.keywords} onChange={(e) => update("keywords", e.target.value)} placeholder="Rajasthani proverb, Marwari language, Rajasthan culture" /><small>Use accurate comma-separated phrases. They appear as topics and page metadata.</small></label>
        </div>
        <div>
          <label>Connect this video to<select value={form.relatedType} onChange={(e) => setForm((old) => ({ ...old, relatedType: e.target.value, relatedId: "" }))}><option value="none">No related content</option><option value="book">Book purchase</option><option value="play">Play information</option><option value="post">Article</option></select></label>
          {form.relatedType !== "none" && <label>Related item<select required value={form.relatedId} onChange={(e) => update("relatedId", e.target.value)}><option value="">Choose an item</option>{choices.map((item) => <option value={item.id} key={item.id}>{form.relatedType === "book" ? item.title : form.relatedType === "play" ? `${item.playTitle} · ${item.eventTitle}` : item.title}</option>)}</select></label>}
          <label>Publishing status<select value={form.status} onChange={(e) => update("status", e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></label>
          <div className="video-guidance"><Video /><b>Supported links</b><p>Public YouTube videos, YouTube Shorts, Instagram posts and Instagram Reels. Private or restricted posts may not play for anonymous visitors.</p></div>
        </div>
      </div>
      <div className="works-form-actions"><button type="button" className="button secondary light" onClick={onCancel}>Cancel</button><button className="button primary" disabled={busy}><Save /> {busy ? "Saving…" : "Save video"}</button></div>
    </form>
  );
}

function VideoManager({ token, role, onClose }) {
  const [videos, setVideos] = useState([]);
  const [references, setReferences] = useState({ books: [], events: [], posts: [] });
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const auth = { Authorization: `Bearer ${token}` };
  function load() {
    Promise.all([
      request("/api/admin/videos", { headers: auth }),
      request("/api/admin/books", { headers: auth }),
      request("/api/admin/play-events", { headers: auth }),
      request("/api/admin/posts", { headers: auth }),
    ]).then(([loadedVideos, books, events, posts]) => { setVideos(loadedVideos); setReferences({ books, events, posts }); }).catch((e) => setError(e.message));
  }
  useEffect(load, []);
  async function remove(video) {
    if (!window.confirm(`Delete “${video.title}”? This cannot be undone.`)) return;
    try { await request(`/api/admin/videos/${video.id}`, { method: "DELETE", headers: auth }); setNotice("Video deleted."); load(); }
    catch (e) { setError(e.message); }
  }
  const saved = (message) => { setEditing(null); setNotice(message); load(); };
  return (
    <div className="editor-overlay">
      <section className="editor manager-panel works-manager">
        <header><div><p className="eyebrow">Rajasthani language channel</p><h2>Social videos</h2></div><button onClick={onClose}><X /></button></header>
        <div className="manager-body">
          {notice && <div className="notice compact">{notice}</div>}
          {error && <div className="form-error">{error}</div>}
          {editing ? <VideoEditor video={editing} references={references} token={token} onCancel={() => setEditing(null)} onSaved={saved} /> : <>
            <div className="works-manager-toolbar"><p>{role === "author" ? "Share and manage your own public videos." : "Manage social videos from every author."}</p><button className="button primary" onClick={() => setEditing({ ...emptyVideo })}><Plus /> Share video</button></div>
            <div className="works-list video-admin-list">
              {videos.map((video) => <article key={video.id}><div>{video.platform === "youtube" ? <Youtube /> : <Instagram />}</div><span><b>{video.title}</b><small>{video.videoUrl}</small></span><em className={`status ${video.status}`}>{video.status}</em><div><button title="Edit" onClick={() => setEditing({ ...video })}><FilePenLine /></button><button title="Delete" onClick={() => remove(video)}><Trash2 /></button></div></article>)}
              {!videos.length && <div className="work-empty"><Video /><p>No social videos added yet.</p></div>}
            </div>
          </>}
        </div>
      </section>
    </div>
  );
}

function UserManager({ token, currentUser, onClose }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const auth = { Authorization: `Bearer ${token}` };
  useEffect(() => {
    request("/api/admin/users", { headers: auth }).then(setUsers).catch((e) => setError(e.message));
  }, []);
  async function updateUser(user, changes) {
    setError("");
    try {
      const updated = await request(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ role: changes.role ?? user.role, status: changes.status ?? user.status }),
      });
      setUsers((items) => items.map((item) => String(item.id) === String(updated.id) ? updated : item));
      setNotice(`${updated.name}'s access was updated.`);
    } catch (e) { setError(e.message); }
  }
  return (
    <div className="editor-overlay">
      <section className="editor manager-panel">
        <header><div><p className="eyebrow">Administration</p><h2>Users & roles</h2></div><button onClick={onClose}><X /></button></header>
        <div className="manager-body">
          <p>New sign-ups start as viewers. Promote trusted users to author or admin.</p>
          {notice && <div className="notice compact">{notice}</div>}
          {error && <div className="form-error">{error}</div>}
          <div className="user-table">
            <div className="user-head"><span>User</span><span>Role</span><span>Status</span></div>
            {users.map((user) => (
              <div className="user-row" key={user.id}>
                <span><b>{user.name}</b><small>{user.email}</small></span>
                <select value={user.role} disabled={String(user.id) === String(currentUser?.id)} onChange={(e) => updateUser(user, { role: e.target.value })}>
                  <option value="admin">Admin</option><option value="author">Author</option><option value="viewer">Viewer</option>
                </select>
                <select value={user.status} disabled={String(user.id) === String(currentUser?.id)} onChange={(e) => updateUser(user, { status: e.target.value })}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const pageDesignerSections = [
  { key: "hero", page: "Homepage", label: "Hero banner", eyebrow: "heroEyebrow", title: "heroTitle", body: "heroBody", image: "heroImage" },
  { key: "about", page: "Homepage", label: "About author", eyebrow: "aboutEyebrow", title: "aboutTitle", body: "aboutBody", image: "aboutImage" },
  { key: "work", page: "Homepage", label: "Books & plays", eyebrow: "workEyebrow", title: "workTitle", body: "workBody", image: "workImage" },
  { key: "ai", page: "Homepage", label: "AI Lab", eyebrow: "aiEyebrow", title: "aiTitle", body: "aiBody", image: "aiImage" },
  { key: "journal", page: "Homepage", label: "Journal block", eyebrow: "journalEyebrow", title: "journalTitle", body: "journalBody", image: "journalImage" },
  { key: "contact", page: "Homepage", label: "Contact footer", eyebrow: null, title: "contactTitle", body: "contactBody", image: "contactImage" },
  { key: "journalPage", page: "Journal page", label: "Journal page header", eyebrow: "journalPageEyebrow", title: "journalPageTitle", body: "journalPageBody", image: "journalPageImage" },
];

function HomepageEditor({ token, onClose }) {
  const [form, setForm] = useState(defaultHomepage);
  const [activeKey, setActiveKey] = useState("hero");
  const [imagePrompts, setImagePrompts] = useState({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const auth = { Authorization: `Bearer ${token}` };
  const active = pageDesignerSections.find((section) => section.key === activeKey) || pageDesignerSections[0];
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  useEffect(() => {
    request("/api/homepage")
      .then((data) => setForm({ ...defaultHomepage, ...data }))
      .catch((e) => setError(e.message));
  }, []);
  async function uploadImage(file) {
    if (!file) return;
    setBusy("upload"); setError("");
    try {
      const body = new FormData(); body.append("image", file);
      const data = await request("/api/admin/upload", { method: "POST", headers: auth, body });
      update(active.image, data.url);
      setNotice(`${active.label} image uploaded. Save the page to publish it.`);
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }
  async function rewriteSection() {
    setBusy("rewrite"); setError(""); setNotice("");
    try {
      const job = await request("/api/admin/homepage/rewrite", {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({
          page: active.page,
          section: active.label,
          eyebrow: active.eyebrow ? form[active.eyebrow] : "",
          title: form[active.title],
          body: form[active.body],
        }),
      });
      setNotice("AI rewrite started in the background…");
      const data = await waitForAiJob(job.jobId, token, setNotice);
      setForm((old) => ({
        ...old,
        ...(active.eyebrow ? { [active.eyebrow]: data.eyebrow } : {}),
        [active.title]: data.title,
        [active.body]: data.body,
      }));
      setNotice(`AI rewrite prepared for ${active.label}. Review and save it.`);
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }
  async function generateImage() {
    setBusy("image"); setError(""); setNotice("");
    try {
      const job = await request("/api/admin/homepage/generate-image", {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({
          page: active.page,
          section: active.label,
          title: form[active.title],
          body: form[active.body],
          prompt: imagePrompts[active.key] || form[active.body],
        }),
      });
      setNotice("High-quality image generation started in the background…");
      const data = await waitForAiJob(job.jobId, token, setNotice);
      update(active.image, data.image);
      setNotice(`AI image generated for ${active.label}. Review and save it.`);
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }
  async function save(event) {
    event.preventDefault(); setBusy("save"); setError("");
    try {
      const data = await request("/api/admin/homepage", {
        method: "PUT", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      setForm({ ...defaultHomepage, ...data }); setNotice("Page design saved successfully.");
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }
  return (
    <div className="editor-overlay">
      <form className="editor homepage-editor" onSubmit={save}>
        <header><div><p className="eyebrow">Visual CMS</p><h2>Page designer</h2></div><button type="button" onClick={onClose}><X /></button></header>
        <div className="page-designer">
          <aside className="section-tabs">
            {pageDesignerSections.map((section) => (
              <button type="button" className={active.key === section.key ? "active" : ""} key={section.key} onClick={() => { setActiveKey(section.key); setError(""); setNotice(""); }}>
                <small>{section.page}</small>{section.label}
              </button>
            ))}
          </aside>
          <div className="manager-body homepage-fields">
            <div className="designer-heading"><p className="eyebrow">{active.page}</p><h3>{active.label}</h3><span>Edit text and image, or ask AI to create either one.</span></div>
            {notice && <div className="notice compact">{notice}</div>}
            {error && <div className="form-error">{error}</div>}
            {active.eyebrow && <label>Eyebrow<input value={form[active.eyebrow]} onChange={(e) => update(active.eyebrow, e.target.value)} /></label>}
            <label>Title<textarea required rows="3" value={form[active.title]} onChange={(e) => update(active.title, e.target.value)} /></label>
            <label>Content<textarea rows="5" value={form[active.body]} onChange={(e) => update(active.body, e.target.value)} /></label>
            {active.key === "contact" && <label>Contact email<input required type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} /></label>}
            <button type="button" className="ai-button designer-action" onClick={rewriteSection} disabled={Boolean(busy)}><Sparkles /> {busy === "rewrite" ? "Rewriting…" : "Rewrite this block with AI"}</button>
            <label>AI image instructions<input value={imagePrompts[active.key] || ""} onChange={(e) => setImagePrompts((old) => ({ ...old, [active.key]: e.target.value }))} placeholder={`Describe the image for ${active.label}`} /></label>
            <div className="designer-image-actions">
              <label className="upload-button"><Upload /> {busy === "upload" ? "Uploading…" : "Upload image"}<input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => uploadImage(e.target.files?.[0])} /></label>
              <button type="button" className="ai-button" onClick={generateImage} disabled={Boolean(busy)}><ImagePlus /> {busy === "image" ? "Generating…" : "Generate image with AI"}</button>
            </div>
            {form[active.image] && <div className="homepage-image"><img src={form[active.image]} alt={`${active.label} preview`} /><button type="button" onClick={() => update(active.image, "")}><X /> Remove</button></div>}
          </div>
        </div>
        <footer><span>Changes remain private until you save.</span><button className="button primary" disabled={Boolean(busy)}><Save /> {busy === "save" ? "Saving…" : "Save page design"}</button></footer>
      </form>
    </div>
  );
}

function AiSettings({ token, onClose }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const auth = { Authorization: `Bearer ${token}` };
  useEffect(() => {
    request("/api/admin/ai-settings", { headers: auth }).then(setForm).catch((e) => setError(e.message));
  }, []);
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const data = await request("/api/admin/ai-settings", {
        method: "PUT", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      setForm(data); setNotice("AI model defaults saved. Authors will use the new default immediately.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return (
    <div className="editor-overlay">
      <form className="editor ai-settings-panel" onSubmit={save}>
        <header><div><p className="eyebrow">Administration</p><h2>AI model settings</h2></div><button type="button" onClick={onClose}><X /></button></header>
        <div className="manager-body">
          <p>Choose the models used by the CMS. Authors can see their assigned model but cannot change it.</p>
          {notice && <div className="notice compact">{notice}</div>}
          {error && <div className="form-error">{error}</div>}
          {form && <div className="settings-grid">
            <label>Admin writing model<select value={form.adminTextModel} onChange={(e) => setForm((old) => ({ ...old, adminTextModel: e.target.value }))}>{form.textModels.map((model) => <option value={model.id} key={model.id}>{model.label}</option>)}</select><small>Used when an Admin rewrites posts or page blocks.</small></label>
            <label>Default Author writing model<select value={form.authorTextModel} onChange={(e) => setForm((old) => ({ ...old, authorTextModel: e.target.value }))}>{form.textModels.map((model) => <option value={model.id} key={model.id}>{model.label}</option>)}</select><small>Automatically enforced for every Author account.</small></label>
            <label>Image generation model<select value={form.imageModel} onChange={(e) => setForm((old) => ({ ...old, imageModel: e.target.value }))}>{form.imageModels.map((model) => <option value={model.id} key={model.id}>{model.label}</option>)}</select><small>Used for article covers and every Page Designer block.</small></label>
          </div>}
        </div>
        <footer><button type="button" className="button secondary light" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy || !form}><Save /> {busy ? "Saving…" : "Save AI settings"}</button></footer>
      </form>
    </div>
  );
}

function MessageManager({ token, onClose }) {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const auth = { Authorization: `Bearer ${token}` };
  function load() { request("/api/admin/messages", { headers: auth }).then(setMessages).catch((e) => setError(e.message)); }
  useEffect(load, []);
  async function markRead(id) {
    try { await request(`/api/admin/messages/${id}/read`, { method: "PUT", headers: auth }); load(); }
    catch (e) { setError(e.message); }
  }
  return (
    <div className="editor-overlay">
      <section className="editor manager-panel">
        <header><div><p className="eyebrow">Reader conversations</p><h2>Messages</h2></div><button onClick={onClose}><X /></button></header>
        <div className="manager-body message-list">
          {error && <div className="form-error">{error}</div>}
          {!messages.length && <p>No reader messages yet.</p>}
          {messages.map((item) => (
            <article className={item.isRead ? "read" : "unread"} key={item.id}>
              <div><b>{item.viewerName}</b><a href={`mailto:${item.viewerEmail}`}>{item.viewerEmail}</a><small>{new Date(item.createdAt).toLocaleString("en-IN")}</small></div>
              <h3>{item.postTitle}</h3><p>{item.message}</p>
              {!item.isRead && <button className="button secondary light" onClick={() => markRead(item.id)}>Mark as read</button>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PostEditor({ post, token, role, onClose, onSaved }) {
  const [form, setForm] = useState({ ...post, keywords: Array.isArray(post.keywords) ? post.keywords.join(", ") : post.keywords || "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [rewritePreview, setRewritePreview] = useState(null);
  const [rewriteMode, setRewriteMode] = useState("deep");
  const [useResearch, setUseResearch] = useState(true);
  const [aiProgress, setAiProgress] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [error, setError] = useState("");
  const auth = { Authorization: `Bearer ${token}` };
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  useEffect(() => {
    request("/api/admin/ai-settings", { headers: auth })
      .then((data) => setAiModel(data.effectiveTextModel))
      .catch(() => setAiModel(""));
  }, []);
  async function uploadImage(file) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("image", file);
      const data = await request("/api/admin/upload", {
        method: "POST",
        headers: auth,
        body,
      });
      update("coverImage", data.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const isExisting = Boolean(form.id);
      await request(
        isExisting ? `/api/admin/posts/${form.id}` : "/api/admin/posts",
        {
          method: isExisting ? "PUT" : "POST",
          headers: { ...auth, "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function regenerate() {
    if (!form.id) {
      update("generateImage", true);
      return;
    }
    setBusy(true);
    setError("");
    setAiProgress("Starting high-quality cover generation…");
    try {
      const job = await request(
        `/api/admin/posts/${form.id}/generate-image`,
        {
          method: "POST",
          headers: { ...auth, "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: form.imageAlt || form.excerpt }),
        },
      );
      const result = await waitForAiJob(job.jobId, token, setAiProgress);
      setForm((old) => ({ ...old, coverImage: result.image, generateImage: false }));
      setAiProgress("High-quality cover generated. Save the post to keep it.");
    } catch (e) {
      setError(e.message);
      setAiProgress("");
    } finally {
      setBusy(false);
    }
  }
  async function rewriteWithAi() {
    if (!form.excerpt.trim() && !form.content.trim()) {
      setError("Add a short introduction or article content first.");
      return;
    }
    setRewriting(true);
    setError("");
    setRewritePreview(null);
    setAiProgress(
      rewriteMode === "deep"
        ? "Analysing the author's intent and starting research…"
        : "Starting a quick editorial polish…",
    );
    try {
      const job = await request("/api/admin/rewrite", {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          excerpt: form.excerpt,
          content: form.content,
          rewriteMode,
          useResearch,
        }),
      });
      const rewritten = await waitForAiJob(job.jobId, token, setAiProgress);
      setRewritePreview(rewritten);
      setAiProgress("Rewrite ready for your review.");
    } catch (e) {
      setError(e.message);
      setAiProgress("");
    } finally {
      setRewriting(false);
    }
  }
  function acceptRewrite() {
    if (!rewritePreview) return;
    setForm((old) => ({
      ...old,
      excerpt: rewritePreview.excerpt,
      content: rewritePreview.content,
    }));
    setRewritePreview(null);
  }
  return (
    <div className="editor-overlay">
      <form className="editor" onSubmit={save}>
        <header>
          <div>
            <p className="eyebrow">{form.id ? "Modify post" : "Create post"}</p>
            <h2>{form.id ? form.title || "Untitled post" : "New story"}</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X />
          </button>
        </header>
        <div className="editor-grid">
          <div className="editor-main">
            <label>
              Post title
              <input
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                onBlur={() =>
                  !form.slug &&
                  update(
                    "slug",
                    form.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  )
                }
              />
            </label>
            <label>
              URL slug
              <div className="slug-field">
                <span>/journal/</span>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => update("slug", e.target.value)}
                />
              </div>
            </label>
            <label>
              Short introduction
              <textarea
                rows="3"
                value={form.excerpt}
                onChange={(e) => update("excerpt", e.target.value)}
              />
            </label>
            <label>
              Article content
              <textarea
                className="content-editor"
                required
                rows="14"
                value={form.content}
                onChange={(e) => update("content", e.target.value)}
                placeholder="Write the story here. Use a blank line between paragraphs."
              />
            </label>
            {rewritePreview && (
              <section className="rewrite-preview">
                <div>
                  <p className="eyebrow">AI rewrite preview</p>
                  <h3>Review before using</h3>
                  <span>Your post has not been changed yet.</span>
                </div>
                {rewritePreview.intentSummary && (
                  <div className="rewrite-insight">
                    <b>What AI understood the author wants to say</b>
                    <p>{rewritePreview.intentSummary}</p>
                  </div>
                )}
                <label>
                  Rewritten short introduction
                  <textarea rows="4" readOnly value={rewritePreview.excerpt} />
                </label>
                <label>
                  Rewritten article
                  <textarea rows="12" readOnly value={rewritePreview.content} />
                </label>
                {rewritePreview.researchNotes && (
                  <div className="rewrite-insight">
                    <b>Research notes</b>
                    <p>{rewritePreview.researchNotes}</p>
                  </div>
                )}
                {Boolean(rewritePreview.sources?.length) && (
                  <div className="research-sources">
                    <b>Sources checked</b>
                    {rewritePreview.sources.map((source, index) => (
                      <a href={source.url} target="_blank" rel="noreferrer" key={`${source.url}-${index}`}>
                        {source.title || source.url}
                      </a>
                    ))}
                  </div>
                )}
                <div className="rewrite-actions">
                  <button
                    type="button"
                    className="button secondary light"
                    onClick={() => setRewritePreview(null)}
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    className="button primary"
                    onClick={acceptRewrite}
                  >
                    Use this rewrite
                  </button>
                </div>
              </section>
            )}
          </div>
          <aside className="editor-side">
            <div className="media-box">
              {form.coverImage ? (
                <>
                  <img src={`${API}${form.coverImage}`} alt="Current cover" />
                  <button
                    type="button"
                    className="remove-media"
                    onClick={() => update("coverImage", "")}
                  >
                    <X /> Remove
                  </button>
                </>
              ) : (
                <div>
                  <ImagePlus />
                  <b>No cover image</b>
                  <span>Upload one or let AI create it.</span>
                </div>
              )}
            </div>
            <label className="upload-button">
              <Upload /> {uploading ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={(e) => uploadImage(e.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              className="ai-button"
              onClick={regenerate}
              disabled={busy}
            >
              <Sparkles />{" "}
              {form.id ? "Generate AI cover" : "Generate AI cover on save"}
            </button>
            <button
              type="button"
              className="ai-button rewrite-button"
              onClick={rewriteWithAi}
              disabled={rewriting || busy || (!form.excerpt.trim() && !form.content.trim())}
            >
              <Sparkles /> {rewriting ? "Rewriting post…" : "Rewrite text with AI"}
            </button>
            <label className="rewrite-mode">
              Rewrite depth
              <select value={rewriteMode} onChange={(e) => setRewriteMode(e.target.value)} disabled={rewriting}>
                <option value="deep">Deep research & rewrite</option>
                <option value="quick">Quick polish</option>
              </select>
            </label>
            {rewriteMode === "deep" && (
              <label className="checkbox research-toggle">
                <input type="checkbox" checked={useResearch} onChange={(e) => setUseResearch(e.target.checked)} disabled={rewriting} />
                Research trusted web sources
              </label>
            )}
            <p className="ai-helper">
              Optional. Review the rewrite before applying it. AI work continues as a background job, so slow research or image generation will not cause a browser timeout.
              {aiModel && <> Model: <b>{aiModel}</b>{role === "author" ? " · selected by Admin" : ""}.</>}
            </p>
            {aiProgress && <p className="ai-progress" role="status">{aiProgress}</p>}
            {!form.coverImage && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.generateImage}
                  onChange={(e) => update("generateImage", e.target.checked)}
                />
                Automatically generate if no image
              </label>
            )}
            <label>
              Image description
              <input
                value={form.imageAlt}
                onChange={(e) => update("imageAlt", e.target.value)}
                placeholder="Describe the image"
              />
            </label>
            <label>
              Category
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              >
                <option>Journal</option>
                <option>Books</option>
                <option>Theatre</option>
                <option>Culture</option>
                <option>AI Lab</option>
                <option>Events</option>
              </select>
            </label>
            <label>
              Related search keywords
              <textarea rows="3" value={form.keywords} onChange={(e) => update("keywords", e.target.value)} placeholder="Rajasthani proverb, Marwari culture, Rajasthan literature" />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            {role === "admin" && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => update("featured", e.target.checked)}
                />
                Feature on homepage
              </label>
            )}
          </aside>
        </div>
        {error && <div className="form-error">{error}</div>}
        <footer>
          <button
            type="button"
            className="button secondary light"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button primary" disabled={busy || uploading}>
            <Save /> {busy ? "Saving…" : "Save post"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
  if (path === "/admin") return <Admin />;
  if (path === "/signin") return <AuthPage mode="signin" />;
  if (path === "/signup") return <AuthPage mode="signup" />;
  if (path.startsWith("/journal/"))
    return <Article slug={decodeURIComponent(path.split("/")[2])} />;
  if (path === "/journal") return <Journal />;
  if (path === "/videos") return <VideosPage />;
  if (path === "/know-india") return <KnowMyIndia />;
  return <Home />;
}

createRoot(document.getElementById("root")).render(<App />);
