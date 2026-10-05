# Port Plan — Marija Portfolio → Publii

**Status:** Draft  
**Source:** React 19 + Vite SPA in this repo (`src/`, `SPEC.md`)  
**Target:** A custom [Publii](https://github.com/GetPublii/Publii) theme, `marija`, rendered by the Publii desktop CMS (current release 0.47.x).  
**Goal:** Keep the exact design and interaction (vertically-centered film accordion, per-film background/text theme, still + credits, read-more panel) while making all content editable in Publii and publishing a fully static site.

---

## Table of contents

1. [What changes when moving to Publii](#1-what-changes-when-moving-to-publii)
2. [Recommended architecture](#2-recommended-architecture)
3. [Theme file structure](#3-theme-file-structure)
4. [Content model mapping](#4-content-model-mapping)
5. [File-to-file port map](#5-file-to-file-port-map)
6. [CSS and design-token port](#6-css-and-design-token-port)
7. [Interaction / JS port](#7-interaction--js-port)
8. [Assets and fonts](#8-assets-and-fonts)
9. [Implementation phases](#9-implementation-phases)
10. [SEO, deployment, and local workflow](#10-seo-deployment-and-local-workflow)
11. [Risks, constraints, and open questions](#11-risks-constraints-and-open-questions)
12. [Definition of done](#12-definition-of-done)

---

## 1. What changes when moving to Publii

Publii is a **desktop static-site CMS**. It renders Handlebars (`.hbs`) templates into plain
HTML/CSS/JS, and the user edits content in the Publii app. This has four consequences for this
project:

| Today (React SPA) | In Publii |
|---|---|
| One `index.html`, client-side rendered | `index.hbs` rendered to static HTML at build time |
| Content hard-coded in `src/data/*.ts` | Content stored in Publii (posts, pages, theme options) |
| React state drives accordion / read-more | Plain DOM JS ("island") drives the same behavior |
| Tailwind + shadcn/ui + Motion | Hand-authored CSS + a small vanilla JS file |
| Interactive only after JS loads | Content is in the HTML (better SEO); JS only enhances |

**Key constraint:** Publii has no React runtime and no SPA router. The port keeps the same
*experience* but implements it as progressive enhancement over server-rendered markup.

**Behavioral rules that must survive the port** (from `SPEC.md`):

- The accordion stays **vertically centered** whether collapsed or expanded.
- **Every film has its own background + text color.**

---

## 2. Recommended architecture

Build **one custom Publii theme** named `marija` with a single-page home layout, plus an
optional per-film post template for direct links/SEO.

```
┌── Publii desktop app ──────────────────────────────┐
│  Films      → Posts (+ custom fields)              │
│  Bio        → Page "About" (+ custom fields)        │
│  Filmography→ Page "Filmography" (rich text)       │
│  Colors/IDs → Post custom fields                    │
│  Site text  → Theme customConfig (fallbacks)        │
└──────────────────────┬─────────────────────────────┘
                       │ render
                       ▼
        marija theme (Handlebars) → static output
          index.hbs    → accordion + stills + credits + read-more
          post.hbs     → single film page (optional, SEO)
          partials/    → header, footer, film-item, credits
          assets/css/main.css
          assets/js/portfolio.js   ← the "island"
```

**Why films as Posts (not theme Repeater):**

- Idiomatic Publii: posts get featured images, URLs, ordering, scheduled publishing, and the
  block editor.
- `postConfig` in `config.json` adds custom fields directly to the post editor, so editors set
  background color, text color, description, and both credit columns per film.
- `{{#getPosts}}` lets `index.hbs` build the accordion from the same posts.
- Gives each film a real URL (`/films/the-enigma...`) for sharing and SEO, which the SPA lacks.

**Fallback option (simpler, less CMS-native):** put all films in a theme `repeater` field in
`customConfig`, render them into `index.hbs`, and skip post pages. Use this only if the client
wants a pure one-page site with no per-film URLs. The JS port is identical either way.

---

## 3. Theme file structure

Ship this as a zip installable via **Publii → Settings → Themes → Install theme**. Required
files are marked ★.

```
marija/
├── config.json              ★ theme metadata, postConfig, customConfig, menus, renderer
├── thumbnail.png            ★ 400×300 preview shown in Publii
├── index.hbs                ★ homepage (the portfolio shell)
├── post.hbs                 ★ single post (film detail page)
├── page.hbs                   About / Filmography pages
├── 404.hbs                    optional (renderer.create404page)
├── partials/
│   ├── header.hbs             <head>, meta, fonts
│   ├── footer.hbs             closing markup, {{js "portfolio"}}
│   ├── bio-header.hbs         name + read more / close
│   ├── film-item.hbs          accordion item (rule + title + description + rule)
│   ├── film-detail.hbs        still + credits
│   └── read-more.hbs          about + filmography panel
├── assets/
│   ├── css/
│   │   ├── main.css         ★ tokens, layout, components (plain CSS)
│   │   └── editor.css         post-editor look & feel (optional)
│   ├── js/
│   │   └── portfolio.js       accordion, color theme, read-more, reduced motion
│   └── fonts/
│       ├── geist-latin-wght-normal.woff2
│       └── geist-*.woff2 (other subsets)
└── helpers.js                 optional custom Handlebars helpers
```

`config.json` responsibilities:

- `name`, `version`, `author` (required).
- `supportedFeatures`: set `pages: true`; disable unused `authorPages`, `tagPages`,
  `tagsList`, `searchPage` to keep the render lean.
- `renderer`: `create404page: true`; disable tag/author page generation.
- `postConfig`: the film fields (see §4).
- `pageConfig`: About/Filmography fields.
- `customConfig`: site-level text (name, bio sentence, button labels) as fallbacks.
- `menus`: none needed for the one-pager; can expose a footer menu later.

---

## 4. Content model mapping

### 4.1 Film = Post + `postConfig` fields

Add to `config.json`:

```json
"postConfig": [
  { "name": "filmDescription", "label": "Description", "type": "textarea", "value": "" },
  { "name": "filmStill",       "label": "Still",       "type": "upload",     "upload": true },
  { "name": "filmBg",          "label": "Background color", "type": "colorpicker", "value": "#FFFFFF" },
  { "name": "filmText",        "label": "Text color",       "type": "colorpicker", "value": "#12140B" },
  { "name": "filmCreditsLeft", "label": "Credits (left)",  "type": "textarea", "value": "" },
  { "name": "filmCreditsRight","label": "Credits (right)", "type": "textarea", "value": "" },
  { "name": "filmOrder",       "label": "Display order",   "type": "number",   "value": 0 }
]
```

Access in templates as `{{post.customFields.filmBg}}` (guard with `{{#checkIf}}`). The existing
`src/data/films.ts` entries become four posts:

| Field | Source in `films.ts` |
|---|---|
| `title` | `film.title` |
| `filmDescription` | `film.description` |
| `filmStill` | `film.still` (`/stills/enigma.jpg` …) |
| `filmBg` | `film.theme.bg` |
| `filmText` | `film.theme.text` |
| `filmCreditsLeft` | `film.credits.left` |
| `filmCreditsRight` | `film.credits.right` |
| `slug` | `film.id` |

> Note: the three unwritten films have empty descriptions/credits and proposed color palettes
> (`SPEC.md` §5.1, §13). Port them with placeholders and leave the client sign-off as an open item.

### 4.2 Bio = Page + `pageConfig`

- Page slug `about` holds the two paragraphs (`src/data/about.ts`). Use the rich-text body, or
  add a `pageConfig` textarea if you want strict two-paragraph control.
- `index.hbs` pulls it with `{{#getPage "about"}}`.

### 4.3 Filmography = Page

- Page slug `filmography` holds `src/data/filmography.ts` content: the `FILMOGRAPHY & FESTIVALS`
  heading plus one entry per line. Keep it as a rich-text body (preserve line breaks).
- The read-more panel renders both the about paragraphs and this list in one scroll area.

### 4.4 Home shell config (no content duplication)

Keep structural strings in `customConfig` so the theme works even with no pages created:
`bioName`, `bioSentence`, `readMoreLabel`, `closeLabel`, `emptyFilmsMessage`.

---

## 5. File-to-file port map

| Current file | Publii destination |
|---|---|
| `src/App.tsx` | `index.hbs` (shell) |
| `src/components/Portfolio.tsx` | `index.hbs` (state lives in `assets/js/portfolio.js`) |
| `src/components/Accordion.tsx` | `partials/film-item.hbs` + loop in `index.hbs` |
| `src/components/FilmItem.tsx` | `partials/film-item.hbs` |
| `src/components/FilmDetail.tsx` | `partials/film-detail.hbs` |
| `src/components/Credits.tsx` | inside `partials/film-detail.hbs` (two columns) |
| `src/components/BioHeader.tsx` | `partials/bio-header.hbs` |
| `src/components/ReadMorePanel.tsx` | `partials/read-more.hbs` + `getPage` calls |
| `src/data/films.ts` | Publii posts (custom fields) |
| `src/data/about.ts` | Page `about` |
| `src/data/filmography.ts` | Page `filmography` |
| `src/data/types.ts` | no runtime equivalent; document field names |
| `src/index.css` | `assets/css/main.css` |
| `src/components/ui/*` (shadcn) | replaced by hand-written markup/CSS; no library |
| `index.html` | `partials/header.hbs` + `partials/footer.hbs` |
| `public/stills/*.jpg` | uploaded as post featured/still images |
| `@fontsource/geist` woff2 (in `node_modules`) | `assets/fonts/` + `@font-face` |

---

## 6. CSS and design-token port

The SPA uses Tailwind 4 + shadcn. For a Publii theme, **hand-author plain CSS** with custom
properties (smaller, no build step, easier for future maintainers). Keep the existing tokens:

```css
:root {
  --pad: 24px;          /* mobile; 32 tablet; 48 desktop */
  --gap: clamp(32px, 4.5vw, 61px);
  --ink: #000000;
  --bio: #121212;
  --film-bg: #ffffff;
  --film-text: #12140b;
}
```

Port targets:

- `.stage` / shell: `min-height: 100dvh`, grid centered, `padding-left: var(--pad)`.
- `.accordion`: `width: 244px` desktop, `220px` tablet, full width mobile; the **centered flex
  wrapper** from `SPEC.md` §4.1 — never animate `top`.
- `.film-item` (button), rules (`24×1`, `currentColor`), title `Georgia 17.5px/1.25`, description
  `Geist 14px/1.25`.
- `.film-detail` still `aspect-ratio: 256/135; object-fit: cover`, credits two columns
  (`gap-x: 27px`, `12px/14px`), positioned `top: calc(100% + 40px)`.
- `.read-more-panel`: fixed, `top: calc(var(--pad) + 48px)`, `width: min(549px, 100vw - 2*pad)`,
  scrollable.
- Breakpoints at 768 and 1024 exactly as `src/index.css`.
- `@media (prefers-reduced-motion: reduce)` block copied verbatim.

Colors applied per film come from `post.customFields` via inline custom properties on the shell
(see §7), so `--film-bg` / `--film-text` cascade to every element, matching the React
implementation.

> Optional: keep Tailwind as a build-time step (Tailwind CLI) and paste the compiled CSS into
> `assets/css/main.css`. This preserves utility classes during the port but adds a toolchain
> Publii does not need. Recommendation: plain CSS for the final theme.

---

## 7. Interaction / JS port

Replace Motion + Radix with one dependency-free file, `assets/js/portfolio.js`, loaded from
`partials/footer.hbs` via `{{js "portfolio"}}`. It enhances the rendered HTML.

Responsibilities and port of `Portfolio.tsx`:

1. **Single-open accordion.** Clicking a title opens it and closes others; clicking the open one
   collapses. Use real `<button aria-expanded aria-controls>` (already the SPA's a11y pattern,
   `SPEC.md` §12). Toggle a `data-open` attribute rather than React state.
2. **Height animation.** Animate the item's height with `element.animate()` or `max-height`/
   `grid-template-rows` + CSS transition (~0.4s ease-in-out). Never animate vertical position —
   the centered wrapper keeps the midpoint fixed.
3. **Per-film theming.** On selection, take `data-bg` / `data-text` from the clicked item (set
   from post custom fields in `film-item.hbs`) and set `--film-bg` / `--film-text` on the shell.
   Transition `background-color` and `color` ~0.5s. Collapsed = white / `#12140B`.
4. **Detail swap.** The still + credits for the active film are pre-rendered in the DOM (one
   block per film, hidden). Show the active one with a fade + slight scale
   (`opacity 0 → 1`, `scale 1.02 → 1`), ~0.3–0.5s. No fetch, no router.
5. **Read-more panel.** Toggle `#read-more-panel` (rendered from the About + Filmography pages)
   and crossfade `read more ⇄ close` (both labels present, opacity-toggled as in
   `BioHeader.tsx`).
6. **Reduced motion.** Read `matchMedia("(prefers-reduced-motion: reduce)")`; disable transforms
   and use opacity-only / near-zero durations, mirroring `useReducedMotion()`.
7. **Keyboard.** Enter/Space toggles via native buttons; ensure focus ring uses `currentColor`.

DOM contract between Handlebars and JS (agreed class/attr names):

| Selector | Set by | Used for |
|---|---|---|
| `[data-film-item]` | `film-item.hbs` | accordion item, carries `data-id`, `data-bg`, `data-text` |
| `#film-detail-<id>` | `film-detail.hbs` | detail block to show when active |
| `#portfolio-shell` | `index.hbs` | element receiving `--film-bg` / `--film-text` |
| `#read-more-panel` | `read-more.hbs` | panel toggled by the header button |

---

## 8. Assets and fonts

- **Stills:** upload the four images in `public/stills/` as each post's `filmStill`. Use Publii's
  responsive image helpers in `film-detail.hbs`:
  `{{responsiveSrcSet post.customFields.filmStill}}` / `{{responsiveImageAttributes ...}}`.
  Configure `files.responsiveImages` in `config.json`.
- **Geist:** copy the `@fontsource-variable/geist` woff2 files from `node_modules` (already
  emitted in `dist/assets/`) into `assets/fonts/` and declare `@font-face` with
  `font-display: swap`. Georgia stays a system serif stack.
- **Favicon:** recreate the inline SVG favicon as `assets/img/favicon.svg` (or use Publii's
  favicon option).
- **Thumbnail:** `thumbnail.png` 400×300 for the theme list.

---

## 9. Implementation phases

### Phase 0 — Scaffold the theme
- [ ] Create `marija/` with required files (`config.json`, `index.hbs`, `post.hbs`, `thumbnail.png`, `assets/css/main.css`).
- [ ] Base it on the official [Blank theme](https://github.com/GetPublii/theme-Blank) to inherit correct `renderer`/`supportedFeatures` structure.
- [ ] Zip and install in Publii; confirm it activates with the default content.

### Phase 1 — Content model
- [ ] Add `postConfig` film fields; add `pageConfig` if needed.
- [ ] Create the four film posts with the existing text/stills/palettes; set the `filmOrder` values matching `films.ts` order (Enigma, Exercise Zero, A Sweet Habit, The Girl and the Sea).
- [ ] Create pages `about` and `filmography` from `about.ts` / `filmography.ts`.
- [ ] Verify custom fields render (`{{post.customFields.filmBg}}`).

### Phase 2 — Static markup and CSS
- [ ] Port `index.hbs` shell, `bio-header.hbs`, accordion loop, `film-item.hbs`, `film-detail.hbs`, credits, `read-more.hbs`.
- [ ] Port the design tokens and layout from `src/index.css` to `assets/css/main.css` (breakpoints 768/1024).
- [ ] Load Geist locally; verify Georgia fallback.
- [ ] Check collapsed and expanded geometry against `SPEC.md` §2 and §4.1.

### Phase 3 — Interaction
- [ ] Implement `portfolio.js` (§7): accordion, theming, detail swap, read-more, reduced motion, keyboard.
- [ ] Confirm accordion midpoint stays fixed while height animates.
- [ ] Confirm per-film background + text color transitions.

### Phase 4 — Polish, responsive, SEO
- [ ] Mobile (<768) column order: bio → accordion → still → credits; expanded state scrolls (no clipping).
- [ ] Tablet (768–1023): padding 32, accordion 220, side-by-side preserved.
- [ ] `post.hbs` single-film page; social meta via `{{socialMetaTags}}`; descriptive `<title>`/meta.
- [ ] Accessibility pass: buttons with `aria-expanded`/`aria-controls`, visible focus, credits contrast against each background (WCAG AA at 12px).
- [ ] 404 page if enabled.

### Phase 5 — Publish
- [ ] Configure an upload target (SFTP/Netlify/S3/GitHub Pages) in Publii.
- [ ] First full render; smoke-test the emitted `/`, film pages, assets, fonts.

---

## 10. SEO, deployment, and local workflow

**Dev loop (no Vite anymore):**

1. Edit `.hbs`/CSS/JS in `marija/`.
2. Reinstall/refresh the theme in Publii (or use a symlinked theme folder during development).
3. Use Publii's built-in preview server; iterate.
4. Keep this React repo as the design source of truth (`SPEC.md`, stills) but it is no longer the
   published artifact.

**Publishing:** Publii uploads the rendered static output via configured targets. Add redirects
if any SPA-only paths existed; add per-film canonical URLs on `post.hbs`.

**Performance/SEO gains:** content is server-rendered HTML, each film is indexable, no React
bundle.

---

## 11. Risks, constraints, and open questions

| # | Risk / question | Mitigation |
|---|---|---|
| 1 | Publii has no custom post types; films are Posts. Tag types/URLs may look like a blog. | Configure SEO post prefix (e.g. `/films/`), hide dates/categories in templates. |
| 2 | Per-film palettes + descriptions for 3 films are unresolved (`SPEC.md` §5.1, §13.2). | Ship placeholders; flag for client sign-off before launch. |
| 3 | Still vs. looping video not decided (`SPEC.md` §13.3). | Implement `<img>` now; allow an optional `filmVideo` upload field later. |
| 4 | Motion parity: CSS/WAAPI can't replicate Motion springs exactly. | Match durations/eases from `SPEC.md` §8; verify visually; keep reduced-motion path. |
| 5 | Image handling/cropping differs from `object-fit: cover` at 928×503. | Use Publii responsive image config + `object-fit: cover`; verify crop per still. |
| 6 | Editing custom fields in Publii's block editor vs. plain text for multiline credits. | Use `textarea` fields (line breaks preserved) rather than WYSIWYG for credits. |
| 7 | Theme updates require reinstalling a zip during development. | Develop against a symlinked/copied theme folder in Publii's theme directory. |

Client-confirm items carried over from `SPEC.md` §13 remain open and should be resolved before
Phase 4 sign-off.

---

## 12. Definition of done

- [ ] A `marija` Publii theme exists, installable and selectable in the Publii app.
- [ ] All four films, the bio, and the filmography are editable in Publii; no content lives in
      template code.
- [ ] Home reproduces `SPEC.md`: centered accordion (fixed midpoint), per-film bg/text, still +
      two-column credits, read-more panel.
- [ ] Responsive behavior matches §10 at mobile/tablet/desktop.
- [ ] Accessibility checks pass (`aria-expanded`/`aria-controls`, focus, contrast, reduced motion).
- [ ] Static output published to the chosen host; `/`, film pages, fonts, and stills all load.
