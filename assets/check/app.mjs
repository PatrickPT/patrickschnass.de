/*
 * KI-Potenzial-Check: the page. Bundled by Hugo's js.Build and loaded after common.js
 * (booking/e-mail links, nav). Everything is computed here, in the browser; the only request that
 * carries answers is the e-mail form, and only when the visitor submits it.
 */
import { computeResult, encodeState, decodeState, clamp } from "./model.mjs";
import { copy } from "./copy.mjs";
import backOffice from "./packs/back-office-mittelstand.json";

const PACKS = { [backOffice.id]: backOffice };
const MAX_PROCESSES = 5;

const root = document.getElementById("ck-app");
const lang = document.documentElement.lang === "de" ? "de" : "en";
const T = copy[lang];
const pack = PACKS[new URLSearchParams(location.search).get("pack")] ?? backOffice;
const mailer = root.dataset.mailer || ""; // "" = no e-mail form, "mock" = local preview, else the endpoint URL
const permalink = root.dataset.permalink || location.origin + location.pathname;
const privacyUrl = root.dataset.privacy || "/gdpr/";
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Formatting ---------- */
const locale = lang === "de" ? "de-DE" : "en-GB";
const eurFmt = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
// Round to a precision the inputs can carry: estimates in, no fake cents out.
const nice = (v) => { const a = Math.abs(v); const step = a >= 10000 ? 100 : a >= 1000 ? 10 : 1; return Math.round(v / step) * step; };
const eur = (v) => eurFmt.format(nice(v));
const num = (v, d = 0) => new Intl.NumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
const pct = (v) => { const x = v * 100; return num(x, Math.abs(x - Math.round(x)) > 0.001 ? 1 : 0); };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const L = (x) => x?.[lang] ?? "";
// Copy templates may carry markup; the values filled into them never do.
const fill = (tpl, vals) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vals ? esc(vals[k]) : m));
const byId = (list, id) => list.find((x) => x.id === id);
const procOf = (id) => byId(pack.processes, id);

function paybackText(m) {
  if (!Number.isFinite(m)) return T.paybackNever;
  if (m < 1) return T.paybackUnderOne;
  if (m > 36) return T.paybackLong;
  return fill(T.paybackMonths, { n: num(Math.round(m)) });
}

/* ---------- State ---------- */
const fresh = () => ({ step: "intro", detail: 0, industry: null, size: null, guess: null, processes: [], answers: {}, reflections: {}, overrides: {} });
let state = fresh();
let shared = false;
const openDetails = new Set();

const STEPS = ["context", "guess", "processes", "detail", "honest"];

function canContinue() {
  switch (state.step) {
    case "context": return Boolean(state.industry && state.size);
    case "guess": return Boolean(state.guess);
    case "processes": return state.processes.length > 0;
    case "detail": {
      const a = state.answers[state.processes[state.detail]];
      return Number.isFinite(a?.volume) && Number.isFinite(a?.minutes);
    }
    case "honest": return pack.reflections.every((r) => state.reflections[r.id] !== undefined);
    default: return true;
  }
}

function go(step, detail = 0) {
  state.step = step;
  state.detail = detail;
  if (step === "detail") {
    const id = state.processes[detail];
    // Rework and role start on the most common answer so the visitor only has to change what differs.
    state.answers[id] = { rework: "sometimes", role: pack.roles[0].id, lever: {}, volume: null, minutes: null, ...state.answers[id] };
  }
  render();
}

function next() {
  if (!canContinue()) return;
  const { step, detail } = state;
  if (step === "intro") go("context");
  else if (step === "context") go("guess");
  else if (step === "guess") go("processes");
  else if (step === "processes") go("detail", 0);
  else if (step === "detail") detail + 1 < state.processes.length ? go("detail", detail + 1) : go("honest");
  else if (step === "honest") go("calc");
}

function back() {
  const { step, detail } = state;
  if (step === "context") go("intro");
  else if (step === "guess") go("context");
  else if (step === "processes") go("guess");
  else if (step === "detail") detail > 0 ? go("detail", detail - 1) : go("processes");
  else if (step === "honest") go("detail", state.processes.length - 1);
}

/* ---------- Building blocks ---------- */
const chip = (group, value, label, pressed, extra = "") =>
  `<button type="button" class="ck-chip" data-group="${esc(group)}" data-value="${esc(value)}" aria-pressed="${pressed}"${extra}>${label}</button>`;

const chipGroup = (labelId, inner, cls = "") => `<div class="ck-chips ${cls}" role="group" aria-labelledby="${labelId}">${inner}</div>`;

function question(id, label, inner, extraClass = "") {
  return `<div class="ck-qblock ${extraClass}"><p class="ck-qlabel" id="${id}">${label}</p>${inner}</div>`;
}

