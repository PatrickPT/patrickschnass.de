/*
 * KI-Potenzial-Check: the € model. Pure functions only, no DOM, so the same file runs in the
 * browser (bundled by Hugo's js.Build), in the mailer worker and in `node --test`.
 *
 * Per process (all figures per year):
 *   hours_base   = volume/week × minutes/item ÷ 60 × weeks
 *   hours_rework = hours_base × rework_share
 *   hours_focus  = volume/week × interruption_share × refocus_minutes ÷ 60 × weeks
 *   cost         = (hours_base + hours_rework + hours_focus) × hourly_rate × role_factor
 *   savings      = cost × automation_share − running_cost        (conservative / expected)
 *   payback      = setup_cost ÷ (savings_expected ÷ 12)            months
 * "On the table" levers (Skonto, errors, lost orders) are money, not time, and are reported apart.
 */

export const LANGS = ["de", "en"];
const LEVER_TYPES = ["whatif_orders", "skonto", "errors", "interruptions", "insight"];
const APPROACHES = ["rules", "extraction", "agent"];
const EFFORTS = ["S", "M", "L"];
const SCALE = [0, 0.5, 1]; // reflection answers: not really / partly / yes

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
const byId = (list, id) => list.find((x) => x.id === id);

/** Pack defaults merged with the visitor's overrides, clamped to the pack's plausible ranges. */
export function resolveAssumptions(pack, overrides = {}) {
  const a = {};
  for (const [key, def] of Object.entries(pack.assumptions)) {
    const o = num(overrides[key]);
    a[key] = Number.isNaN(o) ? def.value : clamp(o, def.min, def.max);
  }
  a.roleFactors = {};
  for (const role of pack.roles) {
    const o = num(overrides.roles?.[role.id]);
    a.roleFactors[role.id] = Number.isNaN(o) ? role.factor : clamp(o, 1, 10);
  }
  a.shares = {};
  for (const proc of pack.processes) {
    const o = num(overrides.shares?.[proc.id]);
    a.shares[proc.id] = Number.isNaN(o) ? proc.automation.expected : clamp(o, 0, 1);
  }
  return a;
}

/** The value of the chosen option of a lever question, or null if unanswered. */
function leverValue(proc, answer, questionId) {
  const q = proc.lever?.questions.find((x) => x.id === questionId);
  const opt = q && byId(q.options, answer?.lever?.[questionId]);
  return opt && typeof opt.value === "number" ? opt.value : null;
}

/** The personal note attached to the visitor's lever answers (first one that has a note). */
export function leverNote(proc, answer) {
  for (const q of proc.lever?.questions ?? []) {
    const opt = byId(q.options, answer?.lever?.[q.id]);
    if (opt?.note) return opt.note;
  }
  return null;
}

/** Money on the table for one process: what the lever puts at stake per year. */
function onTable(proc, answer, a, weeklyVolume) {
  const lever = proc.lever;
  if (!lever) return null;
  if (lever.type === "whatif_orders") {
    const uplift = leverValue(proc, answer, "speed");
    const value = leverValue(proc, answer, "orderValue");
    if (uplift === null || value === null) return null;
    const extraOrders = weeklyVolume * a.weeksPerYear * uplift;
    return { type: lever.type, eur: extraOrders * value * a.margin, extraOrders, uplift, orderValue: value };
  }
  if (lever.type === "skonto") {
    const missed = leverValue(proc, answer, "missed");
    const spend = leverValue(proc, answer, "spend");
    if (missed === null || spend === null) return null;
    return { type: lever.type, eur: spend * 12 * a.skontoShare * a.skontoRate * missed, missed, spend };
  }
  if (lever.type === "errors") {
    const perYear = leverValue(proc, answer, "errors");
    if (perYear === null) return null;
    return { type: lever.type, eur: perYear * a.errorCost, perYear };
  }
  return null;
}

function interruptionShare(proc, answer) {
  if (proc.lever?.type !== "interruptions") return 0;
  return leverValue(proc, answer, proc.lever.questions[0].id) ?? 0;
}

