/*
 * Micro-calculators: one question, a few sliders, an instant € answer, then the hand-over to the
 * full check with the values carried over (?p=<process>&v=…&m=…&l.<lever>=…).
 * Each calculator is config + a pure compute() on top of the check's model and pack, so new ones
 * need no new page code. Text lives here in DE and EN; formulas are rendered by calc.mjs.
 */
import { resolveAssumptions, computeProcess } from "./model.mjs";

const byId = (list, id) => list.find((x) => x.id === id);
/** The pack option whose value is closest to `value` (for carrying slider values into the check). */
const nearestOption = (options, value, skip = []) =>
  options.filter((o) => !skip.includes(o.id)).reduce((best, o) => (Math.abs(o.value - value) < Math.abs(best.value - value) ? o : best));
const leverQuestion = (pack, processId, questionId) => byId(pack.processes, processId).lever.questions.find((q) => q.id === questionId);

export const CALCULATORS = {
  skonto: {
    process: "invoices",
    inputs: [
      { id: "spend", type: "steps", steps: [5000, 10000, 20000, 30000, 50000, 75000, 100000, 150000, 200000, 300000, 500000, 750000, 1000000], value: 50000, format: "eur",
        label: { de: "Lieferantenrechnungen pro Monat (Summe)", en: "Supplier invoices per month (total)" } },
      { id: "share", type: "range", min: 0, max: 1, step: 0.05, value: 0.4, format: "pct",
        label: { de: "Anteil der Rechnungen mit Skonto-Angebot", en: "Share of invoices that offer Skonto" } },
      { id: "rate", type: "range", min: 0.01, max: 0.03, step: 0.005, value: 0.02, format: "pct",
        label: { de: "Skontosatz", en: "Skonto rate" } },
      { id: "missed", type: "range", min: 0, max: 1, step: 0.05, value: 0.25, format: "pct",
        label: { de: "Wie oft die Skontofrist verstreicht", en: "How often the Skonto deadline passes" } },
    ],
    text: {
      de: {
        big: "verschenkt pro Jahr",
        formula: "{spend} × 12 Monate × {share} mit Skonto × {rate} × {missed} verpasst = {eur}",
        insight: "Zum Vergleich: {rate} Skonto für 20 Tage früheres Zahlen (10 statt 30 Tage) entsprechen einem Jahreszins von rund {apr}. Kaum ein Kredit ist so teuer. Skonto zu verpassen ist also fast nie eine Geldfrage, sondern eine Frage, wie lange Rechnungen liegen bleiben.",
        cta: "Das ist nur ein Hebel. Was kostet Sie die Rechnungsbearbeitung insgesamt?",
      },
      en: {
        big: "given away every year",
        formula: "{spend} × 12 months × {share} with Skonto × {rate} × {missed} missed = {eur}",
        insight: "For comparison: {rate} Skonto for paying 20 days earlier (10 instead of 30 days) equals an annual interest rate of about {apr}. Hardly any loan is that expensive. So missing Skonto is almost never about money; it's about how long invoices sit around.",
        cta: "That's just one lever. What does invoice handling cost you in total?",
      },
    },
    compute(pack, v) {
      const eur = v.spend * 12 * v.share * v.rate * v.missed;
      const apr = (v.rate / (1 - v.rate)) * (365 / 20);
      const missed = nearestOption(leverQuestion(pack, "invoices", "missed").options, v.missed, ["unknown"]);
      const spend = nearestOption(leverQuestion(pack, "invoices", "spend").options, v.spend);
      return { eur, apr, link: { p: "invoices", "l.missed": missed.id, "l.spend": spend.id } };
    },
  },

  angebote: {
    process: "quotes",
    inputs: [
      { id: "volume", type: "steps", steps: [1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200], value: 10, format: "num",
        label: { de: "Angebote pro Woche", en: "Quotes per week" } },
      { id: "minutes", type: "steps", steps: [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240], value: 45, format: "min",
        label: { de: "Minuten pro Angebot, von der Anfrage bis zum Versand", en: "Minutes per quote, from request to sent" } },
      { id: "role", type: "choice", options: "roles", value: "specialists",
        label: { de: "Wer erstellt die Angebote?", en: "Who writes the quotes?" } },
      { id: "speed", type: "choice", options: "lever:quotes:speed", value: "days",
        label: { de: "Wie lange bis der Kunde das Angebot hat?", en: "How long until the customer has the quote?" } },
      { id: "orderValue", type: "steps", steps: [500, 1000, 2500, 5000, 10000, 20000, 30000, 50000, 100000], value: 5000, format: "eur",
        label: { de: "Typischer Auftragswert", en: "Typical order value" } },
    ],
    text: {
      de: {
        big: "kostet Sie das Angebotschreiben pro Jahr",
        hours: "Das sind {h} Stunden pro Woche.",
        formula: "{volume} Angebote × {minutes} Min. × {weeks} Wochen × 1,15 Nacharbeit = {hours} h × {rate}/h{factor} = {eur}",
        factor: " × {f} für {role}",
        whatif: "Und was wäre, wenn schnellere Angebote nur {pct} mehr Aufträge bringen? Das wären {n} Aufträge × {value} × {margin} Deckungsbeitrag = <strong>{eur}</strong> pro Jahr.",
        sameday: "Am selben Tag? Dann gewinnen Sie über Tempo schon, was zu gewinnen ist. Bleibt die Zeit, die das Schreiben kostet.",
        cta: "Wo steckt in Ihrem Backoffice noch mehr? Der ganze Check dauert 5 Minuten.",
      },
      en: {
        big: "is what writing quotes costs you every year",
        hours: "That's {h} hours a week.",
        formula: "{volume} quotes × {minutes} min × {weeks} weeks × 1.15 rework = {hours} h × {rate}/h{factor} = {eur}",
        factor: " × {f} for {role}",
        whatif: "And what if faster quotes won just {pct} more orders? That's {n} orders × {value} × {margin} margin = <strong>{eur}</strong> a year.",
        sameday: "Same day? Then speed is already winning you what it can. What's left is the time writing them costs.",
        cta: "Where else is your back office leaking? The full check takes 5 minutes.",
      },
    },
    compute(pack, v, overrides = {}) {
      const a = resolveAssumptions(pack, overrides);
      const proc = byId(pack.processes, "quotes");
      const r = computeProcess(pack, proc, { volume: v.volume, minutes: v.minutes, rework: "sometimes", role: v.role, lever: {} }, a);
      const uplift = byId(leverQuestion(pack, "quotes", "speed").options, v.speed)?.value ?? 0;
      const extraOrders = v.volume * a.weeksPerYear * uplift;
      const whatif = extraOrders * v.orderValue * a.margin;
      const orderValue = nearestOption(leverQuestion(pack, "quotes", "orderValue").options, v.orderValue);
      return {
        eur: r.cost, hours: r.hours, hoursPerWeek: r.hours / a.weeksPerYear, factor: r.factor, uplift, extraOrders, whatif, a,
        link: { p: "quotes", v: v.volume, m: v.minutes, role: v.role, "l.speed": v.speed, "l.orderValue": orderValue.id },
      };
    },
  },
};

/** Options for a "choice" input, from the pack: "roles" or "lever:<process>:<question>". */
export function choiceOptions(pack, spec) {
  if (spec === "roles") return pack.roles;
  const [, processId, questionId] = spec.split(":");
  return leverQuestion(pack, processId, questionId).options;
}

/** The deep link into the check with the calculator's values carried over. */
export function checkLink(base, link, from) {
  const q = new URLSearchParams({ ...Object.fromEntries(Object.entries(link).map(([k, v]) => [k, String(v)])), from });
  return `${base}?${q}`;
}
