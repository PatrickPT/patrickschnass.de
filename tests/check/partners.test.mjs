// Run with: node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validatePartners, partnerFor } from "../../assets/check/model.mjs";
import { validatePayload, renderNotification } from "../../workers/check-mailer/src/email.mjs";

const pack = JSON.parse(readFileSync(new URL("../../assets/check/packs/back-office-mittelstand.json", import.meta.url)));
const shipped = JSON.parse(readFileSync(new URL("../../assets/check/partners.json", import.meta.url)));
const real = { "kanzlei-x": { name: "Kanzlei X", accent: "#123456", contactUrl: "https://kanzlei-x.example/kontakt", contactLabel: { de: "Termin bei Kanzlei X", en: "Talk to Kanzlei X" } } };
const partners = { ...shipped, ...real };

test("the shipped partner file is valid", () => {
  assert.deepEqual(validatePartners(shipped), []);
  assert.deepEqual(validatePartners(partners), []);
});

test("partner validation names the broken field", () => {
  const errors = validatePartners({ "Bad Id": { name: "", accent: "blue", contactUrl: "http://x", contactLabel: { de: "x" }, logo: "https://elsewhere/logo.png" } });
  for (const field of ["partners.Bad Id:", "partners.Bad Id.name", "partners.Bad Id.accent", "partners.Bad Id.contactUrl", "partners.Bad Id.contactLabel", "partners.Bad Id.logo"]) {
    assert.ok(errors.some((e) => e.startsWith(field)), field);
  }
});

test("partnerFor: real partners anywhere, demo partners only on the dev server", () => {
  assert.equal(partnerFor(partners, "kanzlei-x").name, "Kanzlei X");
  assert.equal(partnerFor(partners, "demo"), null);
  assert.equal(partnerFor(partners, "demo", { dev: true }).id, "demo");
  assert.equal(partnerFor(partners, "unknown"), null);
  assert.equal(partnerFor(partners, "<script>"), null);
  assert.equal(partnerFor(partners, null), null);
});

const prefixes = ["https://www.patrickschnass.de/check/#r=", "https://www.patrickschnass.de/de/check/#r="];
const body = (extra = {}) => ({
  email: "anna@example.com", followUp: false, website: "", lang: "de",
  resultUrl: "https://www.patrickschnass.de/de/check/?partner=kanzlei-x#r=eyJ2IjoxfQ",
  partner: "kanzlei-x", partnerCopy: true,
  summary: {
    pack: pack.id, packVersion: pack.version, industry: "trade", size: "10-49", cost: 50000, table: 0, savingsLow: 1, savingsHigh: 2,
    hoursPerWeek: 20, fte: 0.6, score: 40, processes: [{ id: "quotes", cost: 50000, savingsLow: 1, savingsHigh: 2, paybackMonths: null, approach: "agent" }],
    blindSpots: [], top: "quotes", quick: "quotes",
  },
  ...extra,
});
const check = (b) => validatePayload(pack, b, { resultPrefixes: prefixes, partners });

test("mailer: partner links and consented copies are accepted", () => {
  const r = check(body());
  assert.equal(r.ok, true);
  assert.equal(r.data.partner, "kanzlei-x");
  assert.equal(r.data.partnerName, "Kanzlei X");
  assert.equal(r.data.partnerCopy, true);
  assert.equal(check(body({ partner: null, partnerCopy: false, resultUrl: "https://www.patrickschnass.de/de/check/#r=eyJ2IjoxfQ" })).ok, true);
});

test("mailer: unknown or demo partners and copies without a partner are rejected", () => {
  assert.deepEqual(check(body({ partner: "nobody" })), { ok: false, error: "partner" });
  assert.deepEqual(check(body({ partner: "demo" })), { ok: false, error: "partner" });
  assert.deepEqual(check(body({ partner: null, partnerCopy: true })), { ok: false, error: "partnerCopy" });
  assert.deepEqual(check(body({ resultUrl: "https://www.patrickschnass.de/de/check/?partner=x&evil=1#r=abc" })), { ok: false, error: "resultUrl" });
});

test("notification: the partner copy is addressed to the partner, Patrick's mentions the partner", () => {
  const data = check(body({ followUp: true })).data;
  const owner = renderNotification(pack, data);
  assert.match(owner.subject, /via kanzlei-x/);
  assert.match(owner.text, /Kopie an Partner: ja/);
  const copy = renderNotification(pack, data, { audience: "partner" });
  assert.match(copy.subject, /über Kanzlei X/);
  assert.match(copy.text, /ausdrücklich an Kanzlei X freigegeben/);
  assert.doesNotMatch(copy.text, /nicht zusätzlich anschreiben/);
});