/** Everything the result page shows for one process. */
export function computeProcess(pack, proc, answer, a) {
  const volume = clamp(num(answer?.volume) || 0, proc.volume.min, proc.volume.max);
  const minutes = clamp(num(answer?.minutes) || 0, proc.minutes.min, proc.minutes.max);
  const reworkShare = byId(pack.rework, answer?.rework)?.value ?? 0;
  const role = byId(pack.roles, answer?.role) ?? pack.roles[0];
  const factor = a.roleFactors[role.id];
  const rate = a.hourlyRate;

  const hoursBase = (volume * minutes / 60) * a.weeksPerYear;
  const hoursRework = hoursBase * reworkShare;
  const focusShare = interruptionShare(proc, answer);
  const hoursFocus = volume * focusShare * (a.refocusMinutes / 60) * a.weeksPerYear;
  const hours = hoursBase + hoursRework + hoursFocus;

  // The cost layers add up to `cost`: the work itself, doing it twice, lost focus, and the premium
  // paid when more expensive people do the work.
  const layers = {
    work: hoursBase * rate,
    rework: hoursRework * rate,
    focus: hoursFocus * rate,
    talent: hours * rate * (factor - 1),
  };
  const cost = layers.work + layers.rework + layers.focus + layers.talent;

  const expected = a.shares[proc.id];
  // The conservative share keeps the pack's ratio to the expected one when the visitor moves it.
  const ratio = proc.automation.expected > 0 ? proc.automation.conservative / proc.automation.expected : 0;
  const conservative = expected * ratio;
  const run = proc.runEurPerYear;
  const savings = { low: cost * conservative - run, high: cost * expected - run };
  const paybackMonths = savings.high > 0 ? proc.setupEur / (savings.high / 12) : Infinity;

  return {
    id: proc.id, volume, minutes, reworkShare, role: role.id, factor, focusShare,
    hours, hoursBase, hoursRework, hoursFocus, layers, cost,
    shares: { conservative, expected }, savings, paybackMonths,
    setup: proc.setupEur, run, approach: proc.approach, effort: proc.effort,
    onTable: onTable(proc, answer, a, volume),
    note: leverNote(proc, answer),
    noPotential: volume === 0 || minutes === 0,
  };
}

/** Share of the possible score (0–1) a reflection answer is worth. */
export const reflectionScore = (idx) => SCALE[idx] ?? null;

/** The whole result: processes ranked by expected savings, totals, the potential score and blind spots. */
export function computeResult(pack, state) {
  const a = resolveAssumptions(pack, state.overrides);
  const processes = (state.processes ?? [])
    .map((id) => byId(pack.processes, id))
    .filter(Boolean)
    .map((proc) => computeProcess(pack, proc, state.answers?.[proc.id], a))
    .sort((x, y) => y.savings.high - x.savings.high);

  const sum = (f) => processes.reduce((s, p) => s + f(p), 0);
  const layers = {
    work: sum((p) => p.layers.work),
    rework: sum((p) => p.layers.rework),
    focus: sum((p) => p.layers.focus),
    talent: sum((p) => p.layers.talent),
  };
  const cost = sum((p) => p.cost);
  const hours = sum((p) => p.hours);
  const table = sum((p) => p.onTable?.eur ?? 0);
  const savingsHigh = sum((p) => Math.max(0, p.savings.high));
  const savingsLow = sum((p) => Math.max(0, p.savings.low));

  // Potential score: half from how much of the routine cost could be automated (the more, the
  // further from the potential today), half from the five honest answers.
  const automatable = cost > 0 ? clamp(sum((p) => Math.max(0, p.cost * p.shares.expected)) / cost, 0, 1) : 0;
  const answered = pack.reflections.map((r) => reflectionScore(state.reflections?.[r.id])).filter((s) => s !== null);
  const honesty = answered.length ? answered.reduce((s, x) => s + x, 0) / answered.length : 0.5;
  const score = Math.round(100 * (0.5 * (1 - automatable) + 0.5 * honesty));

  const blindSpots = pack.reflections
    .filter((r) => { const s = reflectionScore(state.reflections?.[r.id]); return s !== null && s < 1; })
    .map((r) => r.id);

  const growthFte = (hours * a.growth) / a.hoursPerFte;
  const guess = byId(pack.guess, state.guess);
  const hoursPerWeek = hours / a.weeksPerYear;
  let guessVerdict = null;
  if (guess && typeof guess.min === "number") {
    guessVerdict = hoursPerWeek > guess.max ? "under" : hoursPerWeek < guess.min ? "over" : "match";
  } else if (guess) {
    guessVerdict = "unknown";
  }

  const ranked = processes.filter((p) => !p.noPotential && p.savings.high > 0);
  const top = ranked[0] ?? null;
  const quick = ranked.reduce((best, p) => (!best || p.paybackMonths < best.paybackMonths ? p : best), null);

  return {
    assumptions: a, processes, layers, cost, hours, hoursPerWeek, table,
    savings: { low: savingsLow, high: savingsHigh },
    fte: hours / a.hoursPerFte, workdays: hours / 8, growthFte,
    automatable, honesty, score, blindSpots, guessVerdict, top, quick,
  };
}

/* ---------- Share links: the answers live in the URL fragment, which browsers never send ---------- */

