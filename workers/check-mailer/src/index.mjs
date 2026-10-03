/*
 * check-mailer: receives the opt-in from the KI-Potenzial-Check (/check/) and sends the visitor
 * their result by e-mail, plus a copy to Patrick. Cloudflare Worker + Brevo transactional API.
 *
 * Gap it fills: a static site can't send a personalised e-mail, and form services can't render
 * the computed result. Contract (see assets/check/app.mjs → mailPayload / feedbackPayload):
 *   POST { email, followUp, lang, website, resultUrl, summary }        → result e-mail + copy
 *   POST { type: "feedback", lang, rating, reason, website, summary }  → note to Patrick only
 * Any other engine (e.g. a Windmill webhook) can take over by honouring the same contract.
 */
import pack from "../../../assets/check/packs/back-office-mittelstand.json";
import { validatePayload, renderVisitorEmail, renderNotification, validateFeedback, renderFeedbackNotification } from "./email.mjs";

const MAX_BODY = 16 * 1024;

export default {
  async fetch(request, env, ctx) {
    const origins = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const origin = request.headers.get("Origin") || "";
    const cors = origins.includes(origin)
      ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" }
      : null;
    const json = (body, status) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...(cors ?? {}) } });

    if (request.method === "OPTIONS") return new Response(null, { status: cors ? 204 : 403, headers: cors ?? {} });
    if (request.method !== "POST") return json({ error: "method" }, 405);
    if (!cors) return json({ error: "origin" }, 403);

    // Two limits: per sender IP, and per recipient so one address can't be flooded from many IPs.
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (env.LIMITER && !(await env.LIMITER.limit({ key: `ip:${ip}` })).success) return json({ error: "rate" }, 429);

    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: "size" }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: "json" }, 400); }

    const sender = { name: env.SENDER_NAME || "Patrick Schnaß", email: env.SENDER_EMAIL };
    const send = (message) => fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sender, tags: ["potential-check"], ...message }),
    });

    // Feedback on the result ("Do these numbers feel right?"): only a note to Patrick, no visitor e-mail.
    if (body?.type === "feedback") {
      const fb = validateFeedback(pack, body);
      if (!fb.ok) return json({ error: fb.error }, 400);
      if (fb.spam || !env.NOTIFY_TO) return json({ ok: true }, 200);
      const note = renderFeedbackNotification(pack, fb.data);
      const res = await send({ to: [{ email: env.NOTIFY_TO }], subject: note.subject, htmlContent: note.html, textContent: note.text });
      return res.ok ? json({ ok: true }, 200) : json({ error: "send" }, 502);
    }

    const prefixes = origins.flatMap((o) => [`${o}/check/#r=`, `${o}/de/check/#r=`]);
    const result = validatePayload(pack, body, { resultPrefixes: prefixes });
    if (!result.ok) return json({ error: result.error }, 400);
    if (result.spam) return json({ ok: true }, 200);
    const { data } = result;
    if (env.LIMITER && !(await env.LIMITER.limit({ key: `to:${data.email.toLowerCase()}` })).success) return json({ error: "rate" }, 429);

    const mail = renderVisitorEmail(pack, data, { bookingUrl: env.BOOKING_URL });
    const sent = await send({
      to: [{ email: data.email }],
      replyTo: { email: env.REPLY_TO || env.SENDER_EMAIL, name: sender.name },
      subject: mail.subject, htmlContent: mail.html, textContent: mail.text,
    });
    if (!sent.ok) {
      console.error("brevo", sent.status, await sent.text());
      return json({ error: "send" }, 502);
    }

    if (env.NOTIFY_TO) {
      const notice = renderNotification(pack, data);
      ctx.waitUntil(send({
        to: [{ email: env.NOTIFY_TO }],
        replyTo: { email: data.email },
        subject: notice.subject, htmlContent: notice.html, textContent: notice.text,
      }));
    }
    return json({ ok: true }, 200);
  },
};
