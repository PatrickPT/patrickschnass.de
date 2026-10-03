// Run with: node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  computeProcess, computeResult, resolveAssumptions, encodeState, decodeState, validatePack,
} from "../../assets/check/model.mjs";

const pack = JSON.parse(readFileSync(new URL("../../assets/check/packs/back-office-mittelstand.json", import.meta.url)));
const proc = (id) => pack.processes.find((p) => p.id === id);
const near = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test("the shipped pack is valid", () => {
  assert.deepEqual(validatePack(pack), []);
});

test("cost follows the documented formula", () => {
  const a = resolveAssumptions(pack);
  // 10 quotes × 45 min × 48 weeks = 360 h; +15 % rework = 414 h; × €45 × 1.5 (specialists)
  const r = computeProcess(pack, proc("quotes"), { volume: 10, minutes: 45, rework: "sometimes", role: "specialists" }, a);
  near(r.hoursBase, 360);
  near(r.hoursRework, 54);
  near(r.hours, 414);
  near(r.cost, 414 * 45 * 1.5);
  near(r.layers.work + r.layers.rework + r.layers.focus + r.layers.talent, r.cost);
  near(r.layers.talent, 414 * 45 * 0.5);
  // savings = cost × share − running cost; payback = setup ÷ monthly expected savings
  near(r.savings.high, r.cost * 0.55 - 1200);
  near(r.savings.low, r.cost * 0.35 - 1200);
  near(r.paybackMonths, 9000 / (r.savings.high / 12));
});

test("interruptions add lost-focus hours", () => {
  const a = resolveAssumptions(pack);
  const r = computeProcess(pack, proc("emails"), { volume: 100, minutes: 6, rework: "rarely", role: "team", lever: { interrupts: "constantly" } }, a);
  // 100 × 0.6 interruptions × 5 min ÷ 60 × 48 weeks = 240 h
  near(r.hoursFocus, 240);
  near(r.layers.focus, 240 * 45);
  near(r.layers.talent, 0);
});

test("on-the-table levers", () => {
  const a = resolveAssumptions(pack);
  const skonto = computeProcess(pack, proc("invoices"), { volume: 25, minutes: 8, lever: { missed: "sometimes", spend: "s2" } }, a);
  near(skonto.onTable.eur, 60000 * 12 * 0.4 * 0.02 * 0.25);
  const orders = computeProcess(pack, proc("quotes"), { volume: 10, minutes: 45, lever: { speed: "week", orderValue: "v3" } }, a);
  near(orders.onTable.extraOrders, 10 * 48 * 0.03);
  near(orders.onTable.eur, 10 * 48 * 0.03 * 10000 * 0.25);
  const errors = computeProcess(pack, proc("orders"), { volume: 50, minutes: 10, lever: { errors: "monthly" } }, a);
  near(errors.onTable.eur, 12 * 150);
  const half = computeProcess(pack, proc("quotes"), { volume: 10, minutes: 45, lever: { speed: "week" } }, a);
  assert.equal(half.onTable, null, "a lever needs all its answers");
});

test("zero volume is 'no potential', not an error", () => {
  const a = resolveAssumptions(pack);
  const r = computeProcess(pack, proc("orders"), { volume: 0, minutes: 10 }, a);
  assert.equal(r.noPotential, true);
  assert.equal(r.cost, 0);
  assert.equal(r.paybackMonths, Infinity);
});

test("implausible inputs are clamped, not broken", () => {
  const a = resolveAssumptions(pack, { hourlyRate: -5, weeksPerYear: 900, shares: { quotes: 3 } });
  assert.equal(a.hourlyRate, pack.assumptions.hourlyRate.min);
  assert.equal(a.weeksPerYear, 52);
  assert.equal(a.shares.quotes, 1);
  const r = computeProcess(pack, proc("quotes"), { volume: 1e9, minutes: -3 }, a);
  assert.equal(r.volume, proc("quotes").volume.max);
  assert.equal(r.minutes, 0);
});

test("overrides change every figure", () => {
  const state = { processes: ["invoices"], answers: { invoices: { volume: 50, minutes: 8, rework: "sometimes", role: "team" } } };
  const base = computeResult(pack, state);
  const pricier = computeResult(pack, { ...state, overrides: { hourlyRate: 90 } });
  near(pricier.cost, base.cost * 2);
  assert.ok(pricier.savings.high > base.savings.high);
});

test("result ranks by expected savings and picks a quick win", () => {
  const state = {
    guess: "lt10",
    processes: ["scheduling", "quotes", "invoices"],
    answers: {
      scheduling: { volume: 10, minutes: 5, rework: "rarely", role: "team" },
      quotes: { volume: 25, minutes: 90, rework: "often", role: "owner" },
      invoices: { volume: 50, minutes: 8, rework: "sometimes", role: "team" },
    },
    reflections: { keyPerson: 0, growth: 1, visibility: 2, data: 0, ownerTime: 1 },
  };
  const r = computeResult(pack, state);
  assert.deepEqual(r.processes.map((p) => p.id), ["quotes", "invoices", "scheduling"]);
  assert.equal(r.top.id, "quotes");
  assert.ok(r.quick.paybackMonths <= r.top.paybackMonths);
  assert.equal(r.guessVerdict, "under");
  assert.deepEqual(r.blindSpots, ["keyPerson", "growth", "data", "ownerTime"]);
  assert.ok(r.score >= 0 && r.score <= 100);
  near(r.hoursPerWeek, r.hours / 48);
});

test("share links round-trip and drop unknown data", () => {
  const state = {
    industry: "trade", size: "10-49", guess: "25-50",
    processes: ["quotes", "invoices"],
    answers: {
      quotes: { volume: 10, minutes: 45, rework: "sometimes", role: "specialists", lever: { speed: "week", orderValue: "v2" } },
      invoices: { volume: 25, minutes: 8, rework: "rarely", role: "team", lever: { missed: "often", spend: "s1" } },
    },
    reflections: { keyPerson: 1, data: 0 },
    overrides: { hourlyRate: 52, shares: { quotes: 0.4 } },
  };
  const back = decodeState(pack, encodeState(pack, state));
  assert.deepEqual(back, state);
  assert.equal(decodeState(pack, "not-a-valid-link"), null);
  const tampered = encodeState(pack, { ...state, processes: ["quotes", "hacking"], answers: { ...state.answers, quotes: { ...state.answers.quotes, role: "<script>" } } });
  const clean = decodeState(pack, tampered);
  assert.deepEqual(clean.processes, ["quotes"]);
  assert.equal(clean.answers.quotes.role, null);
});

test("pack validation names the broken field", () => {
  const broken = structuredClone(pack);
  broken.processes[2].approach = "magic";
  delete broken.processes[0].label.en;
  broken.assumptions.hourlyRate.value = 9999;
  const errors = validatePack(broken);
  assert.ok(errors.some((e) => e.startsWith("processes[2].approach")));
  assert.ok(errors.some((e) => e.startsWith("processes[0].label")));
  assert.ok(errors.some((e) => e.startsWith("assumptions.hourlyRate.value")));
});

test("a second, minimal pack works without engine changes", () => {
  const mini = structuredClone(pack);
  mini.id = "test-niche";
  mini.processes = [{ ...structuredClone(proc("reporting")), id: "timesheets" }];
  assert.deepEqual(validatePack(mini), []);
  const r = computeResult(mini, { processes: ["timesheets"], answers: { timesheets: { volume: 5, minutes: 60 } } });
  assert.equal(r.processes.length, 1);
  assert.ok(r.cost > 0);
});
