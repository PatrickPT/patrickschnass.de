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
- **E-mail:** `hugo.toml` → `[params.check] mailer`. Empty = form hidden in production; the dev
  server uses a mock.
- **Share links:** answers are encoded in the URL fragment (`#r=…`), which browsers never send to a
  server.

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