function frame({ eyebrow, title, lead, body, meter = false }) {
  const phase = STEPS.indexOf(state.step);
  const progress = ((phase + (state.step === "detail" ? (state.detail + 1) / (state.processes.length + 1) : 0.5)) / STEPS.length) * 100;
  const isLast = state.step === "honest";
  return `
    <div class="ck-flow">
      <div class="ck-progress">
        <div class="ck-progress__bar"><span style="width:${progress.toFixed(1)}%"></span></div>
        <p class="ck-progress__label">${esc(fill(T.stepOf, { n: phase + 1, total: STEPS.length }))} · ${esc(T.phases[phase])}</p>
      </div>
      <div class="ck-card">
        ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
        <h2 class="ck-title" tabindex="-1">${esc(title)}</h2>
        ${lead ? `<p class="ck-lead">${lead}</p>` : ""}
        ${body}
        <div class="ck-nav">
          <button type="button" class="cta cta--ghost" data-action="back">← ${esc(T.back)}</button>
          <button type="button" class="cta cta--gradient" data-action="next"${canContinue() ? "" : " disabled"}>${esc(isLast ? T.toResult : T.next)} →</button>
        </div>
        ${state.step === "detail" ? `<p class="ck-hint" data-hint ${canContinue() ? "hidden" : ""}>${esc(T.required)}</p>` : ""}
      </div>
      ${meter ? `<div class="ck-meter" aria-live="polite"><span class="ck-meter__label">${esc(T.meterLabel)}</span><span class="ck-meter__value" data-meter>${eur(0)}</span><span class="ck-meter__unit">${esc(T.meterUnit)}</span><span class="ck-meter__delta" data-delta aria-hidden="true"></span></div>` : ""}
    </div>`;
}

/* ---------- Screens ---------- */
function intro() {
  return `
    <div class="ck-intro">
      <p class="eyebrow">${esc(T.eyebrow)}</p>
      <h1 class="ck-intro__title">${T.introTitle}</h1>
      <p class="ck-intro__lead">${esc(T.introLead)}</p>
      <ul class="ck-badges">${T.badges.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      <button type="button" class="cta cta--gradient ck-start" data-action="next">${esc(T.start)} →</button>
      <figure class="ck-note">
        <img src="/images/patrick-profile.jpg" alt="Patrick Schnaß" width="72" height="72">
        <figcaption>${esc(T.introNote)}</figcaption>
      </figure>
    </div>`;
}

function context() {
  return frame({
    title: T.contextTitle,
    lead: esc(T.contextLead),
    body:
      question("q-ind", esc(T.industry), chipGroup("q-ind", pack.industries.map((x) => chip("industry", x.id, esc(L(x.label)), state.industry === x.id)).join(""))) +
      question("q-size", esc(T.size), chipGroup("q-size", pack.sizes.map((x) => chip("size", x.id, esc(L(x.label)), state.size === x.id)).join(""))),
  });
}

function guess() {
  return frame({
    title: T.guessTitle,
    lead: esc(T.guessLead),
    body: chipGroup("ck-title", pack.guess.map((x) => chip("guess", x.id, esc(L(x.label)), state.guess === x.id)).join(""), "ck-chips--big"),
  });
}

function processes() {
  const n = state.processes.length;
  const cards = pack.processes.map((p) => {
    const on = state.processes.includes(p.id);
    return `<button type="button" class="ck-proc" data-group="proc" data-value="${esc(p.id)}" aria-pressed="${on}">
      <span class="ck-proc__check" aria-hidden="true"></span>
      <span class="ck-proc__name">${esc(L(p.label))}</span>
      <span class="ck-proc__desc">${esc(L(p.desc))}</span>
    </button>`;
  }).join("");
  return frame({
    title: T.processTitle,
    lead: esc(T.processLead),
    body: `<div class="ck-procs" role="group" aria-label="${esc(T.processTitle)}">${cards}</div>
      <p class="ck-count" data-count>${esc(fill(T.processCount, { n }))}${n >= MAX_PROCESSES ? ` · ${esc(T.processMax)}` : ""}</p>`,
  });
}

function detail() {
  const proc = procOf(state.processes[state.detail]);
  const a = state.answers[proc.id];
  const numberChips = (field, options, unit = "") => {
    const custom = Number.isFinite(a[field]) && !options.includes(a[field]);
    return chipGroup(`q-${field}`,
      options.map((v) => chip(field, v, `${num(v)}${unit ? " " + esc(unit) : ""}`, a[field] === v)).join("") +
      `<label class="ck-exact"><span>${esc(T.exact)}</span><input type="number" inputmode="decimal" min="${proc[field].min}" max="${proc[field].max}" data-input="${field}" value="${custom ? a[field] : ""}" aria-label="${esc(field === "volume" ? fill(T.qVolume, { unit: L(proc.unit) }) : T.qMinutes)}"></label>`);
  };
  const lever = proc.lever ? `
    <div class="ck-hidden">
      <p class="ck-hidden__tag">${esc(T.hiddenTag)}</p>
      ${proc.lever.questions.map((q) => question(`q-l-${q.id}`, esc(L(q.label)),
        chipGroup(`q-l-${q.id}`, q.options.map((o) => chip(`lever:${q.id}`, o.id, esc(L(o.label)), a.lever?.[q.id] === o.id)).join("")))).join("")}
    </div>` : "";
  return frame({
    eyebrow: fill(T.detailEyebrow, { n: state.detail + 1, total: state.processes.length }),
    title: L(proc.label),
    lead: `<em>${esc(L(proc.desc))}</em> ${esc(T.detailLead)}`,
    meter: true,
    body:
      question("q-volume", esc(fill(T.qVolume, { unit: L(proc.unit) })), numberChips("volume", proc.volume.options)) +
      question("q-minutes", esc(T.qMinutes), numberChips("minutes", proc.minutes.options, T.minutesUnit)) +
      `<div class="ck-qpair">` +
      question("q-rework", esc(T.qRework), chipGroup("q-rework", pack.rework.map((x) => chip("rework", x.id, esc(L(x.label)), a.rework === x.id)).join(""))) +
      question("q-role", esc(T.qRole), chipGroup("q-role", pack.roles.map((x) => chip("role", x.id, esc(L(x.label)), a.role === x.id)).join(""))) +
      `</div>` + lever,
  });
}

