# Blowfish Theme Customizations

This document summarizes all customizations made to the [Blowfish Hugo theme](https://github.com/nunocoracao/blowfish) for patrickschnass.de.

---

## Custom Layout Partials

### `/layouts/partials/home/profile.html`
- **Purpose**: Rearranged landing page layout
- **Change**: Moved the profile header (image, name, bio) to appear **after** the main content instead of before
- Added `mt-8` margin-top to the header for spacing

### `/layouts/partials/vendor.html`
- **Purpose**: Enable KaTeX math rendering on pages with `math: true` frontmatter
- **Change**: Modified KaTeX loading condition from only `katex` shortcode to:
  ```go
  {{ if or (.Page.HasShortcode "katex") (.Page.Params.math) }}
  ```

### `/layouts/partials/favicons.html`
- **Purpose**: Custom favicon paths
- **Change**: Points to favicon files in the `/favicon/` subdirectory

---

## Custom CSS (`/assets/css/custom.css`)

### Heading Anchors
- Hidden the `#` anchor links that appear next to headlines (via CSS targeting `.heading-anchor`)

### Full-Page Snap Sections
- `.snap-section`: Full-viewport sections with centered content for landing page segments

### Services Carousel
- `.services-carousel`: Tabbed carousel container
- `.carousel-tabs` / `.carousel-tab`: Tab button styling with active state (`.is-active`)
- `.carousel-panels` / `.carousel-panel`: Content panels with fade-in animation
- `.carousel-progress` / `.progress-dot`: Progress indicator dots

### Code Blocks on Landing Page
- `.snap-section pre`: Custom padding, border-radius, font-size
- `.snap-section .highlight`: Inline-block display for flexible width
- `.snap-section .lntd:first-child`: Line number styling with opacity

### Underline Fix
- Comprehensive rules to remove all underlines from code blocks (avoiding conflict with theme's `.active` class)

### About Section
- `.about-section`: Centered layout with max-width
- `.about-photo`: Circular profile image with blue border
- `.about-links`: Styled links for LinkedIn, GitHub, etc.

---

## Custom JavaScript (`/assets/js/katex-render.js`)

- **Purpose**: Configure KaTeX with multiple delimiter types
- **Supports**:
  - `$$...$$` for display math
  - `$...$` for inline math
  - `\[...\]` for display math (LaTeX style)
  - `\(...\)` for inline math (LaTeX style)

---

## Configuration Changes (`hugo.toml`)

### Article Settings
```toml
[params.article]
  showHeadingAnchors = false
```

### Syntax Highlighting
```toml
[markup.highlight]
  style = "catppuccin-macchiato"
  lineNos = true
  lineNumbersInTable = true
  noClasses = false
```

### Menu Links
- Both DE and EN "About" menu items link to `/#about` (landing page section) instead of separate page

---

## Static Files

### `/static/patrick.png`
- Profile photo copied from assets for direct URL access

### `/static/favicon/`
- All favicon files (originally in assets)

---

## Content Structure

### Landing Pages (`/content/[lang]/_index.md`)

Three snap-sections:
1. **#contact**: Hero code block + Google Calendar booking button
2. **#services**: Tabbed carousel with 3 service offerings (code-styled)
3. **#about**: Profile photo, intro text, and links

Each includes inline JavaScript for the carousel auto-rotation (10-second intervals).

---

## Notes

- The `.active` class was renamed to `.is-active` in the carousel to avoid conflict with Blowfish's menu `.active` styling (which adds underlines)
- Blog posts should use `math: true` in frontmatter for LaTeX/KaTeX rendering
- The theme uses KaTeX (not MathJax) for math rendering
