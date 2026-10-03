// Run with: node --test "tests/**/*.test.mjs"
// End-to-end through the Worker's fetch() and scheduled() with an in-memory KV and a stubbed Brevo.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import worker from "../../workers/check-mailer/src/index.mjs";

class MemoryKV {
  m = new Map();
  async get(k, type) { const v = this.m.get(k); return v === undefined ? null : type === "json" ? JSON.parse(v) : v; }
  async put(k, v) { this.m.set(k, v); }
  async delete(k) { this.m.delete(k); }
  async list({ prefix }) { return { keys: [...this.m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; }
}

const sent = [];
const realFetch = globalThis.fetch;
before(() => { globalThis.fetch = async (url, init) => { sent.push(JSON.parse(init.body)); return new Response("{}", { status: 201 }); }; });
after(() => { globalThis.fetch = realFetch; });

const ORIGIN = "https://www.patrickschnass.de";
const makeEnv = (extra = {}) => ({
  ALLOWED_ORIGINS: ORIGIN, SENDER_EMAIL: "check@example.com", NOTIFY_TO: "owner@example.com",
  BREVO_API_KEY: "test", BOOKING_URL: "https://cal.example/b", FOLLOWUP_DAYS: "0", FOLLOWUPS: new MemoryKV(), ...extra,
});
const payload = (extra = {}) => ({
  email: "visitor@example.com", followUp: true, website: "", lang: "de",
  resultUrl: `${ORIGIN}/de/check/#r=eyJ2IjoxfQ`,
  summary: {
    pack: "back-office-mittelstand", packVersion: "1.1.0", industry: "trade", size: "10-49",
    cost: 76400, table: 0, savingsLow: 1, savingsHigh: 2, hoursPerWeek: 31, fte: 0.9, score: 31,
    processes: [{ id: "quotes", cost: 27900, savingsLow: 8600, savingsHigh: 14200, paybackMonths: 7.6, approach: "agent" }],
    blindSpots: [], top: "quotes", quick: "quotes",
  },
  ...extra,
});
async function post(env, body, origin = ORIGIN) {
  const pending = [];
  const res = await worker.fetch(new Request("https://w.example/", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body) }), env, { waitUntil: (p) => pending.push(p) });
  await Promise.all(pending);
  return res;
}
const queued = (env) => [...env.FOLLOWUPS.m.keys()].filter((k) => k.startsWith("fu:"));

test("result e-mail: visitor mail + copy, one follow-up queued per address", async () => {
  const env = makeEnv();
  sent.length = 0;
  assert.equal((await post(env, payload())).status, 200);
  assert.equal(sent.length, 2);
  assert.equal(sent[0].to[0].email, "visitor@example.com");
  assert.equal(sent[1].to[0].email, "owner@example.com");
  assert.equal(queued(env).length, 1);
  await post(env, payload());
  assert.equal(queued(env).length, 1, "same address, no second follow-up");
});

test("no follow-up without consent", async () => {
  const env = makeEnv();
  await post(env, payload({ followUp: false }));
  assert.equal(queued(env).length, 0);
});

test("CORS, validation and honeypot", async () => {
  const env = makeEnv();
  sent.length = 0;
  assert.equal((await post(env, payload(), "https://evil.example")).status, 403);
  assert.equal((await post(env, payload({ email: "bad" }))).status, 400);
  assert.equal((await post(env, payload({ website: "http://spam" }))).status, 200);
  assert.equal(sent.length, 0, "nothing sent for rejected or spam requests");
});

test("feedback goes to Patrick only", async () => {
  const env = makeEnv();
  sent.length = 0;
  const res = await post(env, { type: "feedback", lang: "de", rating: "high", reason: "setup", website: "", summary: { pack: "back-office-mittelstand", packVersion: "1.1.0", processes: ["quotes"], costBand: "50-100k", score: 31 } });
  assert.equal(res.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to[0].email, "owner@example.com");
});

test("cron sends due follow-ups once and empties the queue", async () => {
  const env = makeEnv();
  await post(env, payload());
  sent.length = 0;
  await worker.scheduled({}, env, {});
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /„Angebote erstellen“/);
  assert.equal(queued(env).length, 0);
  await worker.scheduled({}, env, {});
  assert.equal(sent.length, 1, "nothing sent twice");
});

test("cron leaves follow-ups that aren't due yet", async () => {
  const env = makeEnv({ FOLLOWUP_DAYS: "14" });
  await post(env, payload());
  sent.length = 0;
  await worker.scheduled({}, env, {});
  assert.equal(sent.length, 0);
  assert.equal(queued(env).length, 1);
});

test("demo partners are rejected by the live worker", async () => {
  const env = makeEnv();
  sent.length = 0;
  const res = await post(env, payload({ partner: "demo", partnerCopy: true, resultUrl: `${ORIGIN}/de/check/?partner=demo#r=eyJ2IjoxfQ` }));
  assert.equal(res.status, 400);
  assert.equal(sent.length, 0);
});