function honest() {
  const rows = pack.reflections.map((r) => `
    <div class="ck-refl">
      <p class="ck-refl__text" id="q-r-${r.id}">${esc(L(r.statement))}</p>
      ${chipGroup(`q-r-${r.id}`, T.scale.map((label, i) => chip(`refl:${r.id}`, i, esc(label), state.reflections[r.id] === i)).join(""), "ck-chips--scale")}
    </div>`).join("");
  return frame({ title: T.honestTitle, lead: esc(T.honestLead), body: `<div class="ck-refls">${rows}</div>` });
}

function calc() {
  return `<div class="ck-calc" role="status">
    <div class="ck-calc__spinner" aria-hidden="true"></div>
    <ul>${T.calcLines.map((l, i) => `<li style="--i:${i}">${esc(l)}</li>`).join("")}</ul>
  </div>`;
}

/* ---------- Result ---------- */
function resultShell() {
  return `
    <div class="ck-print-head">${esc(T.printHead)} · ${esc(new Date().toLocaleDateString(locale))}</div>
    ${shared ? `<div class="ck-shared"><span>${esc(T.resumeShared)}</span><button type="button" class="ck-link" data-action="restart">${esc(T.startOwn)} →</button></div>` : ""}
    <section class="ck-r-hero" id="ck-r-hero"></section>
    <section class="ck-r-costs" id="ck-r-costs"></section>
    <section class="ck-r-score" id="ck-r-score"></section>
    <section class="ck-r-rank">
      <div class="ck-wrap">
        <p class="eyebrow">${esc(T.rankEyebrow)}</p>
        <h2 class="t-section">${esc(T.rankTitle)}</h2>
        <p class="ck-r-lead">${esc(T.rankLead)}</p>
        <div id="ck-r-list" class="ck-r-list"></div>
        <div id="ck-assume"></div>
      </div>
    </section>
    <section class="ck-r-take" id="ck-r-take"></section>
    <section class="ck-r-blind" id="ck-r-blind"></section>
    <section class="ck-r-next" id="ck-r-next"></section>
    <p class="ck-privacy">${esc(T.privacyNote)} <button type="button" class="ck-link" data-action="restart">${esc(T.restart)}</button></p>`;
}

function heroHtml(r) {
  const n = r.processes.length;
  const guessOpt = byId(pack.guess, state.guess);
  const verdict = r.guessVerdict && T.guess[r.guessVerdict]
    ? fill(T.guess[r.guessVerdict], { guess: L(guessOpt?.label), actual: num(Math.round(r.hoursPerWeek)), n })
    : "";
  const tangible = (key, v) => {
    const [value, label, sub] = T.tangibles[key];
    return `<li><strong>${esc(fill(value, { v }))}</strong><span>${esc(label)}</span><small>${esc(sub)}</small></li>`;
  };
  return `
    <div class="ck-r-hero__bg" aria-hidden="true"></div>
    <div class="ck-wrap ck-r-hero__inner">
      <p class="eyebrow">${esc(T.resultEyebrow)}</p>
      <h1 class="ck-r-hero__title">${esc(T.resultTitle)}</h1>
      <p class="ck-big"><span data-count-to="${nice(r.cost)}">${eur(r.cost)}</span> <small>${esc(T.perYear)}</small></p>
      <p class="ck-r-hero__scope">${esc(n === 1 ? T.resultScopeOne : fill(T.resultScope, { n }))}${r.table > 0 ? " " + fill(T.tablePlus, { eur: eur(r.table) }) : ""}</p>
      ${verdict ? `<p class="ck-verdict">${verdict}</p>` : ""}
      <ul class="ck-tangibles">
        ${tangible("fte", num(r.fte, 1))}
        ${tangible("week", num(Math.round(r.hoursPerWeek)))}
        ${tangible("days", num(Math.round(r.workdays)))}
      </ul>
      <div class="cta-row">
        <a class="cta cta--gradient" data-book>${esc(T.ctaBook)}</a>
        ${mailer ? `<button type="button" class="cta cta--ghost" data-action="to-mail">${esc(T.ctaMail)}</button>` : ""}
        <button type="button" class="cta cta--ghost" data-action="print">${esc(T.ctaPdf)}</button>
      </div>
    </div>`;
}

