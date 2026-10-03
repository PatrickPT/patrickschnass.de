/*
 * Micro-calculator page (layouts/calculator/single.html). Renders the inputs once, then updates
 * only the result, so sliders keep focus. Runs in the browser; nothing is sent anywhere.
 */
import { CALCULATORS, choiceOptions, checkLink } from "./calculators.mjs";
import pack from "./packs/back-office-mittelstand.json";

const section = document.getElementById("calc");
const root = document.getElementById("calc-app");
const id = section?.dataset.calc;
const calc = CALCULATORS[id];

if (root && calc) {
  const lang = document.documentElement.lang === "de" ? "de" : "en";
  const T = calc.text[lang];
  const locale = lang === "de" ? "de-DE" : "en-GB";
  const eurFmt = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const nice = (v) => { const x = Math.abs(v); const step = x >= 10000 ? 100 : x >= 1000 ? 10 : 1; return Math.round(v / step) * step; };
  const eur = (v) => eurFmt.format(nice(v));
  const num = (v, d = 0) => new Intl.NumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  const pct = (v) => { const x = v * 100; return `${num(x, Math.abs(x - Math.round(x)) > 0.001 ? 1 : 0)}${lang === "de" ? " %" : "%"}`; };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fill = (tpl, vals) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vals ? esc(vals[k]) : m));
  const L = (x) => x?.[lang] ?? "";
  const format = { eur, pct, num: (v) => num(v), min: (v) => `${num(v)} ${lang === "de" ? "Min." : "min"}` };
  const track = (name, props) => window.trackEvent?.(name, props);

  const values = Object.fromEntries(calc.inputs.map((i) => [i.id, i.value]));
  let used = false;

  const inputHtml = (i) => {
    if (i.type === "choice") {
      const opts = choiceOptions(pack, i.options);
      return `<div class="calc__field"><p class="calc__label" id="cl-${i.id}">${esc(L(i.label))}</p>
        <div class="ck-chips" role="group" aria-labelledby="cl-${i.id}">${opts.map((o) => `<button type="button" class="ck-chip" data-input="${i.id}" data-value="${esc(o.id)}" aria-pressed="${values[i.id] === o.id}">${esc(L(o.label))}</button>`).join("")}</div></div>`;
    }
    const isSteps = i.type === "steps";
    const pos = isSteps ? i.steps.indexOf(i.value) : i.value;
    return `<label class="calc__field">
      <span class="calc__row"><span class="calc__label">${esc(L(i.label))}</span><output data-out="${i.id}">${format[i.format](i.value)}</output></span>
      <input type="range" data-input="${i.id}" min="${isSteps ? 0 : i.min}" max="${isSteps ? i.steps.length - 1 : i.max}" step="${isSteps ? 1 : i.step}" value="${pos}">
    </label>`;
  };

  root.innerHTML = `
    <div class="calc__inputs">${calc.inputs.map(inputHtml).join("")}</div>
    <div class="calc__result" aria-live="polite" id="calc-result"></div>`;

  function resultHtml() {
    const r = calc.compute(pack, values);
    const link = checkLink(section.dataset.check, r.link, `calc-${id}`);
    let lines = "";
    if (id === "skonto") {
      lines = `<p class="calc__formula">${esc(fill(T.formula, { spend: eur(values.spend), share: pct(values.share), rate: pct(values.rate), missed: pct(values.missed), eur: eur(r.eur) }))}</p>
        <p class="calc__insight">${esc(fill(T.insight, { rate: pct(values.rate), apr: pct(r.apr) }))}</p>`;
    } else if (id === "angebote") {
      const role = pack.roles.find((x) => x.id === values.role);
      lines = `<p class="calc__sub">${esc(fill(T.hours, { h: num(Math.round(r.hoursPerWeek)) }))}</p>
        <p class="calc__formula">${esc(fill(T.formula, {
          volume: num(values.volume), minutes: num(values.minutes), weeks: r.a.weeksPerYear, hours: num(Math.round(r.hours)),
          rate: eur(r.a.hourlyRate), eur: eur(r.eur), factor: r.factor !== 1 ? fill(T.factor, { f: num(r.factor, 1), role: L(role.label) }) : "",
        }))}</p>
        <p class="calc__insight">${r.uplift > 0
          ? fill(T.whatif, { pct: pct(r.uplift), n: num(r.extraOrders, 1), value: eur(values.orderValue), margin: pct(r.a.margin), eur: eur(r.whatif) })
          : esc(T.sameday)}</p>`;
    }
    return `
      <p class="calc__big">${eur(r.eur)}</p>
      <p class="calc__bigLabel">${esc(T.big)}</p>
      ${lines}
      <div class="calc__cta">
        <p>${esc(T.cta)}</p>
        <a class="cta cta--gradient" href="${esc(link)}">${esc(section.dataset.ctaLabel || "")} →</a>
      </div>`;
  }

  const update = () => { document.getElementById("calc-result").innerHTML = resultHtml(); };

  root.addEventListener("input", (e) => {
    const t = e.target.closest("input[data-input]");
    if (!t) return;
    const i = calc.inputs.find((x) => x.id === t.dataset.input);
    values[i.id] = i.type === "steps" ? i.steps[Number(t.value)] : Number(t.value);
    root.querySelector(`[data-out="${i.id}"]`).textContent = format[i.format](values[i.id]);
    if (!used) { used = true; track("calc_use", { calc: id }); }
    update();
  });
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-input]");
    if (!b) return;
    values[b.dataset.input] = b.dataset.value;
    root.querySelectorAll(`button[data-input="${b.dataset.input}"]`).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    if (!used) { used = true; track("calc_use", { calc: id }); }
    update();
  });
  update();
}
