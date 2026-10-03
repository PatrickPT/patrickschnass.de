// Run with: node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CALCULATORS, choiceOptions, checkLink } from "../../assets/check/calculators.mjs";

const pack = JSON.parse(readFileSync(new URL("../../assets/check/packs/back-office-mittelstand.json", import.meta.url)));
const near = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const defaults = (calc) => Object.fromEntries(calc.inputs.map((i) => [i.id, i.value]));

test("every calculator is consistent with the pack", () => {
  for (const [id, calc] of Object.entries(CALCULATORS)) {
    assert.ok(pack.processes.some((p) => p.id === calc.process), `${id}: process`);
    for (const i of calc.inputs) {
      if (i.type === "steps") assert.ok(i.steps.includes(i.value), `${id}.${i.id}: default must be a step`);
      if (i.type === "choice") assert.ok(choiceOptions(pack, i.options).some((o) => o.id === i.value), `${id}.${i.id}: default option`);
      for (const lang of ["de", "en"]) assert.ok(i.label[lang], `${id}.${i.id}: label ${lang}`);
    }
    for (const lang of ["de", "en"]) assert.ok(calc.text[lang]?.cta, `${id}: text ${lang}`);
  }
});

test("skonto: formula and annual interest equivalent", () => {
  const r = CALCULATORS.skonto.compute(pack, { spend: 50000, share: 0.4, rate: 0.02, missed: 0.25 });
  near(r.eur, 50000 * 12 * 0.4 * 0.02 * 0.25);
  near(r.apr, (0.02 / 0.98) * (365 / 20), 1e-6); // ≈ 37 %
  assert.deepEqual(r.link, { p: "invoices", "l.missed": "sometimes", "l.spend": "s2" });
  // "unknown" is never picked as the nearest answer
  assert.notEqual(CALCULATORS.skonto.compute(pack, { spend: 5000, share: 0.4, rate: 0.02, missed: 0.35 }).link["l.missed"], "unknown");
});

test("angebote: uses the check's model, and the what-if follows the pack", () => {
  const r = CALCULATORS.angebote.compute(pack, { volume: 10, minutes: 45, role: "specialists", speed: "week", orderValue: 10000 });
  near(r.eur, 10 * 45 / 60 * 48 * 1.15 * 45 * 1.5);
  near(r.extraOrders, 10 * 48 * 0.03);
  near(r.whatif, 10 * 48 * 0.03 * 10000 * 0.25);
  assert.equal(CALCULATORS.angebote.compute(pack, { ...defaults(CALCULATORS.angebote), speed: "sameday" }).whatif, 0);
});

test("the deep link carries values the check understands", () => {
  const r = CALCULATORS.angebote.compute(pack, defaults(CALCULATORS.angebote));
  const url = new URL(checkLink("https://x.example/de/check/", r.link, "calc-angebote"));
  assert.equal(url.searchParams.get("p"), "quotes");
  assert.equal(url.searchParams.get("from"), "calc-angebote");
  const proc = pack.processes.find((p) => p.id === "quotes");
  for (const q of proc.lever.questions) assert.ok(q.options.some((o) => o.id === url.searchParams.get(`l.${q.id}`)), q.id);
  assert.ok(pack.roles.some((x) => x.id === url.searchParams.get("role")));
});