function hiddenHtml(r) {
  const unseen = ["rework", "focus", "talent"].filter((k) => r.layers[k] > 0).map((k) => [k, r.layers[k]]);
  if (r.table > 0) unseen.push(["table", r.table]);
  const unseenSum = unseen.reduce((s, [, v]) => s + v, 0);
  const seg = ([key, v], i) => `<span class="ck-hid__seg ck-hid__seg--${key}" style="flex-grow:${Math.round(v)};--i:${i}"></span>`;
  const group = (label, sum, layers, from) => `
    <div class="ck-hid__group" style="flex-grow:${Math.round(sum)}">
      <p class="ck-hid__head">${esc(label)} <strong>${eur(sum)}</strong></p>
      <div class="ck-hid__bar">${layers.map((l, i) => seg(l, from + i)).join("")}</div>
    </div>`;
  const item = ([key, v], i) => {
    const [name, desc] = T.layers[key];
    return `<li class="ck-hid__item ck-hid__item--${key}" style="--i:${i}">
      <span class="ck-hid__name">${esc(name)}${key === "table" ? ` <em>${esc(T.estimate)}</em>` : ""}</span>
      <strong class="ck-hid__eur">${eur(v)}</strong>
      <span class="ck-hid__desc">${esc(desc)}</span>
    </li>`;
  };
  const all = [["work", r.layers.work], ...unseen];
  return `
    <div class="ck-wrap">
      <p class="eyebrow">${esc(T.hiddenEyebrow)}</p>
      <h2 class="t-section">${esc(T.hiddenTitle)}</h2>
      <p class="ck-r-lead">${esc(T.hiddenLead)}</p>
      <div class="ck-hid" role="img" aria-label="${esc(`${T.seen}: ${eur(r.layers.work)}. ${T.unseen}: ${eur(unseenSum)}.`)}">
        ${group(T.seen, r.layers.work, [["work", r.layers.work]], 0)}
        ${unseen.length ? group(T.unseen, unseenSum, unseen, 1) : ""}
      </div>
      <ul class="ck-hid__legend">${all.map(item).join("")}</ul>
    </div>`;
}

function scoreHtml(r) {
  const arc = Math.PI * 90;
  return `
    <div class="ck-wrap ck-score">
      <div class="ck-gauge" role="img" aria-label="${esc(T.scoreTitle)}: ${r.score}%">
        <svg viewBox="0 0 200 112" aria-hidden="true">
          <defs><linearGradient id="ck-grad" x1="0" x2="1"><stop offset="0" stop-color="#0BB5D6"/><stop offset=".3" stop-color="#6E29DC"/><stop offset=".65" stop-color="#F62ADE"/><stop offset="1" stop-color="#F97725"/></linearGradient></defs>
          <path d="M 10 102 A 90 90 0 0 1 190 102" class="ck-gauge__track"/>
          <path d="M 10 102 A 90 90 0 0 1 190 102" class="ck-gauge__arc" stroke="url(#ck-grad)" style="stroke-dasharray:${arc.toFixed(1)};--off:${(arc * (1 - r.score / 100)).toFixed(1)};--full:${arc.toFixed(1)}"/>
        </svg>
        <span class="ck-gauge__value">${r.score}<small>%</small></span>
      </div>
      <div class="ck-score__text">
        <p class="eyebrow">${esc(T.scoreEyebrow)}</p>
        <h2 class="t-section">${esc(T.scoreTitle)}</h2>
        <p class="ck-r-lead">${fill(T.scoreText, { score: r.score })}</p>
        <details class="ck-how" data-key="score"${openDetails.has("score") ? " open" : ""}>
          <summary>${esc(T.scoreHow)}</summary>
          <p>${esc(fill(T.scoreExplain, { automatable: Math.round(r.automatable * 100), honesty: Math.round(r.honesty * 100) }))}</p>
        </details>
      </div>
    </div>`;
}

function formulaLines(p, a) {
  const f = T.f;
  const role = byId(pack.roles, p.role);
  const lines = [fill(f.time, { volume: num(p.volume), minutes: num(p.minutes), weeks: a.weeksPerYear, h: num(Math.round(p.hoursBase)) })];
  if (p.hoursRework > 0) lines.push(fill(f.rework, { pct: pct(p.reworkShare), h: num(Math.round(p.hoursRework)) }));
  if (p.hoursFocus > 0) lines.push(fill(f.focus, { volume: num(p.volume), pct: pct(p.focusShare), refocus: a.refocusMinutes, weeks: a.weeksPerYear, h: num(Math.round(p.hoursFocus)) }));
  lines.push(fill(f.cost, {
    h: num(Math.round(p.hours)), rate: eur(a.hourlyRate), eur: eur(p.cost),
    factor: p.factor !== 1 ? fill(f.factor, { f: num(p.factor, 1), role: L(role?.label) }) : "",
  }));
  lines.push(fill(f.savings, { cost: eur(p.cost), low: pct(p.shares.conservative), high: pct(p.shares.expected), run: eur(p.run), sLow: eur(p.savings.low), sHigh: eur(p.savings.high) }));
  if (Number.isFinite(p.paybackMonths)) lines.push(fill(f.payback, { setup: eur(p.setup), sHigh: eur(p.savings.high), m: num(p.paybackMonths, 1) }));
  const t = p.onTable;
  if (t?.type === "whatif_orders") lines.push(fill(f.whatif_orders, { volume: num(p.volume), weeks: a.weeksPerYear, pct: pct(t.uplift), n: num(t.extraOrders, 1), value: eur(t.orderValue), margin: pct(a.margin), eur: eur(t.eur) }));
  if (t?.type === "skonto") lines.push(fill(f.skonto, { spend: eur(t.spend), share: pct(a.skontoShare), rate: pct(a.skontoRate), missed: pct(t.missed), eur: eur(t.eur) }));
  if (t?.type === "errors") lines.push(fill(f.errors, { n: num(t.perYear), cost: eur(a.errorCost), eur: eur(t.eur) }));
  return lines;
}