const toB64 = (s) => (typeof btoa === "function" ? btoa(s) : Buffer.from(s, "binary").toString("base64"));
const fromB64 = (s) => (typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary"));

export function encodeState(pack, state) {
  const compact = {
    v: 1, p: pack.id, i: state.industry, s: state.size, g: state.guess,
    q: (state.processes ?? []).map((id) => {
      const x = state.answers?.[id] ?? {};
      return [id, x.volume ?? null, x.minutes ?? null, x.rework ?? null, x.role ?? null, x.lever ?? {}];
    }),
    r: state.reflections ?? {},
    o: state.overrides ?? {},
  };
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  return toB64(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decodes a share link back into state. Anything unknown to the pack is dropped. */
export function decodeState(pack, encoded) {
  try {
    const bin = fromB64(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const raw = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    if (raw.v !== 1 || raw.p !== pack.id || !Array.isArray(raw.q)) return null;
    const ids = (list) => new Set(list.map((x) => x.id));
    const state = {
      industry: ids(pack.industries).has(raw.i) ? raw.i : null,
      size: ids(pack.sizes).has(raw.s) ? raw.s : null,
      guess: ids(pack.guess).has(raw.g) ? raw.g : null,
      processes: [], answers: {}, reflections: {}, overrides: {},
    };
    for (const [id, volume, minutes, rework, role, lever] of raw.q.slice(0, 10)) {
      const proc = byId(pack.processes, id);
      if (!proc || state.processes.includes(id)) continue;
      state.processes.push(id);
      const cleanLever = {};
      for (const q of proc.lever?.questions ?? []) {
        if (byId(q.options, lever?.[q.id])) cleanLever[q.id] = lever[q.id];
      }
      state.answers[id] = {
        volume: Number.isFinite(volume) ? clamp(volume, proc.volume.min, proc.volume.max) : null,
        minutes: Number.isFinite(minutes) ? clamp(minutes, proc.minutes.min, proc.minutes.max) : null,
        rework: byId(pack.rework, rework) ? rework : null,
        role: byId(pack.roles, role) ? role : null,
        lever: cleanLever,
      };
    }
    for (const r of pack.reflections) {
      if (reflectionScore(raw.r?.[r.id]) !== null) state.reflections[r.id] = raw.r[r.id];
    }
    const o = raw.o ?? {};
    for (const key of Object.keys(pack.assumptions)) if (Number.isFinite(o[key])) state.overrides[key] = o[key];
    for (const group of ["roles", "shares"]) {
      if (o[group] && typeof o[group] === "object") {
        state.overrides[group] = Object.fromEntries(Object.entries(o[group]).filter(([, v]) => Number.isFinite(v)));
      }
    }
    return state.processes.length ? state : null;
  } catch {
    return null;
  }
}

/* ---------- Pack validation: a new niche is a data file, so the data file has to be checked ---------- */

const isText = (x) => x && typeof x === "object" && LANGS.every((l) => typeof x[l] === "string" && x[l].length > 0);

/** Returns a list of problems, each naming the field. An empty list means the pack is valid. */
export function validatePack(pack) {
  const errors = [];
  const need = (cond, path, msg) => { if (!cond) errors.push(`${path}: ${msg}`); };
  const text = (x, path) => need(isText(x), path, "needs non-empty 'de' and 'en' text");
  const uniqueIds = (list, path) => {
    need(Array.isArray(list) && list.length > 0, path, "must be a non-empty list");
    if (!Array.isArray(list)) return;
    const seen = new Set();
    list.forEach((x, i) => {
      need(typeof x?.id === "string" && x.id.length > 0, `${path}[${i}].id`, "missing");
      need(!seen.has(x?.id), `${path}[${i}].id`, `duplicate id '${x?.id}'`);
      seen.add(x?.id);
    });
  };

  need(typeof pack?.id === "string" && /^[a-z0-9-]+$/.test(pack.id), "id", "must be lower-case kebab-case");
  need(typeof pack?.version === "string" && /^\d+\.\d+\.\d+$/.test(pack.version), "version", "must be semver like 1.0.0");
  text(pack?.title, "title");

  const required = ["hourlyRate", "weeksPerYear", "hoursPerFte", "refocusMinutes", "margin", "skontoShare", "skontoRate", "errorCost", "growth"];
  for (const key of required) {
    const def = pack?.assumptions?.[key];
    const path = `assumptions.${key}`;
    need(def && typeof def === "object", path, "missing");
    if (!def) continue;
    need([def.value, def.min, def.max].every(Number.isFinite), path, "needs numeric value, min and max");
    need(def.min <= def.value && def.value <= def.max, `${path}.value`, "must lie between min and max");
    text(def.label, `${path}.label`);
  }

  uniqueIds(pack?.roles, "roles");
  (pack?.roles ?? []).forEach((r, i) => {
    need(Number.isFinite(r.factor) && r.factor >= 1, `roles[${i}].factor`, "must be a number ≥ 1");
    text(r.label, `roles[${i}].label`);
    if (r.takeNote) text(r.takeNote, `roles[${i}].takeNote`);
  });
  uniqueIds(pack?.rework, "rework");
  (pack?.rework ?? []).forEach((r, i) => need(Number.isFinite(r.value) && r.value >= 0 && r.value <= 1, `rework[${i}].value`, "must be 0–1"));
  for (const k of APPROACHES) { text(pack?.approaches?.[k]?.label, `approaches.${k}.label`); text(pack?.approaches?.[k]?.desc, `approaches.${k}.desc`); }
  for (const k of EFFORTS) text(pack?.efforts?.[k], `efforts.${k}`);
  for (const list of ["industries", "sizes", "guess"]) {
    uniqueIds(pack?.[list], list);
    (pack?.[list] ?? []).forEach((x, i) => text(x.label, `${list}[${i}].label`));
  }
  uniqueIds(pack?.reflections, "reflections");
  (pack?.reflections ?? []).forEach((r, i) => {
    ["statement", "title", "body"].forEach((f) => text(r[f], `reflections[${i}].${f}`));
    if (r.takeNote) text(r.takeNote, `reflections[${i}].takeNote`);
  });

  uniqueIds(pack?.processes, "processes");
  (pack?.processes ?? []).forEach((p, i) => {
    const path = `processes[${i}]`;
    ["label", "desc", "unit"].forEach((f) => text(p[f], `${path}.${f}`));
    if (p.takeNote) text(p.takeNote, `${path}.takeNote`);
    if (p.startSteps !== undefined) {
      need(Array.isArray(p.startSteps) && p.startSteps.length > 0, `${path}.startSteps`, "must be a non-empty list");
      (p.startSteps ?? []).forEach((st, k) => text(st, `${path}.startSteps[${k}]`));
    }
    for (const f of ["volume", "minutes"]) {
      const d = p[f];
      need(d && Array.isArray(d.options) && d.options.length > 0 && d.options.every(Number.isFinite), `${path}.${f}.options`, "needs a list of numbers");
      need(d && Number.isFinite(d.min) && Number.isFinite(d.max) && d.min < d.max, `${path}.${f}`, "needs min < max");
    }
    need(APPROACHES.includes(p.approach), `${path}.approach`, `must be one of ${APPROACHES.join(", ")}`);
    need(EFFORTS.includes(p.effort), `${path}.effort`, `must be one of ${EFFORTS.join(", ")}`);
    const au = p.automation;
    need(au && au.conservative >= 0 && au.conservative <= au.expected && au.expected <= 1, `${path}.automation`, "needs 0 ≤ conservative ≤ expected ≤ 1");
    need(Number.isFinite(p.setupEur) && p.setupEur >= 0, `${path}.setupEur`, "must be a number ≥ 0");
    need(Number.isFinite(p.runEurPerYear) && p.runEurPerYear >= 0, `${path}.runEurPerYear`, "must be a number ≥ 0");
    if (p.lever) {
      need(LEVER_TYPES.includes(p.lever.type), `${path}.lever.type`, `must be one of ${LEVER_TYPES.join(", ")}`);
      if (p.lever.type !== "insight") text(p.lever.label, `${path}.lever.label`);
      uniqueIds(p.lever.questions, `${path}.lever.questions`);
      (p.lever.questions ?? []).forEach((q, j) => {
        const qp = `${path}.lever.questions[${j}]`;
        text(q.label, `${qp}.label`);
        uniqueIds(q.options, `${qp}.options`);
        (q.options ?? []).forEach((o, k) => {
          text(o.label, `${qp}.options[${k}].label`);
          if (o.note) text(o.note, `${qp}.options[${k}].note`);
          if (p.lever.type !== "insight") need(Number.isFinite(o.value), `${qp}.options[${k}].value`, "must be a number");
        });
      });
      const qids = (p.lever.questions ?? []).map((q) => q.id);
      const expectIds = { whatif_orders: ["speed", "orderValue"], skonto: ["missed", "spend"], errors: ["errors"] }[p.lever.type];
      if (expectIds) need(expectIds.every((id) => qids.includes(id)), `${path}.lever.questions`, `type '${p.lever.type}' needs questions ${expectIds.join(", ")}`);
    }
  });
  return errors;
}
