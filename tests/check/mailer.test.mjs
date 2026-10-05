// Run with: node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validatePayload, renderVisitorEmail, renderNotification, validateFeedback, renderFeedbackNotification } from "../../workers/check-mailer/src/email.mjs";

const pack = JSON.parse(readFileSync(new URL("../../assets/check/packs/back-office-mittelstand.json", import.meta.url)));
const prefixes = ["https://www.patrickschnass.de/check/#r=", "https://www.patrickschnass.de/de/check/#r="];
const valid = () => ({
  email: "anna@example.com", followUp: true, website: "", lang: "de",
  resultUrl: "https://www.patrickschnass.de/de/check/#r=eyJ2IjoxfQ",
  summary: {
    pack: pack.id, packVersion: pack.version, industry: "trade", size: "10-49",
    cost: 76400, table: 37400, savingsLow: 23000, savingsHigh: 40000, hoursPerWeek: 31, fte: 0.9, score: 31,
    processes: [
      { id: "emails", cost: 40200, savingsLow: 12300, savingsHigh: 20300, paybackMonths: 5.3, approach: "agent" },
      { id: "invoices", cost: 8280, savingsLow: 3050, savingsHigh: 5120, paybackMonths: null, approach: "extraction" },
    ],
    blindSpots: ["keyPerson", "data"], top: "emails", quick: "emails",
  },
});
const check = (body) => validatePayload(pack, body, { resultPrefixes: prefixes });

test("a valid payload passes and is cleaned", () => {
  const r = check({ ...valid(), extra: "<script>" });
  assert.equal(r.ok, true);
  assert.equal(r.spam, false);
  assert.equal(r.data.extra, undefined);
  assert.equal(r.data.summary.processes.length, 2);
});

test("bad input is rejected with the field name", () => {
  const cases = [
    [(b) => { b.email = "not-an-email"; }, "email"],
    [(b) => { b.email = "a@b.de\r\nBcc: x@y.z"; }, "email"],
    [(b) => { b.lang = "fr"; }, "lang"],
    [(b) => { b.resultUrl = "https://evil.example/#r=abc"; }, "resultUrl"],
    [(b) => { b.resultUrl = "https://www.patrickschnass.de/check/#r=abc\"><script>"; }, "resultUrl"],
    [(b) => { b.summary.pack = "other"; }, "summary"],
    [(b) => { b.summary.cost = "lots"; }, "summary.cost"],
    [(b) => { b.summary.score = 400; }, "summary.figures"],
    [(b) => { b.summary.industry = "<b>hi</b>"; }, "summary.industry"],
    [(b) => { b.summary.processes[0].id = "free text"; }, "summary.processes"],
    [(b) => { b.summary.processes = []; }, "summary.processes"],
    [(b) => { b.summary.blindSpots = ["Buy cheap pills"]; }, "summary.blindSpots"],
    [(b) => { b.summary.top = "quotes"; }, "summary.top"],
  ];
  for (const [mutate, field] of cases) {
    const b = valid();
    mutate(b);
    assert.deepEqual(check(b), { ok: false, error: field }, field);
  }
});

test("the honeypot marks spam without telling the bot", () => {
  const r = check({ ...valid(), website: "http://spam" });
  assert.equal(r.ok, true);
  assert.equal(r.spam, true);
});

test("the visitor e-mail contains the result and escapes everything", () => {
  const r = check(valid());
  const mail = renderVisitorEmail(pack, r.data, { bookingUrl: "https://calendar.example/book" });
  assert.match(mail.subject, /76\.400/);
  assert.match(mail.html, /Kundenanfragen per E-Mail/);
  assert.match(mail.html, /Ihre Prozesse wohnen in Köpfen/);
  assert.match(mail.html, /https:\/\/www\.patrickschnass\.de\/de\/check\/#r=eyJ2IjoxfQ/);
  assert.match(mail.text, /calendar\.example\/book/);
  assert.doesNotMatch(mail.html, /<script/);
  const en = renderVisitorEmail(pack, { ...r.data, lang: "en" });
  assert.match(en.subject, /€76,400/);
  assert.doesNotMatch(en.html, /calendar/);
});

test("the notification tells Patrick whether a follow-up is allowed", () => {
  const r = check(valid());
  assert.match(renderNotification(pack, r.data).text, /Rückmeldung erlaubt: JA/);
  const no = check({ ...valid(), followUp: false });
  assert.match(renderNotification(pack, no.data).text, /nicht kontaktieren/);
});

const feedback = () => ({
  type: "feedback", lang: "en", rating: "high", reason: "setup", website: "",
  summary: { pack: pack.id, packVersion: pack.version, processes: ["quotes", "emails"], costBand: "50-100k", score: 31 },
});

test("feedback: valid input passes and only known fields survive", () => {
  const r = validateFeedback(pack, { ...feedback(), email: "someone@example.com" });
  assert.equal(r.ok, true);
  assert.equal(r.data.email, undefined);
  assert.deepEqual(r.data.summary.processes, ["quotes", "emails"]);
  assert.equal(validateFeedback(pack, { ...feedback(), rating: "right", reason: null }).ok, true);
});

test("feedback: bad input is rejected with the field name", () => {
  const cases = [
    [(b) => { b.type = "mail"; }, "type"],
    [(b) => { b.rating = "terrible <b>"; }, "rating"],
    [(b) => { b.reason = "Buy pills"; }, "reason"],
    [(b) => { b.summary.processes = ["quotes", "free text"]; }, "summary.processes"],
    [(b) => { b.summary.costBand = "1 million"; }, "summary.costBand"],
    [(b) => { b.summary.score = -1; }, "summary.score"],
  ];
  for (const [mutate, field] of cases) {
    const b = feedback();
    mutate(b);
    assert.deepEqual(validateFeedback(pack, b), { ok: false, error: field }, field);
  }
});

test("feedback: the note to Patrick is readable and escaped", () => {
  const note = renderFeedbackNotification(pack, validateFeedback(pack, feedback()).data);
  assert.match(note.subject, /ZU HOCH · Einrichtungskosten · 50-100k/);
  assert.match(note.text, /Angebote erstellen, Kundenanfragen per E-Mail/);
  assert.doesNotMatch(note.html, /<script/);
});