function rankHtml(r) {
  return r.processes.map((p, i) => {
    const proc = procOf(p.id);
    const appr = pack.approaches[p.approach];
    const badges = [];
    if (r.top?.id === p.id) badges.push(`<span class="ck-badge ck-badge--top">${esc(T.startHere)}</span>`);
    if (r.quick && r.quick.id === p.id && r.top?.id !== p.id) badges.push(`<span class="ck-badge">${esc(T.quickWin)}</span>`);
    const t = p.onTable;
    const tableLine = t && t.eur > 0 ? `<p class="ck-pcard__table">${fill(T.tableLine[t.type], { eur: eur(t.eur), n: num(Math.round(t.extraOrders ?? 0)) })}</p>` : "";
    const savedShare = p.cost > 0 ? clamp(Math.max(0, p.savings.high) / p.cost, 0, 1) : 0;
    let body;
    if (p.noPotential) {
      body = `<p class="ck-pcard__note">${esc(T.noPotential)}</p>`;
    } else {
      body = `
        <dl class="ck-pcard__figures">
          <div><dt>${esc(T.costToday)}</dt><dd>${eur(p.cost)}</dd></div>
          <div><dt>${esc(T.couldSave)}</dt><dd>${p.savings.high > 0 ? `${eur(Math.max(0, p.savings.low))}–${eur(p.savings.high)}` : "–"}</dd></div>
          <div><dt>${esc(T.payback)}</dt><dd>${esc(paybackText(p.paybackMonths))}</dd></div>
        </dl>
        <div class="ck-pcard__bar" aria-hidden="true"><span style="width:${(savedShare * 100).toFixed(1)}%"></span></div>
        ${p.savings.high <= 0 || p.paybackMonths > 36 ? `<p class="ck-pcard__note">${esc(T.notWorth)}</p>` : ""}
        ${p.note ? `<p class="ck-pcard__quote">${esc(L(p.note))}</p>` : ""}
        ${tableLine}
        <div class="ck-pcard__approach">
          <p><span>${esc(T.approach)}</span><strong>${esc(L(appr.label))}</strong> · ${esc(L(appr.desc))}</p>
          <p><span>${esc(T.effort)}</span>${esc(L(pack.efforts[p.effort]))}</p>
        </div>
        <details class="ck-how" data-key="p-${esc(p.id)}"${openDetails.has(`p-${p.id}`) ? " open" : ""}>
          <summary>${esc(T.howCalc)}</summary>
          <ul>${formulaLines(p, r.assumptions).map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
          <p class="ck-how__note">${esc(T.f.setupNote)}</p>
        </details>`;
    }
    return `
      <article class="ck-pcard${r.top?.id === p.id ? " ck-pcard--top" : ""}">
        <header class="ck-pcard__head">
          <span class="ck-pcard__rank">${String(i + 1).padStart(2, "0")}</span>
          <h3>${esc(L(proc.label))}</h3>
          ${badges.join("")}
        </header>
        ${body}
      </article>`;
  }).join("");
}

function takeHtml(r) {
  const parts = [];
  if (!r.top) parts.push(esc(T.take.none));
  else if (r.quick.id === r.top.id) parts.push(fill(T.take.same, { top: L(procOf(r.top.id).label), savings: eur(r.top.savings.high), payback: paybackText(r.top.paybackMonths) }));
  else parts.push(fill(T.take.split, { quick: L(procOf(r.quick.id).label), payback: paybackText(r.quick.paybackMonths), top: L(procOf(r.top.id).label), savings: eur(r.top.savings.high) }));
  for (const role of pack.roles.filter((x) => x.takeNote)) {
    const p = r.processes.find((x) => x.role === role.id && !x.noPotential);
    if (p) parts.push(fill(L(role.takeNote), { proc: L(procOf(p.id).label) }));
  }
  for (const refl of pack.reflections.filter((x) => x.takeNote)) {
    if (r.blindSpots.includes(refl.id)) parts.push(L(refl.takeNote));
  }
  for (const id of state.processes) {
    const note = procOf(id)?.takeNote;
    if (note) parts.push(L(note));
  }
  parts.push(esc(T.take.close));
  return `
    <div class="ck-wrap ck-take">
      <img class="ck-take__photo" src="/images/patrick-profile.jpg" alt="Patrick Schnaß" width="112" height="112">
      <div>
        <p class="eyebrow">${esc(T.takeEyebrow)}</p>
        <h2 class="t-section">${esc(T.takeTitle)}</h2>
        ${parts.map((p) => `<p>${p}</p>`).join("")}
        <p class="ck-take__sign">— ${esc(T.sign)}</p>
        <a class="cta cta--gradient" data-book>${esc(T.bookCta)}</a>
      </div>
    </div>`;
}

function blindHtml(r) {
  const cards = r.blindSpots.map((id) => {
    const refl = byId(pack.reflections, id);
    const growth = lang === "de" ? `${pct(r.assumptions.growth)} %` : `${pct(r.assumptions.growth)}%`;
    const body = fill(L(refl.body), { fte: num(r.growthFte, 1), growth });
    const [open, close] = lang === "de" ? ["„", "“"] : ["“", "”"];
    return `<article class="ck-blind"><h3>${esc(L(refl.title))}</h3><p>${body}</p><p class="ck-blind__said">${open}${esc(L(refl.statement))}${close} → ${esc(T.scale[state.reflections[id]])}</p></article>`;
  }).join("");
  return `
    <div class="ck-wrap">
      <p class="eyebrow">${esc(T.blindEyebrow)}</p>
      <h2 class="t-section">${esc(T.blindTitle)}</h2>
      ${cards ? `<div class="ck-blinds">${cards}</div>` : `<p class="ck-r-lead">${esc(T.blindNone)}</p>`}
    </div>`;
}

