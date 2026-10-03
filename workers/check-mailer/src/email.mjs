/*
 * Validation and rendering for the check mailer. Pure functions, no network, so they run under
 * `node --test` as well as in the Worker.
 *
 * Abuse model: anyone can POST here, so the e-mail body is built only from validated ids and
 * bounded numbers. No free text from the request ever reaches an inbox; at worst someone can send
 * a results e-mail to an address they don't own, which the rate limits in index.mjs keep small.
 */

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const LANGS = ["de", "en"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const isNum = (v, min, max) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const ids = (list) => new Set(list.map((x) => x.id));

/**
 * Checks a request body. Returns { ok: false, error } or { ok: true, spam, data } where `data`
 * only contains known fields with known values.
 */
export function validatePayload(pack, body, { resultPrefixes = [] } = {}) {
  const fail = (error) => ({ ok: false, error });
  if (!body || typeof body !== "object") return fail("body");
  if (typeof body.email !== "string" || body.email.length > 254 || !EMAIL_RE.test(body.email.trim())) return fail("email");
  if (!LANGS.includes(body.lang)) return fail("lang");
  // The link goes into the e-mail, so it must be one of our check pages plus an encoded answer set.
  const prefix = typeof body.resultUrl === "string" && body.resultUrl.length <= 4000 && resultPrefixes.find((p) => body.resultUrl.startsWith(p));
  if (!prefix || !/^[A-Za-z0-9_-]+$/.test(body.resultUrl.slice(prefix.length))) return fail("resultUrl");

  const s = body.summary;
  if (!s || typeof s !== "object" || s.pack !== pack.id) return fail("summary");
  const MAX = 1e9;
  for (const k of ["cost", "table", "savingsLow", "savingsHigh"]) if (!isNum(s[k], -MAX, MAX)) return fail(`summary.${k}`);
  if (!isNum(s.hoursPerWeek, 0, 1e6) || !isNum(s.fte, 0, 1e5) || !isNum(s.score, 0, 100)) return fail("summary.figures");
  if (s.industry !== null && !ids(pack.industries).has(s.industry)) return fail("summary.industry");
  if (s.size !== null && !ids(pack.sizes).has(s.size)) return fail("summary.size");
  if (!Array.isArray(s.processes) || s.processes.length === 0 || s.processes.length > 10) return fail("summary.processes");
  const procIds = ids(pack.processes);
  const processes = [];
  for (const p of s.processes) {
    if (!p || !procIds.has(p.id) || !(p.approach in pack.approaches)) return fail("summary.processes");
    for (const k of ["cost", "savingsLow", "savingsHigh"]) if (!isNum(p[k], -MAX, MAX)) return fail("summary.processes");
    if (p.paybackMonths !== null && !isNum(p.paybackMonths, 0, 1e6)) return fail("summary.processes");
    processes.push({ id: p.id, cost: p.cost, savingsLow: p.savingsLow, savingsHigh: p.savingsHigh, paybackMonths: p.paybackMonths, approach: p.approach });
  }
  const reflIds = ids(pack.reflections);
  if (!Array.isArray(s.blindSpots) || !s.blindSpots.every((id) => reflIds.has(id))) return fail("summary.blindSpots");
  const chosen = new Set(processes.map((p) => p.id));
  for (const k of ["top", "quick"]) if (s[k] !== null && s[k] !== undefined && !chosen.has(s[k])) return fail(`summary.${k}`);

  return {
    ok: true,
    // Honeypot: real visitors never see this field. Answer "ok" so bots learn nothing.
    spam: typeof body.website === "string" && body.website.length > 0,
    data: {
      email: body.email.trim(),
      lang: body.lang,
      followUp: body.followUp === true,
      resultUrl: body.resultUrl,
      summary: {
        packVersion: typeof s.packVersion === "string" ? s.packVersion.slice(0, 20) : "",
        industry: s.industry ?? null, size: s.size ?? null,
        cost: s.cost, table: s.table, savingsLow: s.savingsLow, savingsHigh: s.savingsHigh,
        hoursPerWeek: s.hoursPerWeek, fte: s.fte, score: s.score,
        processes, blindSpots: [...new Set(s.blindSpots)], top: s.top ?? null, quick: s.quick ?? null,
      },
    },
  };
}

/* ---------- Feedback: "Do these numbers feel right?" (no e-mail address, no individual answers) ---------- */

export const FEEDBACK_RATINGS = ["right", "high", "low"];
export const FEEDBACK_REASONS = ["rate", "time", "share", "setup", "other"];
export const COST_BANDS = ["<10k", "10-50k", "50-100k", "100-250k", ">250k"];

/** Checks a feedback request. Returns { ok: false, error } or { ok: true, spam, data }. */
export function validateFeedback(pack, body) {
  const fail = (error) => ({ ok: false, error });
  if (!body || typeof body !== "object" || body.type !== "feedback") return fail("type");
  if (!LANGS.includes(body.lang)) return fail("lang");
  if (!FEEDBACK_RATINGS.includes(body.rating)) return fail("rating");
  if (body.reason !== null && !FEEDBACK_REASONS.includes(body.reason)) return fail("reason");
  const s = body.summary;
  if (!s || typeof s !== "object" || s.pack !== pack.id) return fail("summary");
  const procIds = ids(pack.processes);
  if (!Array.isArray(s.processes) || s.processes.length === 0 || s.processes.length > 10 || !s.processes.every((id) => procIds.has(id))) return fail("summary.processes");
  if (!COST_BANDS.includes(s.costBand)) return fail("summary.costBand");
  if (!isNum(s.score, 0, 100)) return fail("summary.score");
  return {
    ok: true,
    spam: typeof body.website === "string" && body.website.length > 0,
    data: {
      lang: body.lang, rating: body.rating, reason: body.reason ?? null,
      summary: { packVersion: typeof s.packVersion === "string" ? s.packVersion.slice(0, 20) : "", processes: [...new Set(s.processes)], costBand: s.costBand, score: s.score },
    },
  };
}

/** The one-line notification Patrick gets for each feedback. */
export function renderFeedbackNotification(pack, data) {
  const rating = { right: "passt ungefähr", high: "ZU HOCH", low: "ZU NIEDRIG" }[data.rating];
  const reason = { rate: "Stundensatz", time: "Zeit pro Vorgang", share: "Automatisierungsanteil", setup: "Einrichtungskosten", other: "etwas anderes" }[data.reason] ?? "–";
  const procs = data.summary.processes.map((id) => pack.processes.find((p) => p.id === id)?.label?.de ?? id).join(", ");
  const text = [
    `Bewertung: ${rating}`,
    `Welche Zahl: ${reason}`,
    `Prozesse: ${procs}`,
    `Kostenband: ${data.summary.costBand} € · Potenzial genutzt: ${data.summary.score} % · Sprache: ${data.lang} · Pack ${data.summary.packVersion}`,
  ].join("\n");
  return {
    subject: `[Check-Feedback] ${rating}${data.reason ? ` · ${reason}` : ""} · ${data.summary.costBand}`,
    text,
    html: `<pre style="font:14px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap;">${esc(text)}</pre>`,
  };
}

/* ---------- The one consented follow-up, about two weeks later ---------- */

/** The queue entry for a follow-up: due date in the key, only what the e-mail needs in the value. */
export function followUpRecord(data, now = new Date(), days = 14, id = crypto.randomUUID()) {
  const due = new Date(now.getTime() + days * 86400000).toISOString().slice(0, 10);
  const top = data.summary.top ? data.summary.processes.find((p) => p.id === data.summary.top) : null;
  return {
    key: `fu:${due}:${id}`,
    value: { email: data.email, lang: data.lang, resultUrl: data.resultUrl, top: top?.id ?? null, savingsHigh: top?.savingsHigh ?? null, packVersion: data.summary.packVersion },
    // Deleted after sending; the TTL is the safety net if sending keeps failing.
    ttl: (days + 16) * 86400,
  };
}

/** True when a queue key's due date (fu:YYYY-MM-DD:id) is today or earlier. */
export const isDue = (key, now = new Date()) => key.split(":")[1] <= now.toISOString().slice(0, 10);

const FOLLOW = {
  de: {
    subject: "Zwei Wochen später: Haben Sie mit „{top}“ angefangen?",
    subjectNoTop: "Zwei Wochen später: Ihr KI-Potenzial-Check",
    hello: "Hallo,",
    intro: "vor zwei Wochen haben Sie den KI-Potenzial-Check gemacht. Ihr größter Hebel war „{top}“, mit rund {eur} pro Jahr.",
    introNoTop: "vor zwei Wochen haben Sie den KI-Potenzial-Check gemacht.",
    steps: "Falls es noch auf der Liste steht: So würde ich anfangen, ganz ohne mich.",
    result: "Ihr Ergebnis, mit allen Annahmen",
    book: "Wenn Sie eine zweite Meinung möchten: 30 Minuten mit mir",
    sign: "Viele Grüße\nPatrick Schnaß",
    footer: "Das ist die eine Nachfass-Mail, der Sie zugestimmt haben. Es kommt keine weitere. Antworten Sie einfach, wenn Sie Fragen haben oder Ihre Daten gelöscht werden sollen.",
  },
  en: {
    subject: "Two weeks later: did you start with “{top}”?",
    subjectNoTop: "Two weeks later: your AI potential check",
    hello: "Hi,",
    intro: "two weeks ago you did the AI potential check. Your biggest lever was “{top}”, at about {eur} a year.",
    introNoTop: "two weeks ago you did the AI potential check.",
    steps: "In case it's still on the list, here's how I'd start, without me.",
    result: "Your result, with every assumption",
    book: "If you'd like a second opinion: 30 minutes with me",
    sign: "Best,\nPatrick Schnaß",
    footer: "This is the one follow-up you agreed to. There won't be another. Just reply if you have questions or want your data deleted.",
  },
};

/** The follow-up e-mail: their top lever, three concrete first steps from the pack, links. */
export function renderFollowUpEmail(pack, rec, { bookingUrl = "" } = {}) {
  const c = FOLLOW[rec.lang] ?? FOLLOW.de;
  const { eur } = formatters(rec.lang);
  const proc = rec.top ? pack.processes.find((p) => p.id === rec.top) : null;
  const top = proc?.label?.[rec.lang];
  const steps = (proc?.startSteps ?? []).map((st) => st[rec.lang]);
  const intro = top ? fill(c.intro, { top, eur: eur(Math.max(0, rec.savingsHigh ?? 0)) }) : c.introNoTop;
  const subject = top ? fill(c.subject, { top }) : c.subjectNoTop;
  const text = [
    c.hello, "", intro, "",
    ...(steps.length ? [c.steps, ...steps.map((st, i) => `${i + 1}. ${st}`), ""] : []),
    `${c.result}: ${rec.resultUrl}`,
    ...(bookingUrl ? [`${c.book}: ${bookingUrl}`] : []),
    "", c.sign, "", "--", c.footer,
  ].join("\n");
  const a = (href, label) => `<a href="${esc(href)}" style="color:#6E29DC;font-weight:600;">${esc(label)}</a>`;
  const html = `<!doctype html><html lang="${rec.lang}"><body style="margin:0;background:#f5f5f7;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#16161c;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
<div style="background:#ffffff;border-radius:16px;padding:28px;line-height:1.55;">
<p style="margin:0 0 12px;">${esc(c.hello)}</p>
<p style="margin:0 0 16px;">${esc(intro)}</p>
${steps.length ? `<p style="margin:0 0 8px;font-weight:600;">${esc(c.steps)}</p><ol style="margin:0 0 20px;padding-left:22px;">${steps.map((st) => `<li style="margin-bottom:8px;">${esc(st)}</li>`).join("")}</ol>` : ""}
<p style="margin:0 0 8px;">${a(rec.resultUrl, c.result)}</p>
${bookingUrl ? `<p style="margin:0 0 20px;">${a(bookingUrl, c.book)}</p>` : ""}
<p style="margin:0;white-space:pre-line;">${esc(c.sign)}</p>
</div>
<p style="font-size:12px;color:#888;line-height:1.5;padding:16px 8px;">${esc(c.footer)}</p>
</div></body></html>`;
  return { subject, text, html };
}

const COPY = {
  de: {
    subject: "Ihr KI-Potenzial-Check: rund {cost} pro Jahr",
    hello: "Hallo,",
    intro: "hier ist Ihr Ergebnis vom KI-Potenzial-Check. Ihre Routinearbeit in den {n} angeschauten Prozessen kostet Sie rund:",
    perYear: "pro Jahr",
    table: "Dazu kommen geschätzt {eur}, die liegen bleiben (Skonto, Fehler, verlorene Aufträge).",
    savings: "Davon ließen sich realistisch {low} bis {high} pro Jahr einsparen.",
    score: "Genutztes Potenzial: {score} %",
    head: ["Prozess", "Kostet heute", "Einsparpotenzial", "Amortisiert in"],
    months: "~{n} Monaten", never: "–",
    blind: "Ihre blinden Flecken",
    open: "Ganzes Ergebnis öffnen",
    openNote: "Der Link enthält Ihre Antworten. Sie können dort alle Annahmen ändern und jede Formel nachlesen.",
    book: "30 Minuten mit mir buchen",
    bookNote: "Kostenlos, ohne Pitch-Deck. Wir schauen gemeinsam auf Ihre Zahlen.",
    sign: "Viele Grüße\nPatrick Schnaß",
    footer: "Sie bekommen diese E-Mail, weil Sie sie auf patrickschnass.de angefordert haben. Es gibt keinen Newsletter. Antworten Sie einfach, wenn Sie Fragen haben oder Ihre Daten gelöscht werden sollen.",
  },
  en: {
    subject: "Your AI potential check: about {cost} a year",
    hello: "Hi,",
    intro: "here's your result from the AI potential check. Your routine work in the {n} processes you looked at costs you about:",
    perYear: "a year",
    table: "Plus an estimated {eur} left on the table (Skonto, errors, lost orders).",
    savings: "Realistically, {low} to {high} of that could be saved every year.",
    score: "Potential used: {score}%",
    head: ["Process", "Costs today", "Could save", "Pays back in"],
    months: "~{n} months", never: "–",
    blind: "Your blind spots",
    open: "Open your full result",
    openNote: "The link contains your answers. You can change every assumption there and read each formula.",
    book: "Book 30 minutes with me",
    bookNote: "Free, no pitch deck. We look at your numbers together.",
    sign: "Best,\nPatrick Schnaß",
    footer: "You're getting this e-mail because you requested it on patrickschnass.de. There is no newsletter. Just reply if you have questions or want your data deleted.",
  },
};

const fill = (tpl, vals) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vals ? vals[k] : m));

