# patrickschnass.de

Personal website and blog for [Patrick Schnaß](https://www.patrickschnass.de) — AI advisor, data scientist, and engineer.

Built with [Hugo](https://gohugo.io) + [Blowfish theme](https://github.com/nunocoracao/blowfish), deployed to GitHub Pages via GitHub Actions.

---

## Stack

| Layer | Tech |
|---|---|
| Static site generator | Hugo |
| Theme | Blowfish |
| Languages | English (default) + German |
| Build runner | Python `uv` (`uv run hugo --gc`) |
| Hosting | GitHub Pages (from `public/`) |
| Favicon generation | Python + Pillow (`main.py`) |

---

## Structure

```
layouts/index.html      # Standalone homepage — fully custom, bypasses Blowfish entirely
layouts/partials/       # Blowfish partial overrides (favicons, vendor/KaTeX)
assets/css/custom.css   # Blog CSS overrides on top of Blowfish
assets/favicon/         # nav-logo.png (used by Blowfish resources.Get)
static/favicon/         # All favicon files served directly
static/patrick.png      # Profile photo
static/gcp-*.png        # GCP certification badge
content/en/             # English blog posts and pages
content/de/             # German blog posts and pages
main.py                 # Favicon generation script (Pillow)
public/                 # Built output — committed and served by GitHub Pages
```

---

## AI potential check (`/check/`, `/de/check/`)

A free, 5-minute check that turns back-office processes into a € business case, including the hidden
costs (rework, lost focus, expensive people doing routine work, Skonto, errors, slow quotes).
Everything is computed **in the browser**; answers only leave it if the visitor asks for the result
by e-mail.

```
layouts/check/single.html      # Page shell (advisory nav/footer), loads the bundle
assets/check/model.mjs         # € model, share links, pack validation (pure functions)
assets/check/packs/*.json      # Niche packs: processes, questions, defaults, copy (DE/EN)
assets/check/copy.mjs          # Interface copy (DE/EN)
assets/check/app.mjs           # UI: flow, live meter, result page (bundled by Hugo js.Build)
assets/check/check.css         # Styles, including print/PDF
workers/check-mailer/          # Cloudflare Worker that e-mails the result (see its README)
tests/check/                   # node --test "tests/**/*.test.mjs"
```

- **New niche:** add a pack JSON, register it in `PACKS` in `app.mjs`, open `/check/?pack=<id>`.
- **Micro-calculators** (`/de/rechner/…`): `assets/check/calculators.mjs` (config + compute on top
  of the model), `calc.mjs` (UI), `layouts/calculator/` (page with FAQ structured data). A new
  calculator is an entry in `CALCULATORS` plus a content file with `type: "calculator"` and `calc: <id>`.
- **Deep links into the check:** `?p=<process>&v=<volume>&m=<minutes>&role=<role>&l.<question>=<option>&from=<source>`
  preselects the process and pre-fills what's known (used by the calculators).
- **E-mail:** `hugo.toml` → `[params.check] mailer`. Empty = form hidden in production; the dev
  server uses a mock.
- **Share links:** answers are encoded in the URL fragment (`#r=…`), which browsers never send to a
  server.

## Partner mode (`?partner=<id>`, `?embed=1`)

Tax advisors, IT service providers and consultancies can offer the check to their own clients.

- **Add a partner:** an entry in `assets/check/partners.json` (name, accent colour, optional logo
  in `static/images/partners/`, contact URL and label in DE/EN). It's validated by
  `validatePartners` in the tests. The `demo` partner only works on `hugo server`.
- **What changes for visitors:** a "Provided by <partner> together with Patrick Schnaß" bar,
  a "Talk to <partner>" button next to the booking button, and in the e-mail form an extra,
  optional checkbox to send the partner the same summary Patrick gets.
- **Partner copies** go out only with that consent, to the address in the worker secret
  `PARTNER_EMAILS` (`{"<id>": "<address>"}`), so addresses never sit in this public repo.
- **Embed** on the partner's site:

  ```html
  <iframe id="ki-check" src="https://www.patrickschnass.de/de/check/?partner=<id>&embed=1"
          title="KI-Potenzial-Check" loading="lazy" style="width:100%;border:0;min-height:800px"></iframe>
  <script>
    addEventListener("message", (e) => {
      if (e.origin === "https://www.patrickschnass.de" && e.data && e.data.type === "ck-height")
        document.getElementById("ki-check").style.height = e.data.height + "px";
    });
  </script>
  ```
  `embed=1` hides the site's nav and footer; the check reports its height so the iframe never
  scrolls inside.
- **Before the first live partner:** clarify the data-protection roles (see `docs/partner-onepager-de.md`).

## Analytics (Plausible, cookieless)

Off until `hugo.toml` → `[params.analytics] plausible` holds the script URL from Plausible's site
settings (never loads on `hugo server`). The fragment (`#r=…`) is stripped from every request.
Events, which only carry step names and coarse labels, never answers or figures:

| Event | Props | When |
|---|---|---|
| `cta_check` | `where`, `page` | any link to the check (hero, teaser, nav, footer, service page) |
| `cta_book` / `cta_email` | `where`, `page` | booking / e-mail buttons anywhere |
| `check_start` | `from` (`direct`, `calc-skonto`, `partner-<id>`, …) | "Let's find out" |
| `cta_partner` | `partner` | "Talk to <partner>" on the result page |
| `calc_use` | `calc` | first interaction with a calculator |
| `check_step` | `step` (`context`, `guess`, `processes`, `detail_1`…, `honest`) | each screen of the flow |
| `check_complete` | `processes` (count) | result reached through the flow |
| `shared_open` | | someone opens a result link shared with them |
| `explain_open` | `what` (`score`, `process`, `assume`) | first time per kind |
| `assumptions_edit` | | first edit of an assumption |
| `result_pdf` / `result_share` / `result_mail` | `via` / `followUp` | next-step actions |
| `check_restart` | | "Start over" |

In Plausible, add these names as **custom event goals** so they show up in the dashboard.

---

## Homepage vs Blog

The site has two distinct parts:

**Landing page** (`layouts/index.html`)
- Fully standalone HTML template with all CSS inlined
- Dark-mode-first design with a light mode toggle
- Animated canvas background
- Sections: Hero, Services (tabbed carousel), About (with career timeline + GCP credentials)
- Google Calendar booking button integration
- Does **not** use Blowfish at all — own `<head>`, nav, and layout

**Blog** (`/posts/`)
- Powered by Blowfish theme
- Bilingual (EN/DE) via Hugo multilingual config
- KaTeX math rendering via `math: true` frontmatter
- Syntax highlighting: Catppuccin Macchiato style

---

## Development

```bash
# Install dependencies
uv sync

# Local dev server
uv run hugo server

# Production build
uv run hugo --gc
```

---

## Favicon

Favicons are generated programmatically with Pillow — blue (#039BE5) circle, white outlined "P":

```bash
uv run python main.py
```

Output goes to `static/favicon/` and `assets/favicon/`. Both locations are needed: `static/` for direct URL references on the landing page, `assets/` for Blowfish's `resources.Get`.

---

## Deployment

Push to `main` triggers GitHub Actions, which builds the site and deploys `public/` to GitHub Pages. The `public/` directory is committed to the repo and also serves as the deployment artifact.

---

## Key Customizations

- **`layouts/index.html`** — entire homepage is a single custom template
- **Career timeline** — horizontal CSS flexbox timeline with 4 nodes; the "AI Advisor" node is visually distinct (boxed, hollow dot) to signal it as an offering rather than past experience
- **GCP credentials** — badge + text block below the about section
- **Favicon paths** — served from `/favicon/` subdirectory; `layouts/partials/favicons.html` and `static/favicon/site.webmanifest` both point there
- **Blog logo** — `assets/favicon/nav-logo.png` consumed by Blowfish's `resources.Get`; `assets/css/custom.css` sets `filter: none` to prevent theme from inverting the blue logo in dark mode
- **`.is-active` class** — carousel uses `.is-active` (not `.active`) to avoid conflict with Blowfish's menu active-link underline styling