function assumeHtml() {
  const a = pack.assumptions;
  const isPct = (d) => d.unit === "%";
  const field = (key, d) => {
    const v = state.overrides[key] ?? d.value;
    const shown = isPct(d) ? +(v * 100).toFixed(2) : v;
    const unit = isPct(d) ? "%" : d.unit === "weeks" ? "" : d.unit;
    return `<label class="ck-field">
      <span class="ck-field__label">${esc(L(d.label))}</span>
      <span class="ck-field__row"><input type="number" inputmode="decimal" data-assume="${esc(key)}" value="${shown}" min="${isPct(d) ? d.min * 100 : d.min}" max="${isPct(d) ? d.max * 100 : d.max}" step="${isPct(d) ? +(d.step * 100).toFixed(2) : d.step}">${unit ? `<span>${esc(unit)}</span>` : ""}</span>
      ${d.hint ? `<small>${esc(L(d.hint))}</small>` : ""}
    </label>`;
  };
  const roles = pack.roles.map((r) => `<label class="ck-field">
      <span class="ck-field__label">${esc(L(r.label))}</span>
      <span class="ck-field__row"><span>×</span><input type="number" inputmode="decimal" data-role="${esc(r.id)}" value="${state.overrides.roles?.[r.id] ?? r.factor}" min="1" max="10" step="0.1"></span>
    </label>`).join("");
  const shares = state.processes.map((id) => {
    const proc = procOf(id);
    const v = state.overrides.shares?.[id] ?? proc.automation.expected;
    return `<label class="ck-field ck-field--range">
      <span class="ck-field__label">${esc(L(proc.label))}</span>
      <span class="ck-field__row"><input type="range" min="0" max="100" step="5" data-share="${esc(id)}" value="${Math.round(v * 100)}"><output>${Math.round(v * 100)}%</output></span>
    </label>`;
  }).join("");
  return `
    <details class="ck-assume" data-key="assume"${openDetails.has("assume") ? " open" : ""}>
      <summary><span class="eyebrow">${esc(T.assumeEyebrow)}</span><span class="ck-assume__title">${esc(T.assumeTitle)}</span></summary>
      <p class="ck-r-lead">${esc(T.assumeLead)}</p>
      <div class="ck-assume__grid">${Object.entries(a).map(([k, d]) => field(k, d)).join("")}</div>
      <h3 class="ck-assume__head">${esc(T.rolesHead)}</h3>
      <div class="ck-assume__grid">${roles}</div>
      <h3 class="ck-assume__head">${esc(T.shareLabel)}</h3>
      <div class="ck-assume__grid">${shares}</div>
      <button type="button" class="cta cta--light" data-action="reset">${esc(T.reset)}</button>
    </details>`;
}

function nextHtml() {
  const mailForm = mailer ? `
    <form class="ck-mail" id="ck-mail" novalidate>
      <h3>${esc(T.mailTitle)}</h3>
      <p>${esc(T.mailText)}</p>
      <label class="ck-mail__field"><span>${esc(T.mailLabel)}</span>
        <input type="email" name="email" autocomplete="email" required placeholder="${esc(T.mailPlaceholder)}">
      </label>
      <label class="ck-mail__hp" aria-hidden="true">Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
      <label class="ck-mail__check"><input type="checkbox" name="followUp"> <span>${esc(T.mailFollow)}</span></label>
      <p class="ck-mail__consent">${fill(T.mailConsent, { privacy: privacyUrl })}</p>
      <button type="submit" class="cta cta--gradient">${esc(T.mailSend)}</button>
      <p class="ck-mail__status" role="status" data-mail-status></p>
    </form>` : "";
  return `
    <div class="ck-r-next__bg" aria-hidden="true"></div>
    <div class="ck-wrap ck-next">
      <div class="ck-next__intro">
        <h2 class="t-section">${esc(T.nextTitle)}</h2>
        <p class="ck-r-lead">${esc(T.nextLead)}</p>
      </div>
      <div class="ck-next__grid${mailForm ? "" : " ck-next__grid--single"}">
        <div class="ck-book">
          <h3>${esc(T.bookTitle)}</h3>
          <p>${esc(T.bookText)}</p>
          <a class="cta cta--gradient" data-book>${esc(T.bookCta)}</a>
          <div class="ck-book__more">
            <button type="button" class="ck-link" data-action="print">${esc(T.ctaPdf)}</button>
            <button type="button" class="ck-link" data-action="share">${esc(T.shareCta)}</button>
          </div>
          <p class="ck-book__status" role="status" data-share-status></p>
        </div>
        ${mailForm}
      </div>
    </div>`;
}

/* ---------- Result updates ---------- */
let result = null;

