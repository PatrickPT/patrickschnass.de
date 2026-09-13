/* Homepage only. Loaded after common.js (booking/email links, nav, menus, to-top). */

const waysCode = [
  `<span class="cm"># 01 workshop</span>
priorities = <span class="fn">workshop</span>(leadership)
roadmap    = <span class="fn">align</span>(priorities)`,
  `<span class="cm"># 02 field work</span>
found = <span class="fn">assess</span>(processes, org)
plan  = <span class="fn">comply</span>(found, eu_ai_act)`,
  `<span class="cm"># 03 build &amp; ship</span>
agent = <span class="fn">factory</span>.<span class="fn">build</span>(spec)
agent.<span class="fn">ship</span>(reusable=<span class="kw">True</span>)`,
];

/* ---------- Service card icons (white line art over wave crops) ---------- */
const lineIcon = (paths) =>
  `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const serviceIcons = [
  // Strategy & Impact: compass
  lineIcon(`<circle cx="24" cy="24" r="20"/><path d="M31 17l-4.5 9.5L17 31l4.5-9.5z"/><circle cx="24" cy="24" r="1.2" fill="currentColor"/>`),
  // Organisation & Governance: shield with check
  lineIcon(`<path d="M24 5l15 6v11c0 10-6.5 17-15 21C15.5 39 9 32 9 22V11z"/><path d="M17 24l5 5 9-10"/>`),
  // Software Engineering: cube
  lineIcon(`<path d="M24 5l17 9.5v19L24 43 7 33.5v-19z"/><path d="M7 14.5L24 24l17-9.5M24 24v19"/>`),
];

const i18n = {
  en: {
    "hero.prefix": "AI",
    "hero.typed": [
      "AI is only as good as its foundation",
      "AI without data is just a demo",
      "AI that doesn't scale gets expensive",
      "AI pilots are cheap. Production isn't.",
      "AI needs orchestration, not hype",
    ],
    "hero.lead": "Most AI projects don't fail because the model is wrong. They fail because the foundation isn't there - data isn't owned, processes aren't in place, and nobody planned what happens after the demo. I help fix that before it gets expensive.",
    "cta.book": "Book a free call",
    proof: ["Foundation first", "Impact over hype", "No vendor lock-in", "Compliant by design", "Production, not demos", "Built for handover", "People before models"],
    "svc.tag": "What I offer",
    "svc.title": "Strategy. Organisation. Engineering.",
    "svc.sub": "Delivered as workshops or hands-on field work - from the first assessment to systems running in production.",
    "svc.cta": "Learn more",
    services: [
      ["AI Strategy & Impact", "Where does AI actually pay off? I assess your processes, sharpen the strategy and put a number on the impact - including where agents can take over real workflows.", ["Process assessment", "AI strategy", "AI impact advisory", "Agentic automation strategy"]],
      ["Organisation & Governance", "AI only sticks if the organisation carries it. Team structure, culture and adoption - and conformity with the EU AI Act from day one.", ["AI org strategy", "AI culture advisory", "EU AI Act conformity"]],
      ["Software Engineering", "Sometimes you need someone to actually build it. Agents, ML models and automation - spec-driven, reusable and integrated into your architecture, not a one-off nobody can maintain.", ["AI agents", "Machine learning", "Automation"]],
    ],
    "ways.tag": "How we work together",
    "ways.title": "Workshop → Field work → Production",
    "ways.sub": "Three ways to work together - we start where you are.",
    "ways.covers": "Covers",
    ways: [
      ["Workshop", "Align leadership and teams, prioritise use cases and leave with a roadmap everyone backs.", "AI Strategy & Impact · Organisation & Governance"],
      ["Field work", "On site with your teams: assess processes, organisation and compliance where the work actually happens.", "AI Strategy & Impact · Organisation & Governance"],
      ["Build & Ship", "Hands-on delivery into production - agents, ML and automation that keep running after the first version.", "Software Engineering"],
    ],
    "prompter.title": "Worth a<br>conversation?",
    "prompter.text": "If you're working through a data or AI problem and want a second opinion from someone who's been in the weeds on it - feel free to reach out.",
    "about.title": "Hi, I'm Patrick",
    "about.p1": "I started in consulting and moved into machine learning by solving actual business problems with algorithms. My background in economics has been useful - I tend to think about data and models in terms of what decision they're supposed to improve, not as technology for its own sake.",
    "about.p2": "I lead the Data Science & AI team at a global tech company, where we build ML, GenAI, and Agentic AI products in production. What that work has taught me is that the model is rarely the hard part. The foundation is - data pipelines, integration into existing systems, and the organisational capability to keep shipping after the first version.",
    "about.p3": "Occasionally I work with other companies on exactly those problems.",
    "timeline.head": "From data science to AI advisory",
    timeline: [
      ["Data Scientist", ["Churn model → +10% campaign take rate", "Handset forecast → +10% working capital efficiency"]],
      ["Head of Deep Insights", ["Grew DS function, tech lead across agile squads", "Analytics architect for the big data platform"]],
      ["Head of Data Science & AI", ["Led 20+ person unit: ML, GenAI & Agentic AI", "ML platform, MLOps & LLMOps architecture", "Agentic AI shipped to production in the cloud"]],
      ["AI Advisor", ["Bringing scalable AI strategy to your company"], "offer"],
    ],
  },
  de: {
    "hero.prefix": "KI",
    "hero.typed": [
      "KI ist bedeutungslos ohne Fundament",
      "KI ohne Daten ist nur eine Demo",
      "KI, die nicht skaliert, ist teuer",
      "KI-Piloten sind günstig. Produktion nicht.",
      "KI braucht Orchestrierung, keinen Hype",
    ],
    "hero.lead": "Die meisten KI-Projekte scheitern nicht, weil die Technologie falsch ist. Sie scheitern, weil das Fundament fehlt - Daten sind nicht verfügbar, Prozesse nicht etabliert, und niemand hat geplant, was nach der Demo passiert. Ich helfe dabei, Lösungen zu designen, bevor es teuer wird.",
    "cta.book": "Termin buchen",
    proof: ["Fundament zuerst", "Impact statt Hype", "Kein Vendor Lock-In", "Compliance by Design", "Produktion, keine Demos", "Gebaut für die Übergabe", "Menschen vor Modellen"],
    "svc.tag": "Was ich anbiete",
    "svc.title": "Strategie. Organisation. Engineering.",
    "svc.sub": "Als Workshop oder Feldarbeit - von der ersten Bestandsaufnahme bis zu Systemen, die produktiv laufen.",
    "svc.cta": "Mehr erfahren",
    services: [
      ["KI-Strategie & Impact", "Wo zahlt sich KI wirklich aus? Ich analysiere Ihre Prozesse, schärfe die Strategie und beziffere den Impact - inklusive der Frage, wo Agenten echte Workflows übernehmen können.", ["Prozessanalyse", "KI-Strategie", "KI-Impact-Beratung", "Strategie für agentische Automatisierung"]],
      ["Organisation & Governance", "KI wirkt nur, wenn die Organisation sie trägt. Teamstruktur, Kultur und Adoption - und Konformität mit dem EU AI Act von Anfang an.", ["KI-Organisationsstrategie", "KI-Kulturberatung", "EU-AI-Act-Konformität"]],
      ["Software-Engineering", "Manchmal braucht es jemanden, der es baut. Agenten, ML-Modelle und Automatisierung - spezifikationsgetrieben, wiederverwendbar und in Ihre Architektur integriert, keine Einmal-Demo.", ["KI-Agenten", "Machine Learning", "Automatisierung"]],
    ],
    "ways.tag": "Wie wir zusammenarbeiten",
    "ways.title": "Workshop → Feldarbeit → Produktion",
    "ways.sub": "Drei Formate der Zusammenarbeit - wir starten dort, wo Sie stehen.",
    "ways.covers": "Deckt ab",
    ways: [
      ["Workshop", "Führung und Teams ausrichten, Use Cases priorisieren und mit einer Roadmap rausgehen, hinter der alle stehen.", "KI-Strategie & Impact · Organisation & Governance"],
      ["Feldarbeit", "Vor Ort mit Ihren Teams: Prozesse, Organisation und Compliance dort analysieren, wo die Arbeit wirklich passiert.", "KI-Strategie & Impact · Organisation & Governance"],
      ["Bauen & Ausliefern", "Hands-on bis in die Produktion - Agenten, ML und Automatisierung, die auch nach der ersten Version weiterlaufen.", "Software-Engineering"],
    ],
    "prompter.title": "Klingt nach einem<br>Gespräch?",
    "prompter.text": "Wenn Sie an einem Daten- oder KI-Thema arbeiten und eine ehrliche zweite Meinung suchen, melden Sie sich gerne.",
    "about.title": "Hallo, ich bin Patrick",
    "about.p1": "Ich komme aus der IT-Beratung und bin ins Machine-Learning-Umfeld gewachsen. Mein wirtschaftswissenschaftlicher Hintergrund hilft dabei - ich denke über Daten und Modelle immer in dem Sinne, welche Entscheidung sie eigentlich verbessern sollen.",
    "about.p2": "Aktuell leite ich das Data Science & AI Team bei einem globalen Technologieunternehmen, wo wir ML-, GenAI- und Agentic-AI-Produkte bauen, die produktiv laufen. Was ich dabei gelernt habe: Das Modell ist selten das eigentliche Problem. Das Fundament ist es - Datenpipelines, Integration in bestehende Systeme und die organisatorische Fähigkeit, auch nach der ersten Version weiter auszuliefern.",
    "about.p3": "Gelegentlich berate ich andere Unternehmen bei genau diesen Themen.",
    "timeline.head": "Von Data Science zur KI-Beratung",
    timeline: [
      ["Data Scientist", ["Churn-Modell → +10 % Campaign Take Rate", "Handset-Prognose → +10 % Working-Capital-Effizienz"]],
      ["Head of Deep Insights", ["DS-Funktion aufgebaut, Tech Lead in agilen Squads", "Analytics-Architekt für die Big-Data-Plattform"]],
      ["Head of Data Science & AI", ["20+ köpfige Einheit: ML, GenAI & Agentic AI", "ML-Plattform, MLOps & LLMOps-Architektur", "Agentic AI produktiv in der Cloud"]],
      ["KI-Berater", ["Skalierbare KI-Strategie für Ihr Unternehmen"], "offer"],
    ],
  },
};

// Hugo renders "/" (en) and "/de/" (de) and stamps the language on <html>.
let lang = document.documentElement.lang === "de" ? "de" : "en";
const t = (k) => i18n[lang][k];

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const proofIcon = '<svg width="14" height="14" viewBox="0 0 22 22" aria-hidden="true"><path d="M11 1 L13 9 L21 11 L13 13 L11 21 L9 13 L1 11 L9 9 Z" fill="currentColor"/></svg>';
// Subpage URLs come from Hugo, ordered by service weight (same order as i18n services).
// Attribute is data-pages, not data-urls: Go templates URL-escape attributes whose name contains "url".
const serviceUrls = JSON.parse(document.getElementById("slider-track").dataset.pages || "[]");

/* ---------- Language-dependent blocks ---------- */
function renderProof() {
  // Repeat once so even very wide screens never show a gap in the loop.
  const items = [...t("proof"), ...t("proof")];
  const seq = items.map((p) => `<span class="proof">${escapeHtml(p)}</span>`).join(proofIcon);
  document.getElementById("proof-track").innerHTML =
    `<div class="logo-bar__seq">${seq}${proofIcon}</div><div class="logo-bar__seq" aria-hidden="true">${seq}${proofIcon}</div>`;
}

function renderServices() {
  document.getElementById("slider-track").innerHTML = t("services").map(([name, intro, tags], i) => `
    <article class="wcard">
      <div class="wcard__img wcard__img--${i}">${serviceIcons[i]}</div>
      <div class="wcard__body">
        <h3 class="wcard__name">${escapeHtml(name)}</h3>
        <p class="wcard__desc">${escapeHtml(intro)}</p>
        <ul class="wcard__tags">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>
        <a class="cta cta--light" href="${serviceUrls[i]}">${escapeHtml(t("svc.cta"))}</a>
      </div>
    </article>`).join("");
  updateSliderBar();
}

function renderWays() {
  document.getElementById("ways-rail").innerHTML = t("ways").map(([name, desc, covers], i) => `
    <article class="way${i === 0 ? " is-open" : ""}">
      <h3 class="way__head">
        <button class="way__toggle" aria-expanded="${i === 0}" aria-controls="way-body-${i}">
          <span class="way__num">0${i + 1}</span>
          <span class="way__name">${escapeHtml(name)}</span>
          <span class="way__chevron" aria-hidden="true"></span>
        </button>
      </h3>
      <div class="way__body" id="way-body-${i}">
        <div class="way__inner">
          <pre class="way__code"><code>${waysCode[i]}</code></pre>
          <div class="way__detail">
            <p class="way__desc">${escapeHtml(desc)}</p>
            <p class="way__covers"><span>${escapeHtml(t("ways.covers"))}</span>${escapeHtml(covers)}</p>
          </div>
        </div>
      </div>
    </article>`).join("");
}

function setWayOpen(way, open) {
  way.classList.toggle("is-open", open);
  way.querySelector(".way__toggle").setAttribute("aria-expanded", String(open));
}

// One panel open at a time: accordion on phones, pinned-open panel on desktop.
document.getElementById("ways-rail").addEventListener("click", (e) => {
  const toggle = e.target.closest(".way__toggle");
  if (!toggle) return;
  const way = toggle.closest(".way");
  const willOpen = !way.classList.contains("is-open");
  document.querySelectorAll(".way").forEach((w) => setWayOpen(w, false));
  if (willOpen) setWayOpen(way, true);
});

function renderTimeline() {
  document.getElementById("timeline").innerHTML = t("timeline").map(([title, bullets, kind]) => {
    const content = `<p class="tnode__title">${escapeHtml(title)}</p><ul>${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`;
    const offer = `<div class="tnode__card">${content}<a class="cta cta--dark tnode__cta" data-book>${escapeHtml(t("cta.book"))}</a></div>`;
    return `<li class="tnode${kind ? " tnode--" + kind : ""}"><span class="tnode__dot" aria-hidden="true"></span>${kind === "offer" ? offer : content}</li>`;
  }).join("");
}

// Same px/s for every marquee regardless of content length, so slow tracks don't look steppy.
function setMarqueeSpeeds() {
  [["proof-track", 45]].forEach(([id, pxPerSec]) => {
    const track = document.getElementById(id);
    const seq = track.firstElementChild;
    if (seq) track.style.animationDuration = `${seq.getBoundingClientRect().width / pxPerSec}s`;
  });
}

const motionIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => e.target.classList.toggle("is-offscreen", !e.isIntersecting));
});
document.querySelectorAll(".logo-bar").forEach((el) => motionIO.observe(el));

function applyLang(next) {
  lang = next;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-typing="1"]').forEach((el) => { el.dataset.typing = "0"; });
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = t(el.dataset.i18n);
    if (typeof v === "string") el.textContent = v;
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  renderProof();
  renderServices();
  renderWays();
  renderTimeline();
  wireBookingLinks();
  wireEmailLinks();
  setMarqueeSpeeds();
  restartTyper();
}

/* ---------- Hero typewriter ---------- */
const typerEl = document.getElementById("hero-typer");
let typerTimer;
// Lock the headline to its tallest message at the current width so typing never shifts the page.
function reserveTitleHeight() {
  const title = document.getElementById("hero-title");
  const prefix = t("hero.prefix");
  const current = typerEl.textContent;
  title.style.minHeight = "";
  let tallest = 0;
  for (const m of t("hero.typed")) {
    typerEl.textContent = m.slice(prefix.length);
    tallest = Math.max(tallest, title.offsetHeight);
  }
  typerEl.textContent = current;
  title.style.minHeight = `${tallest}px`;
}

function restartTyper() {
  clearTimeout(typerTimer);
  const prefix = t("hero.prefix");
  const messages = t("hero.typed");
  const words = messages.map((m) => m.slice(prefix.length));
  reserveTitleHeight();
  document.getElementById("hero-title").setAttribute("aria-label", messages[0]);
  if (reduceMotion) { typerEl.textContent = words[0]; return; }
  let w = 0, c = words[0].length, deleting = false;
  const tick = () => {
    const word = words[w];
    c += deleting ? -1 : 1;
    typerEl.textContent = word.slice(0, c);
    let delay = deleting ? 28 : 65;
    if (!deleting && c === word.length) { deleting = true; delay = 2800; }
    else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 400; }
    typerTimer = setTimeout(tick, delay);
  };
  typerEl.textContent = words[0];
  deleting = true;
  typerTimer = setTimeout(tick, 3200);
}

/* ---------- Section titles typed on view ---------- */
function typeOnce(el) {
  if (reduceMotion) return;
  const full = el.textContent;
  let i = 0;
  el.dataset.typing = "1";
  const step = () => {
    if (el.dataset.typing !== "1") return;
    el.textContent = full.slice(0, ++i);
    if (i < full.length) setTimeout(step, 55);
    else el.dataset.typing = "0";
  };
  el.textContent = "";
  step();
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    typeOnce(e.target);
    io.unobserve(e.target);
  });
}, { threshold: 0.5 });

/* ---------- Slider: drag + progress bar ---------- */
const slider = document.getElementById("slider");
const thumb = document.getElementById("slider-thumb");
function updateSliderBar() {
  const { scrollLeft, scrollWidth, clientWidth } = slider;
  const bar = thumb.parentElement.clientWidth;
  const width = Math.max((clientWidth / scrollWidth) * bar, 40);
  const max = scrollWidth - clientWidth;
  thumb.style.width = width + "px";
  thumb.style.transform = `translateX(${max > 0 ? (scrollLeft / max) * (bar - width) : 0}px)`;
}
slider.addEventListener("scroll", updateSliderBar, { passive: true });
window.addEventListener("resize", updateSliderBar);

const trackPad = () => parseFloat(getComputedStyle(slider.firstElementChild).paddingLeft);

let drag = null;
slider.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse" || slider.scrollWidth <= slider.clientWidth) return;
  drag = { x: e.clientX, left: slider.scrollLeft, moved: false };
});
window.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (Math.abs(dx) > 4) { drag.moved = true; slider.classList.add("is-dragging"); }
  slider.scrollLeft = drag.left - dx;
});
window.addEventListener("pointerup", () => {
  if (!drag) return;
  const moved = drag.moved;
  drag = null;
  slider.classList.remove("is-dragging");
  if (moved) {
    const cards = [...slider.querySelectorAll(".wcard")];
    const pad = trackPad();
    const nearest = cards.reduce((a, c) => Math.abs(c.offsetLeft - pad - slider.scrollLeft) < Math.abs(a.offsetLeft - pad - slider.scrollLeft) ? c : a);
    slider.scrollTo({ left: nearest.offsetLeft - pad, behavior: "smooth" });
  }
});

/* ---------- Closing: "Stop experimenting" decodes into the name ---------- */
const closing = document.getElementById("closing");
const decodeEl = document.getElementById("decode-text");
const ccta = document.getElementById("closing-cta");
const DECODE_FROM = "STOP EXPERIMENTING";
const DECODE_TO = "PATRICK SCHNASS";
const LAST_NAME_AT = DECODE_TO.indexOf("SCHNASS");
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
let lastDecodeHtml = "";

// q 0→1: each character flips from the statement, through random glyphs, to the name, left to right.
function decodeHtml(q) {
  const len = Math.max(DECODE_FROM.length, DECODE_TO.length);
  const tick = Math.floor(q * 90);
  let before = "", lastName = "", rest = "";
  for (let i = 0; i < len; i++) {
    const start = (i / len) * 0.6;
    const resolved = q >= start + 0.4;
    let ch;
    if (q <= start) ch = DECODE_FROM[i] ?? "";
    else if (resolved) ch = DECODE_TO[i] ?? "";
    else ch = GLYPHS[(tick * 7 + i * 13) % GLYPHS.length];
    // Resolved letters of the last name form a contiguous run, so they can share one gradient <em>.
    if (i >= LAST_NAME_AT && resolved && i < DECODE_TO.length && !rest) lastName += ch;
    else if (i >= LAST_NAME_AT) rest += ch;
    else before += ch;
  }
  return escapeHtml(before) + (lastName ? `<em>${escapeHtml(lastName)}</em>` : "") + escapeHtml(rest);
}

function updateClosing() {
  const rect = closing.getBoundingClientRect();
  const p = reduceMotion ? 1 : clamp(-rect.top / (rect.height - innerHeight));
  const sweep = seg(p, 0.62, 0.8);
  const c = seg(p, 0.72, 0.86);

  const html = decodeHtml(seg(p, 0.12, 0.62));
  if (html !== lastDecodeHtml) { decodeEl.innerHTML = html; lastDecodeHtml = html; }
  decodeEl.style.setProperty("--sweep", sweep.toFixed(3));
  decodeEl.style.transform = `scale(${1 + sweep * 0.04})`;
  ccta.style.opacity = String(c);
  ccta.style.transform = `translate(-50%, ${20 * (1 - c)}px)`;
  ccta.classList.toggle("is-visible", c > 0.5);
}
window.addEventListener("scroll", updateClosing, { passive: true });
window.addEventListener("resize", updateClosing);

/* ---------- Init ---------- */
applyLang(lang);
document.querySelectorAll(".type-on-view").forEach((el) => io.observe(el));
document.fonts.ready.then(() => { setMarqueeSpeeds(); reserveTitleHeight(); });
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { reserveTitleHeight(); setMarqueeSpeeds(); }, 150);
});
updateClosing();