function formatters(lang) {
  const locale = lang === "de" ? "de-DE" : "en-GB";
  const cur = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const nice = (v) => { const a = Math.abs(v); const step = a >= 10000 ? 100 : a >= 1000 ? 10 : 1; return Math.round(v / step) * step; };
  return { eur: (v) => cur.format(nice(v)), num: (v) => new Intl.NumberFormat(locale).format(v) };
}

/** The e-mail the visitor asked for. */
export function renderVisitorEmail(pack, data, { bookingUrl = "" } = {}) {
  const c = COPY[data.lang];
  const { eur, num } = formatters(data.lang);
  const s = data.summary;
  const label = (list, id) => list.find((x) => x.id === id)?.label?.[data.lang] ?? "";
  const payback = (m) => (m === null || m > 36 ? c.never : fill(c.months, { n: num(Math.max(1, Math.round(m))) }));

  const rows = s.processes.map((p) => [label(pack.processes, p.id), eur(p.cost), p.savingsHigh > 0 ? `${eur(Math.max(0, p.savingsLow))}–${eur(p.savingsHigh)}` : "–", payback(p.paybackMonths)]);
  const blind = s.blindSpots.map((id) => label(pack.reflections.map((r) => ({ id: r.id, label: r.title })), id));

  const subject = fill(c.subject, { cost: eur(s.cost) });
  const lines = [
    c.hello, "",
    fill(c.intro, { n: s.processes.length }),
    `${eur(s.cost)} ${c.perYear}`, "",
    ...(s.table > 0 ? [fill(c.table, { eur: eur(s.table) })] : []),
    fill(c.savings, { low: eur(Math.max(0, s.savingsLow)), high: eur(s.savingsHigh) }),
    fill(c.score, { score: s.score }), "",
    ...rows.map((r) => `- ${r[0]}: ${r[1]} · ${c.head[2]} ${r[2]} · ${c.head[3]} ${r[3]}`), "",
    ...(blind.length ? [`${c.blind}:`, ...blind.map((b) => `- ${b}`), ""] : []),
    `${c.open}: ${data.resultUrl}`, c.openNote, "",
    ...(bookingUrl ? [`${c.book}: ${bookingUrl}`, c.bookNote, ""] : []),
    c.sign, "", "--", c.footer,
  ];

  const btn = (href, text, primary) =>
    `<a href="${esc(href)}" style="display:inline-block;padding:14px 22px;border-radius:100px;font-weight:600;text-decoration:none;${primary ? "background:#6E29DC;color:#ffffff;" : "border:1px solid #6E29DC;color:#6E29DC;"}">${esc(text)}</a>`;
  const td = "padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;";
  const html = `<!doctype html><html lang="${data.lang}"><body style="margin:0;background:#f5f5f7;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#16161c;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
<div style="height:4px;border-radius:4px;background:linear-gradient(90deg,#03EAFD,#6E29DC,#F62ADE,#F97725);background-color:#6E29DC;"></div>
<div style="background:#ffffff;border-radius:0 0 16px 16px;padding:28px 28px 24px;">
<p style="margin:0 0 12px;">${esc(c.hello)}</p>
<p style="margin:0 0 8px;line-height:1.5;">${esc(fill(c.intro, { n: s.processes.length }))}</p>
<p style="margin:0 0 16px;font-size:40px;font-weight:700;color:#6E29DC;letter-spacing:-1px;">${esc(eur(s.cost))} <span style="font-size:16px;font-weight:400;color:#555;">${esc(c.perYear)}</span></p>
${s.table > 0 ? `<p style="margin:0 0 8px;line-height:1.5;">${esc(fill(c.table, { eur: eur(s.table) }))}</p>` : ""}
<p style="margin:0 0 8px;line-height:1.5;">${esc(fill(c.savings, { low: eur(Math.max(0, s.savingsLow)), high: eur(s.savingsHigh) }))}</p>
<p style="margin:0 0 20px;font-weight:600;">${esc(fill(c.score, { score: s.score }))}</p>
<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 20px;">
<tr>${c.head.map((h) => `<th style="${td}text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#777;">${esc(h)}</th>`).join("")}</tr>
${rows.map((r) => `<tr>${r.map((cell, i) => `<td style="${td}${i === 0 ? "font-weight:600;" : ""}">${esc(cell)}</td>`).join("")}</tr>`).join("\n")}
</table>
${blind.length ? `<p style="margin:0 0 6px;font-weight:600;">${esc(c.blind)}</p><ul style="margin:0 0 20px;padding-left:20px;line-height:1.6;">${blind.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
<p style="margin:0 0 6px;">${btn(data.resultUrl, c.open, true)}</p>
<p style="margin:0 0 20px;font-size:13px;color:#777;line-height:1.5;">${esc(c.openNote)}</p>
${bookingUrl ? `<p style="margin:0 0 6px;">${btn(bookingUrl, c.book, false)}</p><p style="margin:0 0 20px;font-size:13px;color:#777;">${esc(c.bookNote)}</p>` : ""}
<p style="margin:0;white-space:pre-line;line-height:1.5;">${esc(c.sign)}</p>
</div>
<p style="font-size:12px;color:#888;line-height:1.5;padding:16px 8px;">${esc(c.footer)}</p>
</div></body></html>`;
  return { subject, html, text: lines.join("\n") };
}

/** The copy Patrick gets: everything needed to follow up, nothing more. */
export function renderNotification(pack, data) {
  const { eur } = formatters("de");
  const s = data.summary;
  const name = (id) => pack.processes.find((p) => p.id === id)?.label?.de ?? id;
  const text = [
    `E-Mail: ${data.email}`,
    `Persönliche Rückmeldung erlaubt: ${data.followUp ? "JA (die automatische Nachfass-Mail in ~14 Tagen ist diese eine Rückmeldung, also nicht zusätzlich anschreiben, außer auf Antwort)" : "nein (nur Ergebnis senden, nicht kontaktieren)"}`,
    `Sprache: ${data.lang} · Branche: ${s.industry ?? "–"} · Größe: ${s.size ?? "–"} · Pack ${s.packVersion}`,
    "",
    `Kosten: ${eur(s.cost)} · Liegen gelassen: ${eur(s.table)} · Einsparung: ${eur(s.savingsLow)}–${eur(s.savingsHigh)}`,
    `${s.hoursPerWeek} h/Woche · ${s.fte} VZÄ · Potenzial genutzt ${s.score} %`,
    "",
    ...s.processes.map((p) => `- ${name(p.id)}: ${eur(p.cost)} · spart ${eur(p.savingsLow)}–${eur(p.savingsHigh)} · Payback ${p.paybackMonths ?? "–"} Mon. · ${p.approach}`),
    "",
    `Blinde Flecken: ${s.blindSpots.join(", ") || "–"}`,
    `Ergebnis: ${data.resultUrl}`,
  ].join("\n");
  return {
    subject: `[Check] ${eur(s.cost)} · ${s.industry ?? "?"} · ${s.size ?? "?"}${data.followUp ? " · Rückmeldung erwünscht" : ""}`,
    text,
    html: `<pre style="font:14px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap;">${esc(text)}</pre>`,
  };
}