function updateResult({ animate = false } = {}) {
  result = computeResult(pack, state);
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set("ck-r-hero", heroHtml(result));
  set("ck-r-costs", hiddenHtml(result));
  set("ck-r-score", scoreHtml(result));
  set("ck-r-list", rankHtml(result));
  set("ck-r-take", takeHtml(result));
  set("ck-r-blind", blindHtml(result));
  window.wireBookingLinks?.(root);
  const encoded = encodeState(pack, state);
  history.replaceState(null, "", `${location.pathname}${location.search}#r=${encoded}`);
  try { if (!shared) sessionStorage.setItem("ck-own", encoded); } catch { /* storage may be blocked */ }
  if (animate) {
    root.classList.add("ck-animate");
    countUp(root.querySelector("[data-count-to]"));
  }
}

function countUp(el) {
  if (!el || calm) return;
  const target = Number(el.dataset.countTo);
  const t0 = performance.now();
  const dur = 1600;
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = eur(target * eased);
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- Live meter during the process questions ---------- */
let meterValue = 0;
let meterTimer;
function updateMeter() {
  const el = root.querySelector("[data-meter]");
  if (!el) return;
  const answered = state.processes.filter((id) => Number.isFinite(state.answers[id]?.volume) && Number.isFinite(state.answers[id]?.minutes));
  const r = computeResult(pack, { ...state, processes: answered });
  const target = nice(r.cost);
  const from = meterValue;
  meterValue = target;
  const delta = target - from;
  const deltaEl = root.querySelector("[data-delta]");
  if (deltaEl && delta > 0 && from > 0) {
    deltaEl.textContent = `+${eur(delta)}`;
    deltaEl.classList.remove("is-on");
    void deltaEl.offsetWidth; // restart the CSS animation
    deltaEl.classList.add("is-on");
  }
  cancelAnimationFrame(meterTimer);
  if (calm) { el.textContent = eur(target); return; }
  const t0 = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / 600);
    el.textContent = eur(from + (target - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) meterTimer = requestAnimationFrame(tick);
  };
  meterTimer = requestAnimationFrame(tick);
}

function refreshFlow() {
  const nextBtn = root.querySelector('[data-action="next"]');
  if (nextBtn && state.step !== "intro") nextBtn.disabled = !canContinue();
  const hint = root.querySelector("[data-hint]");
  if (hint) hint.hidden = canContinue();
  const count = root.querySelector("[data-count]");
  if (count) {
    const n = state.processes.length;
    count.textContent = fill(T.processCount, { n }) + (n >= MAX_PROCESSES ? ` · ${T.processMax}` : "");
  }
  if (state.step === "detail") updateMeter();
}

/* ---------- Render ---------- */
function render() {
  root.dataset.step = state.step;
  root.classList.remove("ck-animate");
  const screens = { intro, context, guess, processes, detail, honest, calc };
  if (state.step === "result") {
    root.innerHTML = resultShell();
    document.getElementById("ck-assume").innerHTML = assumeHtml();
    document.getElementById("ck-r-next").innerHTML = nextHtml();
    updateResult({ animate: true });
  } else {
    root.innerHTML = screens[state.step]();
  }
  if (state.step === "detail") { meterValue = 0; updateMeter(); }
  if (state.step === "calc") setTimeout(() => go("result"), calm ? 0 : 1900);

  window.wireBookingLinks?.(root);
  // Move focus to the new screen's heading so keyboard and screen-reader users land in the right place.
  if (state.step !== "intro") {
    const heading = root.querySelector(".ck-title, .ck-r-hero__title");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    root.scrollIntoView({ behavior: calm || state.step === "result" ? "auto" : "smooth", block: "start" });
  }
}

/* ---------- Events ---------- */
function setAnswer(group, value) {
  const id = state.processes[state.detail];
  const a = state.answers[id];
  if (group === "volume" || group === "minutes") {
    a[group] = Number(value);
    const input = root.querySelector(`[data-input="${group}"]`);
    if (input) input.value = "";
  } else if (group === "rework" || group === "role") {
    a[group] = value;
  } else if (group.startsWith("lever:")) {
    const q = group.slice(6);
    a.lever[q] = a.lever[q] === value ? undefined : value; // tap again to clear an optional answer
    if (a.lever[q] === undefined) delete a.lever[q];
  }
}

function pressGroup(group, isPressed) {
  root.querySelectorAll(`[data-group="${CSS.escape(group)}"]`).forEach((b) => b.setAttribute("aria-pressed", String(isPressed(b.dataset.value))));
}

root.addEventListener("click", (e) => {
  const chipEl = e.target.closest("[data-group]");
  if (chipEl) {
    const { group, value } = chipEl.dataset;
    if (group === "industry" || group === "size" || group === "guess") {
      state[group] = value;
      pressGroup(group, (v) => v === value);
    } else if (group === "proc") {
      const i = state.processes.indexOf(value);
      if (i >= 0) state.processes.splice(i, 1);
      else if (state.processes.length < MAX_PROCESSES) state.processes.push(value);
      pressGroup("proc", (v) => state.processes.includes(v));
    } else if (group.startsWith("refl:")) {
      state.reflections[group.slice(5)] = Number(value);
      pressGroup(group, (v) => Number(v) === Number(value));
    } else {
      setAnswer(group, value);
      const a = state.answers[state.processes[state.detail]];
      const current = group.startsWith("lever:") ? a.lever[group.slice(6)] : a[group];
      pressGroup(group, (v) => String(current) === v);
    }
    refreshFlow();
    return;
  }
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "next") next();
  else if (action === "back") back();
  else if (action === "restart") {
    state = fresh();
    shared = false;
    openDetails.clear();
    history.replaceState(null, "", location.pathname + location.search);
    render();
    root.scrollIntoView({ block: "start" });
  } else if (action === "print") window.print();
  else if (action === "to-mail") {
    const form = document.getElementById("ck-mail");
    form?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
    form?.querySelector("input[type=email]")?.focus({ preventScroll: true });
  } else if (action === "share") share();
  else if (action === "reset") {
    state.overrides = {};
    document.getElementById("ck-assume").innerHTML = assumeHtml();
    updateResult();
  }
});

