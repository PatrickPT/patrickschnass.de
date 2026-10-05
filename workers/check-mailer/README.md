# check-mailer

Sends the result of the KI-Potenzial-Check (`/check/`) to the visitor by e-mail when they ask for
it, plus a copy to Patrick. The check itself runs entirely in the browser; this Worker is the only
place answers ever go, and only after the visitor submits the e-mail form.

**Why custom code:** a static site can't send a personalised e-mail, and form services can't
render the computed result. This is the smallest piece that fills that gap. It's about 80 lines,
has no dependencies, and uses the same pack file as the page.

## How it works

```
browser ──POST JSON──▶ Worker ──▶ validate (ids + bounded numbers only)
                                   ├─▶ Brevo: result e-mail to the visitor
                                   └─▶ Brevo: copy to NOTIFY_TO (reply-to = visitor)
```

- **CORS:** only `ALLOWED_ORIGINS` may call it.
- **Abuse:** a honeypot field, a 16 KB body limit, and rate limits (3/min per IP and per recipient).
  The e-mail is built from validated ids and numbers only, so no free text from the request ever
  reaches an inbox.
- **Contract:** `{ email, followUp, lang, website, resultUrl, summary }`, built in
  `assets/check/app.mjs` → `mailPayload`. Validation lives in `src/email.mjs` and is unit-tested
  in `tests/check/mailer.test.mjs`.
- **Feedback** ("Do these numbers feel right?"): `{ type: "feedback", lang, rating, reason, summary }`
  with ids, a cost band and the score only. It sends a one-line note to `NOTIFY_TO` and never
  e-mails the visitor. Built in `app.mjs` → `feedbackPayload`.

## Deploy (one-off, about 30 minutes)

1. **Brevo** (EU, free tier 300 mails/day): create an account, then sign the data processing
   agreement (DPA) in the account settings. Add and verify `patrickschnass.de` as a sender domain:
   Brevo shows the SPF/DKIM/DMARC DNS records to add. Create an API key (SMTP & API → API keys).
2. **Cloudflare:** create a free account. Then from this folder:
   ```bash
   npx wrangler@latest login
   npx wrangler@latest secret put BREVO_API_KEY
   npx wrangler@latest secret put NOTIFY_TO
   npx wrangler@latest deploy
   ```
   Wrangler prints the URL, e.g. `https://check-mailer.<account>.workers.dev`.
3. **Website:** put that URL into `hugo.toml` → `[params.check] mailer = "…"` and deploy. The
   e-mail form appears on the result page as soon as the value is set.
4. **Smoke test:** run the check on the live site, send it to your own address, and check that
   both e-mails arrive and the link in them opens the full result.

## Local testing

`hugo server` shows the form with a mock endpoint (nothing is sent, the payload is logged to the
browser console). `npx wrangler dev` runs the Worker locally. Without `BREVO_API_KEY` it answers
502 after validation, which is enough to test the validation and CORS.
