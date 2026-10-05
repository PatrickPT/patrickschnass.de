const BOOKING_URL = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1Tu_t7zHJhBQ0eZZWjj4bmS5ls6jNCP8gsU25eIOwKL2pT9dbZbpyXyrYJEsqIH2DKNXuHS6wB?gv=true";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function wireBookingLinks(root = document) {
  root.querySelectorAll("[data-book]").forEach((a) => {
    a.href = BOOKING_URL;
    a.target = "_blank";
    a.rel = "noopener";
  });
}

// Assembled at runtime so the address never appears as plain text in the HTML.
function wireEmailLinks(root = document) {
  const address = ["p.schnass", "gmail.com"].join("@");
  root.querySelectorAll("[data-email]").forEach((a) => { a.href = `mailto:${address}`; });
}

/* ---------- Analytics (cookieless; a no-op unless [params.analytics] is set) ---------- */
// Never pass answers, figures or anything personal: event names and coarse labels only.
function trackEvent(name, props) {
  try { if (typeof window.plausible === "function") window.plausible(name, props ? { props } : undefined); }
  catch { /* analytics must never break the page */ }
}

// Where on the page a CTA sits: footer, nav, or the id of the closest section (hero = "top").
function ctaWhere(el) {
  if (el.dataset.trackWhere) return el.dataset.trackWhere;
  if (el.closest("footer")) return "footer";
  if (el.closest(".nav, .mobile-menu")) return "nav";
  const id = el.closest("[id]")?.id;
  return id === "top" ? "hero" : id || "page";
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("a, button");
  if (!el) return;
  const where = ctaWhere(el);
  if (el.hasAttribute("data-book")) trackEvent("cta_book", { where, page: location.pathname });
  else if (el.hasAttribute("data-email")) trackEvent("cta_email", { where, page: location.pathname });
  else if (/\/check\/$/.test(el.getAttribute("href") || "")) trackEvent("cta_check", { where, page: location.pathname });
}, { capture: true });

/* ---------- Nav, services menu, mobile menu, to-top (all advisory pages) ---------- */
const nav = document.getElementById("nav");
const totop = document.getElementById("totop");

function updateChrome() {
  const y = window.scrollY;
  nav.classList.toggle("is-solid", y > 40);
  totop.classList.toggle("is-visible", y > 600);
}
window.addEventListener("scroll", updateChrome, { passive: true });
totop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

const sub = document.querySelector(".has-sub");
const subBtn = sub.querySelector("button");
const closeSub = () => { sub.classList.remove("is-open"); subBtn.setAttribute("aria-expanded", "false"); };
subBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = sub.classList.toggle("is-open");
  subBtn.setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", (e) => { if (!sub.contains(e.target)) closeSub(); });

const burger = document.querySelector(".nav__burger");
const mobile = document.getElementById("mobile-menu");
function setMenu(open) {
  mobile.hidden = !open;
  burger.setAttribute("aria-expanded", String(open));
  document.body.style.overflow = open ? "hidden" : "";
}
burger.addEventListener("click", () => setMenu(mobile.hidden));
mobile.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

document.getElementById("year").textContent = new Date().getFullYear();
wireBookingLinks();
wireEmailLinks();
updateChrome();
