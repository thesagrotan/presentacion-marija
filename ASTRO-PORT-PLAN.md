# Port Plan — Marija Portfolio → Astro 7 (Markdown content)

**Status:** Draft
**Source:** React 19 + Vite SPA in this repo (`src/`, `SPEC.md`)
**Target:** [Astro 7](https://astro.build) static site (`~7.3`), content authored as **Markdown files** in content collections.
**Replaces:** the current Vite SPA as the build/publish target.
**Verified against:** Astro v7 upgrade guide, content-collections, images, and `@astrojs/react` docs (Oct 2026).

---

## Table of contents

1. [Goal and the one real decision](#1-goal-and-the-one-real-decision)
2. [Astro 7 baseline — what it changes](#2-astro-7-baseline--what-it-changes)
3. [Recommended architecture](#3-recommended-architecture)
4. [Content model — Markdown files](#4-content-model--markdown-files)
5. [Project structure](#5-project-structure)
6. [File-to-file port map](#6-file-to-file-port-map)
7. [Interaction island (DOM contract)](#7-interaction-island-dom-contract)
8. [Images and fonts](#8-images-and-fonts)
9. [Film pages, SEO, routing](#9-film-pages-seo-routing)
10. [Astro 7 pitfalls to design around](#10-astro-7-pitfalls-to-design-around)
11. [Implementation phases](#11-implementation-phases)
12. [Risks and open questions](#12-risks-and-open-questions)
13. [Definition of done](#13-definition-of-done)

---

## 1. Goal and the one real decision

Content (films, bio, filmography) moves from hard-coded `.ts` arrays into Markdown files managed
by [content collections](https://docs.astro.build/en/guides/content-collections/). The site builds
statically with `astro build` → `dist/`.

The whole page is one interactive widget (opening a film re-themes the page, swaps the still and
credits, and re-centers the accordion). That leaves one decision: how the interaction is built.

| Option | Interaction | JS shipped | Motion fidelity | Effort |
|---|---|---|---|---|
| **A — Astro + tiny vanilla island (recommended)** | Astro renders all markup; one ~120-line TS script toggles state | ~1–2 KB | High — the current motion is already CSS transitions | Medium |
| **B — React island** | Reuse `Portfolio.tsx` + `motion` as `<Portfolio client:load />` | React + Motion (~40 KB+) | Exact (unchanged) | Low |

**Recommendation: Option A.** Reading the current code, almost all animation is already CSS, not
Motion:

- Accordion open/close → `grid-template-rows: 0fr ↔ 1fr` transitions (`FilmItem.tsx`, `ui/accordion.tsx`).
- Rule reveal → `scale-x` + opacity transitions.
- Background/text color → a single `background-color`/`color` transition (Motion just interpolates it).
- Still + credits → opacity/scale transition.
- Read-more panel → opacity/scale transition.
- Reduced motion → already a CSS media query in `src/index.css`.

So Motion is doing state plumbing + trivial interpolation. Astro can render the exact same markup
with the same utility classes, and one small script can own `activeId`, `creditsOpen`, `readMore`,
and `--read-more-top`. This drops React, Radix, Motion, and shadcn entirely, server-renders the
content for SEO, and lets `astro:assets` optimize the stills natively.

Option B stays valid if the team prefers to keep React verbatim; §7 lists the contract either way.
The **content layer — the point of this plan — is identical for both options**.

---

## 2. Astro 7 baseline — what it changes

Verified from the [v7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/):

- **Vite 8** under the hood; **Rust compiler** is the only compiler. It is stricter: unclosed tags
  error, and invalid nesting is no longer auto-corrected. Our `.astro` markup must be well-formed.
- **`compressHTML: 'jsx'` is the default.** Whitespace between inline elements is stripped (React
  rules). This directly affects the bio header line: `<span>…</span> is a filmmaker based in Berlin.`
  plus the `read more` button. Use explicit `{" "}` or set `compressHTML: true`.
- **Sätteri** is the default Markdown pipeline (`@astrojs/markdown-remark` is no longer installed).
  It applies GFM + SmartyPants, same as before. We use no remark/rehype plugins, so nothing to port.
- **Content collections**: `defineCollection` from `astro:content`, loaders from `astro/loaders`,
  and **`z` from `astro/zod`** (a Zod 4 re-export). The `image()` schema helper is passed into the
  `schema` callback.
- **Responsive images**: `image.layout` + `image.responsiveStyles` generate `srcset`/`sizes` for all
  `<Image>`/`<Picture>` and Markdown images. Stills stored in `src/assets/` are optimized at build.
- **`getImage()` is server-only**; call it in frontmatter and pass the resulting URL to client code.
- **`src/fetch.ts` is reserved** for advanced routing — do not create one.
- **`@astrojs/react` v7** uses Oxc (no Babel option). Only relevant to Option B.

Target versions: `astro@^7.3`, `@tailwindcss/vite` (already a dependency), optional
`@astrojs/sitemap`.

---

## 3. Recommended architecture

```
┌── Markdown content (src/content) ──────────────────────────┐
│  films/*.md   → frontmatter: title, order, still, bg, text, credits  (+ description body) │
│  pages/about.md, pages/filmography.md                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ getCollection() at build time
                           ▼
   src/layouts/Base.astro        <head>, meta, fonts, global.css
   src/pages/index.astro         queries collections → renders the full portfolio markup
   src/pages/films/[id].astro    getStaticPaths → single-film page (SEO, shareable)
   src/components/*.astro        BioHeader, FilmAccordion, FilmDetail, Credits, ReadMorePanel
   src/scripts/portfolio.ts      the island: single-open, theming, detail swap, read-more
   src/styles/global.css         current src/index.css (Tailwind v4 + tokens)
```

- Markup is **server-rendered** — every film title, description, still and credit is in the HTML.
- One small module script (`<script>` in `index.astro`) wires up interaction after load.
- No React, no Motion, no Radix, no shadcn. Tailwind v4 is kept so the existing utility classes and
  `src/index.css` tokens port almost verbatim.

---

## 4. Content model — Markdown files

One file per film in `src/content/films/`. Structured data lives in frontmatter; the **description
is the Markdown body** (rendered via `<Content />` in the accordion and on the film page). YAML
block scalars (`|`) preserve the exact newlines in `credits`.

`src/content/films/enigma.md`:

```md
---
title: The Enigma of an Autumn Afternoon
order: 1
still: ../../assets/stills/enigma.jpg
bg: "#96A391"
text: "#12140B"
credits:
  left: |
    Director: Marija Arakelyan Lučić
    DOP: Danny Shin
    Sound design/mix: Luka Barajević
    Cast: Ábris Imre, Miyeon Hwang, Julien Kartheuser, Leo Zhang, Peng Liu, Santiago Gómez García, Marcos Quincke, Doruk Kaya, Luise Hogg, Camille Couavoux, Ema Dobrić
  right: |
    With the support of  Hochschule für bildende Künste Hamburg

    ASA Open Studios HFBK, Hamburg, Germany, 2026
    Filmkunsttage Sachsen Anhalt, Germany, 2026
    43. Kassel Documentary Film and Video Festival, Kassel, Germany, 2026
draft: false
---

Inspired by the metaphysical paintings of Giorgio de Chirico, the film transforms an ordinary
public space into a mysterious and dreamlike tableau. …
```

`exercise-zero.md`, `a-sweet-habit.md`, `the-girl-and-the-sea.md` follow the same shape with
`order: 2..4`.

`src/content/pages/about.md`:

```md
---
title: About
---

Marija Arakelyan Lučić is a Croatian filmmaker and artist based in Berlin. She studies at HFBK
Hamburg in the class of Angela Schanelec, where she worked as her student assistant from 2024 to 2026.

In 2025, she received the Achievement Grant Award for International Students and is currently on
an ASA-supported exchange at Universidad del Cine in Buenos Aires. Her short films move between
narrative fiction and experimental cinema and have been screened at international festivals and
exhibitions.
```

`src/content/pages/filmography.md`:

```md
---
title: Filmography
heading: FILMOGRAPHY & FESTIVALS
---

The Enigma of an Autumn Afternoon, 4min, 2026
ASA Open Studios HFBK, Hamburg, Germany, 2026
…
```

`src/content.config.ts` (Astro 7 imports — note `astro/zod`):

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const films = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/films' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number().default(0),
      still: image(),
      bg: z.string(),
      text: z.string(),
      credits: z
        .object({ left: z.string().default(''), right: z.string().default('') })
        .default({ left: '', right: '' }),
      draft: z.boolean().default(false),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), heading: z.string().optional() }),
});

export const collections = { films, pages };
```

Entry `id` is derived from the filename (`enigma`, `exercise-zero`, …) and is the canonical slug.

---

## 5. Project structure

```
.
├── astro.config.mjs            site, tailwind vite plugin, image layout
├── src/
│   ├── content.config.ts       ★ collections + Zod schemas
│   ├── content/
│   │   ├── films/*.md          ★ 4 film files
│   │   └── pages/{about,filmography}.md
│   ├── layouts/
│   │   └── Base.astro          <head>, meta, favicon, global.css
│   ├── pages/
│   │   ├── index.astro         ★ full portfolio markup + island script
│   │   └── films/[id].astro    single-film page
│   ├── styles/
│   │   ├── global.css          ← src/index.css (Tailwind v4 + tokens)
│   │   └── portfolio.css       ★ interaction states + easings (or Tailwind data-variants)
│   ├── lib/
│   │   └── credits.ts          ← port of Credits.tsx parse helpers
│   ├── assets/stills/*.jpg     ← moved from public/stills (astro:assets)
│   ├── scripts/
│   │   └── portfolio.ts        ★ the island (bundled by Astro)
│   └── components/
│       ├── BioHeader.astro
│       ├── FilmAccordion.astro
│       ├── FilmItem.astro
│       ├── FilmDetail.astro
│       ├── Credits.astro
│       └── ReadMorePanel.astro
```

---

## 6. File-to-file port map

| Current | Astro destination | Change |
|---|---|---|
| `index.html` | `src/layouts/Base.astro` | `<head>`, favicon, meta, `<slot />` |
| `src/main.tsx` | `src/scripts/portfolio.ts` | state → DOM enhancement |
| `src/App.tsx` | `src/pages/index.astro` | shell markup |
| `src/components/Portfolio.tsx` | `index.astro` + `portfolio.ts` | state split into DOM + script |
| `src/components/Accordion.tsx` | `FilmAccordion.astro` | map over collection |
| `src/components/FilmItem.tsx` | `FilmItem.astro` | `<button aria-expanded>`, CSS grid rows |
| `src/components/ui/separator.tsx` | inline `<hr>`/border | native element |
| `src/components/FilmDetail.tsx` | `FilmDetail.astro` | `<Image />` + credits |
| `src/components/Credits.tsx` | `Credits.astro` + `lib/credits.ts` | build-time parsing |
| `src/components/BioHeader.tsx` | `BioHeader.astro` | `{" "}` for inline spacing |
| `src/components/ReadMorePanel.tsx` | `ReadMorePanel.astro` | `<Content />` + overflow scroll |
| `src/components/ui/scroll-area.tsx` | `overflow:auto` + edge fade | native CSS |
| `src/components/ui/accordion.tsx` | `portfolio.ts` | single-open logic |
| `src/data/films.ts` | `src/content/films/*.md` | 4 Markdown files |
| `src/data/about.ts` | `src/content/pages/about.md` | Markdown body |
| `src/data/filmography.ts` | `src/content/pages/filmography.md` | heading + body |
| `src/data/types.ts` | collection schema | type source |
| `src/index.css` | `src/styles/global.css` | path only |
| `public/stills/*.jpg` | `src/assets/stills/*.jpg` | enables `astro:assets` |
| `vite.config.ts` / `tsconfig.json` | `astro.config.mjs` / Astro tsconfig | replaced |

`Credits.tsx`'s `splitField` / `parseCredits` / `parseBlocks` logic ports to a pure
`src/lib/credits.ts` that returns row data; `Credits.astro` renders it.

---

## 7. Interaction island (DOM contract)

`index.astro` renders the state through data attributes; `src/scripts/portfolio.ts` (loaded via a
`<script>` in the page, bundled and deferred by Astro) owns the state machine.

Contract:

| Selector | Set by | Purpose |
|---|---|---|
| `#portfolio` | `index.astro` | shell receiving `--film-bg` / `--film-text`, `data-expanded`, `data-readmore` |
| `[data-film-item]` | `FilmItem.astro` | `<button>` with `data-id`, `data-bg`, `data-text`, `aria-expanded`, `aria-controls` |
| `[data-film-detail]` | `FilmDetail.astro` | `<figure>` with `data-id`; carries `[data-credits-toggle]` |
| `#read-more-panel` | `ReadMorePanel.astro` | panel toggled by the header button |
| `#read-more-panel` height anchor | shell | `--read-more-top` measured from header bottom |

Script responsibilities (direct port of `Portfolio.tsx`):

1. **Single-open accordion.** Click a title → open it, close any other; click the open one →
   collapse. Toggle `data-open` on the item; the CSS `grid-template-rows` transition animates height.
2. **Per-film theming.** Read `data-bg`/`data-text` from the clicked item; set `--film-bg` /
   `--film-text` on `#portfolio`. Collapsed = `#FFFFFF` / `#12140B`. Transition `background-color`
   and `color` ~0.4 s with the existing `--ease-in-out-strong` curve.
3. **Detail swap.** All four `[data-film-detail]` figures are rendered and stacked in one grid
   cell; toggle `data-active`; the active fades/scales in (`opacity`, `scale 1.02 → 1`), the
   previous fades out, matching `FilmDetail.tsx`. Use a transitionend/timeout to `inert` the
   hidden ones.
4. **Credits toggle.** Inside the active detail, `[data-credits-toggle]` toggles `data-open` on the
   credits region (grid-rows + opacity), mirroring `creditsOpen`.
5. **Read-more.** Toggle `data-readmore` on `#portfolio`, show `#read-more-panel`, crossfade the
   `read more ⇄ close` labels (both present in DOM, opacity-toggled as in `BioHeader.tsx`).
6. **Anchor.** `ResizeObserver` + `resize` listener on the bio header maintain `--read-more-top`.
7. **Reduced motion.** `matchMedia('(prefers-reduced-motion: reduce)')` and the existing CSS
   `@media` block disable transforms and keep opacity-only, gentle transitions.

Motion timings reuse `SPEC.md` §8 and `src/index.css` tokens: accordion `240ms` open / `420ms`
close, background `~0.4s`, detail `~0.35s`, read-more `~0.3s`; easings
`--ease-out-strong: cubic-bezier(0.23,1,0.32,1)` and
`--ease-in-out-strong: cubic-bezier(0.77,0,0.175,1)`.

Option B (if kept): reuse `Portfolio.tsx` etc. as `<Portfolio client:load films={…} />`; pass
`entry.body` as `description` and raw strings for the overlay. Note `@astrojs/react` v7 uses Oxc.

---

## 8. Images and fonts

**Stills** — move `public/stills/*.jpg` → `src/assets/stills/*.jpg` and reference them relatively in
frontmatter (`image()` validates and imports them). In `FilmDetail.astro` render with `<Image>`:

```astro
---
import { Image } from 'astro:assets';
const { film } = Astro.props;
---
<Image
  src={film.data.still}
  alt={`Still from ${film.data.title}`}
  layout="constrained"
  widths={[640, 960, 1280, 1856]}
  sizes="(min-width: 1024px) 928px, 100vw"
  class="aspect-[256/135] w-full object-cover object-center max-md:aspect-video"
/>
```

Configure globally in `astro.config.mjs`: `image: { layout: 'constrained', responsiveStyles: true }`
(keep `responsiveStyles: false` if Tailwind's `object-cover` should win — Tailwind 4 cascade layers
lose to Astro's `:where()` defaults, so verify). Stills are 1920–2048 px wide; `widths` caps output.

**Fonts** — `@fontsource-variable/geist` stays a dependency and `global.css` keeps
`@import "@fontsource-variable/geist"`. Georgia remains the system serif stack. (Astro's built-in
Fonts API is an option later, but self-hosting via fontsource is simpler and already working.)

**Favicon** — move the inline SVG from `index.html` to `public/favicon.svg`.

---

## 9. Film pages, SEO, routing

`src/pages/films/[id].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import { Image } from 'astro:assets';
import Base from '../../layouts/Base.astro';

export async function getStaticPaths() {
  const films = await getCollection('films', ({ data }) => !data.draft);
  return films.map((film) => ({ params: { id: film.id }, props: { film } }));
}
const { film } = Astro.props;
const { Content } = await render(film);
---
<Base title={`${film.data.title} — Marija Arakelyan Lučić`}>
  <Image src={film.data.still} alt={`Still from ${film.data.title}`} />
  <h1>{film.data.title}</h1>
  <Content />
  <!-- credits from film.data.credits via lib/credits.ts -->
</Base>
```

Also: set `site` in `astro.config.mjs` for canonical URLs, add per-page `<title>`/description, and
optionally `@astrojs/sitemap`. Every film becomes indexable (`/films/enigma`, …), which the SPA
could not offer.

---

## 10. Astro 7 pitfalls to design around

| Pitfall | Impact here | Mitigation |
|---|---|---|
| `compressHTML: 'jsx'` strips inline whitespace | Bio header: `…Lučić` + ` is a filmmaker…` + button may collapse | Use `{" "}` between inline nodes, or set `compressHTML: true` |
| Rust compiler errors on unclosed tags / invalid nesting | Any sloppy markup fails the build | Write well-formed `.astro`; no `<div>` inside `<p>` |
| `z` is now from `astro/zod` | Wrong import breaks the schema | Use `import { z } from 'astro/zod'` |
| Sätteri replaces remark/rehype | Only matters if plugins were planned | None used — no action |
| `getImage()` is server-only | Can't call it in `portfolio.ts` | Not needed in Option A; call in frontmatter if Option B |
| Tailwind 4 cascade layers vs Astro responsive styles | Astro's `:where()` defaults can beat `object-cover` | Set `responsiveStyles: false` and style images yourself, or verify |
| `src/fetch.ts` reserved | Would shadow advanced routing | Don't create it |
| `<Image />` unavailable inside framework components | Affects Option B only | Pass `getImage()` results, or render stills in `.astro` |

---

## 11. Implementation phases

**Phase 0 — Scaffold Astro 7**
- [ ] `npm create astro@latest` (minimal), add `@tailwindcss/vite` to `vite.plugins`; no React.
- [ ] `astro.config.mjs`: `site`, `image.layout`, `responsiveStyles`.
- [ ] Port `tsconfig` (`extends: astro/tsconfigs/strict`, `@/*` alias); move `index.css` →
      `styles/global.css`; create `Base.astro`.
- [ ] Move stills to `src/assets/stills/`; verify `astro dev` serves a placeholder page.

**Phase 1 — Markdown content**
- [ ] Add `src/content.config.ts` (imports per §4).
- [ ] Create the 4 film `.md` files from `films.ts`, plus `about.md`, `filmography.md`.
- [ ] Confirm `astro sync` types and schema validation pass.

**Phase 2 — Static markup + CSS**
- [ ] Port `BioHeader`, `FilmAccordion`, `FilmItem`, `FilmDetail`, `Credits`, `ReadMorePanel` to
      `.astro`; port `credits.ts`.
- [ ] Port `index.css` tokens/layout; add interaction states in `portfolio.css` (or Tailwind
      `data-[open=true]:` variants).
- [ ] Check collapsed/expanded geometry against `SPEC.md` §2 and §4.1 with JS disabled.

**Phase 3 — Island**
- [ ] Implement `scripts/portfolio.ts` (§7): single-open, theming, detail swap, credits, read-more,
      reduced motion.
- [ ] Confirm the accordion midpoint stays fixed while height animates and bg/text transitions.

**Phase 4 — Pages, SEO, polish**
- [ ] `films/[id].astro` + `getStaticPaths`; sitemap; canonical/OG meta.
- [ ] Responsive check at 768 / 1024 and mobile column order (`SPEC.md` §10).
- [ ] Accessibility pass: `aria-expanded`/`aria-controls`, focus ring `currentColor`, credits
      contrast per background, reduced motion.
- [ ] Delete `index.html`, `src/main.tsx`, `vite.config.ts`, and React/shadcn deps.

**Phase 5 — Deploy**
- [ ] `astro build` → `dist/`; deploy to Netlify/Vercel/GitHub Pages.
- [ ] Smoke-test `/`, `/films/*`, fonts, stills, per-film theming.

---

## 12. Risks and open questions

| # | Risk / question | Mitigation |
|---|---|---|
| 1 | Vanilla island can't perfectly match Motion springs. | Motion is only doing CSS-expressible ops; reuse the exact durations/eases and verify (`SPEC.md` §8). Option B if drift matters. |
| 2 | `compressHTML: 'jsx'` changes inline spacing. | `{" "}` in `BioHeader.astro`; visual check. |
| 3 | Multiline credits mangled by YAML. | `|` block scalars; `lib/credits.ts` parser already expects `\n`. |
| 4 | Tailwind vs Astro responsive-image styles. | Prefer `responsiveStyles: false` + explicit classes; verify crop at 928×503. |
| 5 | Per-film palettes / 3 descriptions unresolved (`SPEC.md` §5.1, §13). | Now editable in Markdown; ship current values as placeholders pending client sign-off. |
| 6 | Still vs. looping video undecided (`SPEC.md` §13.3). | Keep `<Image>`; add optional `video:` frontmatter later. |
| 7 | Astro 7 is recent (7.0 ~June 2026). | Pin `~7.3`, keep lockfile; content API is stable since v5. |

Client-confirm items from `SPEC.md` §13 remain open and are now editable in Markdown.

---

## 13. Definition of done

- [ ] `astro build` produces a static `dist/`; `astro dev` gives HMR with no CMS and no React runtime.
- [ ] All films, the bio, and the filmography are **Markdown files**; no content lives in code.
- [ ] Home reproduces `SPEC.md`: fixed-midpoint centered accordion, per-film bg/text, still +
      two-column credits, read-more panel, matching motion.
- [ ] Each film has a real, indexable URL, with optimized responsive stills.
- [ ] Responsive behavior matches §10 at mobile / tablet / desktop.
- [ ] Accessibility checks pass (aria, focus, contrast, reduced motion).
- [ ] Deployed; `/`, `/films/*`, fonts, and stills all load.