root.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.input) {
    const field = t.dataset.input;
    const proc = procOf(state.processes[state.detail]);
    const raw = parseFloat(String(t.value).replace(",", "."));
    const a = state.answers[proc.id];
    a[field] = Number.isFinite(raw) ? clamp(raw, proc[field].min, proc[field].max) : null;
    pressGroup(field, () => false);
    refreshFlow();
    return;
  }
  if (t.dataset.assume || t.dataset.role || t.dataset.share) {
    const raw = parseFloat(String(t.value).replace(",", "."));
    if (!Number.isFinite(raw)) return;
    if (t.dataset.assume) {
      const d = pack.assumptions[t.dataset.assume];
      state.overrides[t.dataset.assume] = d.unit === "%" ? raw / 100 : raw;
    } else if (t.dataset.role) {
      state.overrides.roles = { ...state.overrides.roles, [t.dataset.role]: raw };
    } else {
      state.overrides.shares = { ...state.overrides.shares, [t.dataset.share]: raw / 100 };
      t.nextElementSibling.textContent = `${Math.round(raw)}%`;
    }
    cancelAnimationFrame(updateResult.raf);
    updateResult.raf = requestAnimationFrame(() => updateResult());
  }
});

// Remember which explanations are open, so recalculating doesn't snap them shut.
root.addEventListener("toggle", (e) => {
  const key = e.target.dataset?.key;
  if (!key) return;
  if (e.target.open) openDetails.add(key); else openDetails.delete(key);
}, true);

root.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.matches("[data-input]") && canContinue()) { e.preventDefault(); next(); }
});

root.addEventListener("submit", async (e) => {
  if (e.target.id !== "ck-mail") return;
  e.preventDefault();
  const form = e.target;
  const status = form.querySelector("[data-mail-status]");
  const button = form.querySelector("button[type=submit]");
  const email = form.email.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    status.textContent = T.mailInvalid;
    form.email.focus();
    return;
  }
  button.disabled = true;
  button.textContent = T.mailSending;
  status.textContent = "";
  try {
    if (mailer === "mock") {
      await new Promise((r) => setTimeout(r, 700));
      console.info("[check] mock e-mail payload", mailPayload(email, form));
      status.textContent = `${T.mailDone} ${T.mailMock}`;
    } else {
      const res = await fetch(mailer, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mailPayload(email, form)),
      });
      if (!res.ok) throw new Error(String(res.status));
      status.textContent = T.mailDone;
    }
    form.classList.add("is-sent");
    button.textContent = "✓";
  } catch {
    status.textContent = T.mailError;
    button.disabled = false;
    button.textContent = T.mailSend;
  }
});

/** What the e-mail form sends: the e-mail address, the anonymised answers (as a link) and the computed figures. */
function mailPayload(email, form) {
  const r = result;
  return {
    email,
    followUp: form.followUp.checked,
    website: form.website.value, // honeypot: real people leave it empty
    lang,
    resultUrl: `${permalink}#r=${encodeState(pack, state)}`,
    summary: {
      pack: pack.id, packVersion: pack.version,
      industry: state.industry, size: state.size,
      cost: Math.round(r.cost), table: Math.round(r.table),
      savingsLow: Math.round(r.savings.low), savingsHigh: Math.round(r.savings.high),
      hoursPerWeek: Math.round(r.hoursPerWeek), fte: Math.round(r.fte * 10) / 10, score: r.score,
      processes: r.processes.map((p) => ({
        id: p.id, cost: Math.round(p.cost), savingsLow: Math.round(p.savings.low), savingsHigh: Math.round(p.savings.high),
        paybackMonths: Number.isFinite(p.paybackMonths) ? Math.round(p.paybackMonths * 10) / 10 : null, approach: p.approach,
      })),
      blindSpots: r.blindSpots,
      top: r.top?.id ?? null, quick: r.quick?.id ?? null,
    },
  };
}

async function share() {
  const url = `${permalink}#r=${encodeState(pack, state)}`;
  const status = root.querySelector("[data-share-status]");
  try {
    await navigator.clipboard.writeText(url);
    if (status) status.textContent = T.shareDone;
  } catch {
    window.prompt(T.shareCta, url);
  }
}

/* ---------- Start ---------- */
const hash = location.hash.startsWith("#r=") ? location.hash.slice(3) : "";
const restored = hash ? decodeState(pack, hash) : null;
if (restored) {
  let own = false;
  try { own = sessionStorage.getItem("ck-own") === hash; } catch { /* storage may be blocked */ }
  state = { ...fresh(), ...restored, step: "result" };
  shared = !own;
}
render();
