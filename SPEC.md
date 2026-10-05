# Marija Arakelyan Lučić — Portfolio Build Spec

Handoff spec for a React + [Motion](https://motion.dev) (Framer Motion) implementation.
Extracted from the Figma file, frames **`home`** (collapsed, node `11:631`) and **`film unfolded`** (expanded, node `11:648`). The file is a flat mock: **no components, variables, or styles exist** — every value below is hard-coded from node geometry and SVG exports.

> Behavioral rule (from client): the accordion of films **stays vertically centered** whether collapsed or expanded. **Every film has its own background + text color.**

---

## 1. Canvas & breakpoints

| Token | Value |
|---|---|
| Figma canvas | 1280 × 832 (MacBook Air) |
| Design reference width | 1280 |
| Breakpoints | `mobile < 768`, `tablet 768–1023`, `desktop ≥ 1024` |
| Page padding (desktop) | 48 px (left) |
| Page padding (tablet) | 32 px |
| Page padding (mobile) | 24 px |

Fonts:

- **Geist** Regular (400) — load via `@fontsource/geist` or Google Fonts. Not a system font.
- **Georgia** Regular (400) — system serif fallback stack: `Georgia, 'Times New Roman', serif`.

---

## 2. Desktop layout (the Figma geometry)

All values are absolute px in the 1280 × 832 frame.

| Element | x | y | w | h | Notes |
|---|---|---|---|---|---|
| Bio header | 48 | 48 | 497 (max) | auto | fixed top-left |
| Accordion column | 48 | center 416 | **244** | animated | see §4 |
| Still image | 353 | 165 | 928 | 503 | flush right (353+928=1281), vertically centered |
| Credits block | 491 | 700 | 763 | 98 | 2 columns × 368, 27 px gutter |

- Gap accordion → image: **353 − (48 + 244) = 61 px**.
- Image vertical center: `165 + 503/2 = 416.5` ≈ accordion center `416`.
- Image fill: `object-fit: cover`, no radius, source 2048 × 1080.

---

## 3. Typography

| Role | Family | Weight | Size | Line-height | Color |
|---|---|---|---|---|---|
| Film title | Georgia | 400 | 17.5 | 21.9 | `--film-text` (#12140B on Enigma) |
| Film description | Geist | 400 | 14 | 17.5 | `--film-text` |
| Bio header | Geist | 400 | 14 | 16 | `#000000` |
| Bio paragraphs (read-more) | Geist | 400 | 14 | 20 | `#121212` |
| Filmography list (read-more) | Geist | 400 | 14 | 16 | `#121212` |
| Credits | Geist | 400 | 12 | 14 | `#000000` |

- Letter-spacing: 0 everywhere.
- Bio header: the name segment (`Marija Arakelyan Lučić`) is **UPPERCASED** (`text-transform: uppercase`); the remainder is normal case. Trailing `read more` / `close` is an interactive link.
- Bio header string collapsed: `Marija Arakelyan Lučić is a filmmaker based in Berlin. read more`
- Bio header string expanded: `Marija Arakelyan Lučić is a filmmaker based in Berlin. close`

---

## 4. Accordion — geometry, centering, interaction

### 4.1 Centering rule (verified)

| State | Frame 4 top | Height | Center |
|---|---|---|---|
| Collapsed (home) | 325 | 182 | **416** |
| Expanded (film unfolded) | 192 | 448 | **416** |

The accordion's vertical center is pinned to the viewport middle (`832/2 = 416`) while its height animates. Implement with a full-height centered flex wrapper, never by animating `top`:

```css
.stage      { min-height: 100vh; display: grid; grid-template-rows: 1fr; align-items: center; }
.accordion  { width: 244px; margin-left: 48px; }
```

Collapsed vertical rhythm (gap **24 px**, first title wraps to 2 lines → h 44):

```
title1 (2 lines, 44)  → title2 (22) → title3 (22) → title4 (22)   = 182
```

Expanded item anatomy (top → bottom):

```
rule (24 × 1, currentColor)     0
+24  title                       24   (h 44 when wrapped)
+8   description                 52   (h 210)
+24  rule                        310
+24  next title                  334
+46  next title                  380
+46  next title                  426   = 448
```

- Separator rule: **24 px wide, 1 px tall**, color `#12140B` (SVG: `<line x1=48 y1=191.5 x2=72 .../>`).
- Gap between list items: **24 px** (single-line step 46 = 22 + 24).
- Gap title → description: **8 px**.
- Gap rule → adjacent block: **24 px**.

### 4.2 Interaction (client-confirmed: inline, same screen)

- Clicking a film title expands that item in place; any other expanded item collapses. Only one open at a time.
- Expanding shows: the item's description, its two separator rules, the still image, and the credits block.
- Clicking the open title again collapses back to `home`.
- Collapsed state = white background, only titles. Expanded state = the film's background color, that item's description + rules, still + credits.
- Keep the accordion center fixed while the height animates (see §4.1). The still is also vertically centered; credits are absolutely positioned at the bottom (`y 700`).

---

## 5. Color tokens

```
--home-bg:      #FFFFFF
--text-primary: #12140B   /* default film text + rules */
--text-ink:     #000000   /* bio header + credits */
--text-bio:     #121212   /* read-more paragraphs + filmography */
```

### 5.1 Per-film palettes

Figma defines **only** the Enigma palette (`#96A391` bg / `#12140B` text). The remaining three were **proposed by sampling each film's still** (dominant muted hue, ~L60/S10–20%), matching the Enigma treatment. They are swappable — confirm with the client.

| Film | Background | Text | Rule/accent |
|---|---|---|---|
| The Enigma of an Autumn Afternoon | `#96A391` *(from design)* | `#12140B` *(from design)* | `#12140B` |
| Exercise Zero | `#93A98F` | `#10160D` | dark → must contrast bg |
| A Sweet Habit | `#B08C86` | `#1A0E0C` | |
| The Girl and the Sea | `#8FA2A6` | `#0C1417` | |

Rules and collapsed/expanded titles use the film's text color. Credits use `#000000` in the design; on darker proposed backgrounds prefer the film text color and verify WCAG AA (≥ 4.5:1 for 12 px text).

---

## 6. Content model

```ts
type Theme = { bg: string; text: string };

type Film = {
  id: string;                       // slug
  title: string;                    // accordion label (title case)
  description: string;              // shown when expanded
  still: string;                    // image URL
  theme: Theme;
  credits: {
    left: string;                   // Director / DOP / Sound / Cast
    right: string;                  // support + festivals
  };
};

const films: Film[] = [
  {
    id: "enigma",
    title: "The Enigma of an Autumn Afternoon",
    description:
      'Inspired by the metaphysical paintings of Giorgio de Chirico, the film transforms an ordinary public space into a mysterious and dreamlike tableau. Like De Chirico’s silent plazas and suspended moments, "The Enigma of an Autumn Afternoon" explores stillness, ambiguity, and the subtle strangeness that can exist within familiar places, as people gather beneath a tree enchanted by an invisible orchestra of birds.',
    still: "/stills/enigma.jpg",
    theme: { bg: "#96A391", text: "#12140B" },
    credits: {
      left:
        "Director: Marija Arakelyan Lučić\nDOP: Danny Shin\nSound design/mix: Luka Barajević\nCast: Ábris Imre, Miyeon Hwang, Julien Kartheuser, Leo Zhang, Peng Liu, Santiago Gómez García, Marcos Quincke, Doruk Kaya, Luise Hogg, Camille Couavoux, Ema Dobrić",
      right:
        "With the support of  Hochschule für bildende Künste Hamburg\n\nASA Open Studios HFBK, Hamburg, Germany, 2026\nFilmkunsttage Sachsen Anhalt, Germany, 2026\n43. Kassel Documentary Film and Video Festival, Kassel, Germany, 2026",
    },
  },
  // TODO: descriptions + credits for the three below are NOT in the Figma file.
  { id: "exercise-zero", title: "Exercise Zero", description: "", still: "/stills/exercise-zero.jpg", theme: { bg: "#93A98F", text: "#10160D" }, credits: { left: "", right: "" } },
  { id: "a-sweet-habit", title: "A Sweet Habit", description: "", still: "/stills/a-sweet-habit.jpg", theme: { bg: "#B08C86", text: "#1A0E0C" }, credits: { left: "", right: "" } },
  { id: "the-girl-and-the-sea", title: "The Girl and the Sea", description: "", still: "/stills/girl-and-the-sea.jpg", theme: { bg: "#8FA2A6", text: "#0C1417" }, credits: { left: "", right: "" } },
];
```

Filmography metadata (from the read-more panel):

- The Enigma of an Autumn Afternoon — 4 min, 2026
- exercise zero — 6 min, 2026
- a sweet habit — 7 min, 2025
- The Girl and the Sea — 7 min, 2023

---

## 7. Component structure (React)

```
<Portfolio>
  <BioHeader readMore={bool} onToggle />
  <Accordion activeId={string | null}>
    {films.map(f => <FilmItem film={f} open={f.id === activeId} onToggle />)}
  </Accordion>
  <FilmDetail film={activeFilm} />   // still + credits, fades in
</Portfolio>
```

- `Accordion`: centered flex wrapper (§4.1); height animates.
- `FilmItem`: a `<button>` with `aria-expanded`; collapsed = title only; expanded = rule + title + description + rule.
- `FilmDetail`: `<img>`/`<video>` still (928 × 503 desktop, cover) + two-column credits. Rendered below/behind the accordion, only for the active film.
- `BioHeader`: renders the name (uppercase) + static sentence + a `read more` / `close` toggle button.

---

## 8. Motion spec (Motion / Framer Motion)

- **Accordion item height**: animate `height` `auto` via `layout` or `animate={{ height }}`; duration ~0.4 s, `easeInOut` (or a soft spring). Never animate the accordion's vertical position — the centered wrapper keeps the midpoint fixed.
- **Background color**: animate the page/`Portfolio` `backgroundColor` between `#FFFFFF` and `film.theme.bg`, ~0.5 s.
- **Text color**: transition titles/rules to `film.theme.text`.
- **Still + credits**: `initial={{ opacity: 0, scale: 1.02 }}` → `animate={{ opacity: 1, scale: 1 }}`, ~0.5 s, slight delay after expansion.
- **Bio header toggle**: crossfade `read more` ⇄ `close`; animate the read-more panel height/opacity.
- Respect `useReducedMotion()`: disable transforms and jump cuts, keep only opacity.

---

## 9. Read-more panel (frame `11:664`, in scope)

Triggered by the header `read more` link; same screen, panel expands over/within the left column.

Layout (desktop):

- Bio paragraphs: `x 48, y 96, w 549`, Geist 14 / 20, `#121212`.
- `FILMOGRAPHY & FESTIVALS` list: `x 54, y 296, w 549`, Geist 14 / 16, `#121212`. Long list — panel scrolls.
- Header switches to `… close`.

Bio paragraphs text:

> Marija Arakelyan Lučić is a Croatian filmmaker and artist based in Berlin. She studies at HFBK Hamburg in the class of Angela Schanelec, where she worked as her student assistant from 2024 to 2026.
>
> In 2025, she received the Achievement Grant Award for International Students and is currently on an ASA-supported exchange at Universidad del Cine in Buenos Aires. Her short films move between narrative fiction and experimental cinema and have been screened at international festivals and exhibitions.

The `FILMOGRAPHY & FESTIVALS` list content is captured in node `11:688` (see the Figma file; ~2.9 k characters, list ordered newest → oldest). Treat as a single rich-text block: heading line is uppercase, then one entry per line.

> Out of scope: the separate about page `11:674` (three-column ABOUT ME / FILMOGRAPHY layout). Note it for a future pass.

---

## 10. Responsive behavior

**Desktop ≥ 1024** — exactly as §2.

**Tablet 768–1023**

- Padding 32.
- Accordion width 220.
- Keep the side-by-side composition: accordion centered-left, still to the right (`width: calc(100% - accordion - gap)`), credits below the still in two columns.
- Vertical centering still applies while content fits.

**Mobile < 768**

- Padding 24; `flex-direction: column`.
- Order: Bio header → accordion → still → credits.
- Accordion is centered when collapsed; when expanded (content exceeds the viewport) it becomes top-aligned and the page scrolls — do not clip.
- Still: full content width, 16:9, `object-fit: cover`.
- Credits: single column, stacked.
- Keep the 24 px item gap and 17.5/14 type sizes (optionally `clamp()` them down 1–2 px below 390 px width).

---

## 11. Assets

Export from Figma at 2× (or reuse source stills). Source still nodes on the page:

| Film | Source node | Native size |
|---|---|---|
| The Enigma of an Autumn Afternoon | `1:24` (`The Enigma of an Autumn Afternoon_Still3 1`) | 2048 × 1080 |
| Exercise Zero | `1:22` / `1:23` (`exercise zero_Still1/2`) | 1920 × 1080 |
| A Sweet Habit | `1:20` / `1:21` (`a sweet habit_Still1/2`) | 1920 × 1080 |
| The Girl and the Sea | `1:19` (`The Girl and the Sea_Still 1`) | 1920 × 1080 |

---

## 12. Accessibility

- Accordion items are real `<button>`s with `aria-expanded` + `aria-controls`; the panel has a matching `id`.
- Keyboard: Enter/Space toggles; only one open at a time.
- Visible focus ring consistent with the film text color.
- `read more` / `close` is a button, not a bare span.
- Check contrast of credits (`12 px`) against each proposed film background.

---

## 13. Open items to confirm with the client

1. **Palettes** for Exercise Zero / A Sweet Habit / The Girl and the Sea are proposals (§5.1) — need sign-off.
2. **Descriptions + credits** for those three films do not exist in Figma — content required.
3. Should the still be a **still image or a looping video** in the expanded state?
4. Exact easing/duration preferences (defaults proposed in §8).
5. Does `home` ever show more than one film expanded? (Spec assumes single-open.)
