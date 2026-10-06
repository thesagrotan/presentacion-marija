import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { ContrastLevel, HSL } from "@/lib/color";
import { nearestPantones } from "@/lib/pantone";
import {
  apcaContrast,
  apcaLevel,
  formatHsl,
  hexToHsl,
  hslToHex,
  rgbToHex,
  wcagContrast,
} from "@/lib/color";
import { DEFAULT_THEME_ID, HOME_BG, HOME_TEXT } from "@/lib/theme";

export interface DevFilm {
  id: string;
  title: string;
  bg: string;
  text: string;
}

type Kind = "bg" | "text";

interface FilmColor {
  bg: HSL;
  text: HSL;
}

type Colors = Record<string, FilmColor>;

interface Target {
  id: string;
  kind: Kind;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Edit {
  id: string;
  kind: Kind;
  x: number;
  y: number;
}

const STORAGE_KEY = "dev:film-colors";

const sliderThumb =
  "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/30 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white";

function updateFilmButton(id: string, bg: string, text: string): void {
  document
    .querySelectorAll<HTMLElement>("[data-film-item]")
    .forEach((button) => {
      if (button.dataset.id === id) {
        button.dataset.bg = bg;
        button.dataset.text = text;
      }
    });
}

function getActiveId(): string | null {
  const active = document.querySelector<HTMLElement>(
    '[data-film-detail][data-active="true"]',
  );
  return active?.dataset.id ?? null;
}

function resolveTarget(clientX: number, clientY: number): Target | null {
  const stack = document.elementsFromPoint(clientX, clientY);
  const activeId = getActiveId();

  for (const node of stack) {
    const el = node as HTMLElement;
    if (el.closest("[data-dev-ui]")) continue;

    const item = el.closest<HTMLElement>("[data-film-item]");
    if (item?.dataset.id) {
      const rect = item.getBoundingClientRect();
      return {
        id: item.dataset.id,
        kind: "text",
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
      };
    }

    if (el.closest("#portfolio")) {
      const shell = document.querySelector<HTMLElement>("#portfolio");
      if (shell) {
        const rect = shell.getBoundingClientRect();
        return {
          id: activeId ?? DEFAULT_THEME_ID,
          kind: "bg",
          x: rect.left,
          y: rect.top,
          w: rect.width,
          h: rect.height,
        };
      }
    }
  }

  return null;
}

interface ImageDataEntry {
  data: Uint8ClampedArray;
  w: number;
  h: number;
}

const imageCache = new Map<string, ImageDataEntry | null>();

function loadImageData(img: HTMLImageElement): ImageDataEntry | null {
  const src = img.currentSrc || img.src;
  if (!src) return null;
  if (imageCache.has(src)) return imageCache.get(src) ?? null;

  const natW = img.naturalWidth;
  const natH = img.naturalHeight;
  if (!natW || !natH) return null;

  const maxDim = 1200;
  const scale = Math.min(1, maxDim / Math.max(natW, natH));
  const w = Math.max(1, Math.round(natW * scale));
  const h = Math.max(1, Math.round(natH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    imageCache.set(src, null);
    return null;
  }
  ctx.drawImage(img, 0, 0, w, h);

  let entry: ImageDataEntry | null = null;
  try {
    entry = { data: ctx.getImageData(0, 0, w, h).data, w, h };
  } catch {
    entry = null;
  }
  imageCache.set(src, entry);
  return entry;
}

function filmImage(id: string): HTMLImageElement | null {
  const detail = document.querySelector<HTMLElement>(
    `[data-film-detail][data-id="${id}"]`,
  );
  return detail?.querySelector("img") ?? null;
}

function sampleImage(
  img: HTMLImageElement,
  clientX: number,
  clientY: number,
): string | null {
  const entry = loadImageData(img);
  if (!entry) return null;

  const rect = img.getBoundingClientRect();
  const natW = img.naturalWidth;
  const natH = img.naturalHeight;
  if (!natW || !natH) return null;

  const scale = Math.max(rect.width / natW, rect.height / natH);
  const drawnW = natW * scale;
  const drawnH = natH * scale;
  const offsetX = (rect.width - drawnW) / 2;
  const offsetY = (rect.height - drawnH) / 2;

  const sx = (clientX - rect.left - offsetX) / scale;
  const sy = (clientY - rect.top - offsetY) / scale;
  if (sx < 0 || sy < 0 || sx >= natW || sy >= natH) return null;

  const cx = Math.min(entry.w - 1, Math.floor((sx * entry.w) / natW));
  const cy = Math.min(entry.h - 1, Math.floor((sy * entry.h) / natH));
  const i = (cy * entry.w + cx) * 4;
  return rgbToHex(entry.data[i], entry.data[i + 1], entry.data[i + 2]);
}

function baseColors(films: DevFilm[]): Colors {
  const base: Colors = {
    [DEFAULT_THEME_ID]: { bg: hexToHsl(HOME_BG), text: hexToHsl(HOME_TEXT) },
  };
  for (const film of films) {
    base[film.id] = { bg: hexToHsl(film.bg), text: hexToHsl(film.text) };
  }
  return base;
}

function initialColors(films: DevFilm[]): Colors {
  const base = baseColors(films);
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<Colors>;
        for (const id of Object.keys(stored)) {
          const value = stored[id];
          if (base[id] && value?.bg && value?.text) base[id] = value;
        }
      }
    } catch {
      /* ignore malformed storage */
    }
  }
  return base;
}

function Slider({
  value,
  max,
  label,
  track,
  onInput,
}: {
  value: number;
  max: number;
  label: string;
  track: string;
  onInput: (value: number) => void;
}) {
  return (
    <input
      type="range"
      min={0}
      max={max}
      step={1}
      value={value}
      aria-label={label}
      onInput={(event) =>
        onInput(Number((event.currentTarget as HTMLInputElement).value))
      }
      style={{ background: track }}
      class={`h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none ${sliderThumb}`}
    />
  );
}

function ColorSliders({
  value,
  onChange,
}: {
  value: HSL;
  onChange: (value: HSL) => void;
}) {
  const set = (patch: Partial<HSL>): void => onChange({ ...value, ...patch });
  const satTrack = `linear-gradient(to right, hsl(${value.h} 0% ${value.l}%), hsl(${value.h} 100% ${value.l}%))`;
  const lightTrack = `linear-gradient(to right, hsl(${value.h} ${value.s}% 0%), hsl(${value.h} ${value.s}% 50%), hsl(${value.h} ${value.s}% 100%))`;

  return (
    <div class="mt-2 grid gap-1.5">
      <div class="flex items-center gap-2">
        <span class="w-2.5 text-[10px] text-neutral-500">H</span>
        <Slider
          label="hue"
          value={value.h}
          max={360}
          onInput={(h) => set({ h })}
          track="linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
        />
        <span class="w-7 shrink-0 text-right font-mono text-[10px] text-neutral-400">
          {value.h}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2.5 text-[10px] text-neutral-500">S</span>
        <Slider
          label="saturation"
          value={value.s}
          max={100}
          onInput={(s) => set({ s })}
          track={satTrack}
        />
        <span class="w-7 shrink-0 text-right font-mono text-[10px] text-neutral-400">
          {value.s}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2.5 text-[10px] text-neutral-500">L</span>
        <Slider
          label="lightness"
          value={value.l}
          max={100}
          onInput={(l) => set({ l })}
          track={lightTrack}
        />
        <span class="w-7 shrink-0 text-right font-mono text-[10px] text-neutral-400">
          {value.l}
        </span>
      </div>
    </div>
  );
}

const contrastTones: Record<ContrastLevel, { label: string; text: string; bar: string }> = {
  preferred: { label: "preferred", text: "bg-emerald-500/15 text-emerald-300", bar: "bg-emerald-400" },
  body: { label: "body text", text: "bg-green-500/15 text-green-300", bar: "bg-green-400" },
  large: { label: "large text", text: "bg-amber-500/15 text-amber-300", bar: "bg-amber-400" },
  headline: { label: "headlines", text: "bg-orange-500/15 text-orange-300", bar: "bg-orange-400" },
  fail: { label: "fails", text: "bg-red-500/15 text-red-300", bar: "bg-red-400" },
};

function ContrastCheck({ text, bg }: { text: string; bg: string }) {
  const fontSize = 16;
  const lc = Math.abs(apcaContrast(text, bg));
  // Relaxed floor set to Lc 60 (APCA's large-text tier, ≈WCAG 3:1) rather than
  // the APCA LUT's Lc 90 or the WCAG AA body floor of Lc 75.
  const minLc = 60;
  const tone = contrastTones[apcaLevel(lc, fontSize, 400, minLc)];
  const ratio = wcagContrast(text, bg);
  const meter = Number.isFinite(minLc)
    ? Math.min(100, (lc / minLc) * 100)
    : 0;

  return (
    <div class="mt-2 rounded-lg border border-white/10 bg-black/20 p-2">
      <div class="flex items-center gap-2">
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 text-[12px] font-semibold"
          style={{ background: bg, color: text }}
        >
          Aa
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-[10px] text-neutral-400">
              APCA Lc {lc.toFixed(1)} /{" "}
              {Number.isFinite(minLc) ? minLc.toFixed(0) : "—"} @ {fontSize}px
            </span>
            <span
              class={`rounded px-1.5 py-0.5 font-mono text-[9px] tracking-wide uppercase ${tone.text}`}
            >
              {tone.label}
            </span>
          </div>
          <div class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              class={`h-full origin-left rounded-full transition-transform duration-150 ${tone.bar}`}
              style={{ transform: `scaleX(${meter / 100})` }}
            />
          </div>
        </div>
      </div>
      <div class="mt-1 text-right font-mono text-[9px] text-neutral-500">
        WCAG 2 {ratio.toFixed(2)}:1
      </div>
    </div>
  );
}

export default function DevPanel({ films }: { films: DevFilm[] }) {
  const [colors, setColors] = useState<Colors>(() => initialColors(films));
  const [inspect, setInspect] = useState(false);
  const [hover, setHover] = useState<Target | null>(null);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [sampling, setSampling] = useState(false);
  const [sample, setSample] = useState<{ x: number; y: number; color: string } | null>(
    null,
  );
  const [copied, setCopied] = useState<"yaml" | "prompt" | null>(null);
  const [hoverTcx, setHoverTcx] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const editRef = useRef<Edit | null>(null);
  editRef.current = edit;

  const dragRef = useRef<{
    px: number;
    py: number;
    ox: number;
    oy: number;
  } | null>(null);

  const onDragStart = (event: PointerEvent): void => {
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;
    const el = event.currentTarget as HTMLElement;
    const rect = el.parentElement?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      px: event.clientX,
      py: event.clientY,
      ox: rect.left,
      oy: rect.top,
    };
    el.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: PointerEvent): void => {
    const drag = dragRef.current;
    if (!drag) return;
    const x = Math.min(
      Math.max(8, drag.ox + event.clientX - drag.px),
      window.innerWidth - 272,
    );
    const y = Math.min(
      Math.max(8, drag.oy + event.clientY - drag.py),
      Math.max(8, window.innerHeight - 80),
    );
    setPos({ x, y });
  };

  const onDragEnd = (event: PointerEvent): void => {
    dragRef.current = null;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
  };

  useEffect(() => {
    for (const film of films) {
      const color = colors[film.id];
      if (!color) continue;
      const bg = hslToHex(color.bg);
      const text = hslToHex(color.text);
      updateFilmButton(film.id, bg, text);
      window.dispatchEvent(
        new CustomEvent("dev:film-theme", {
          detail: { id: film.id, bg, text },
        }),
      );
    }
    const home = colors[DEFAULT_THEME_ID];
    if (home) {
      window.dispatchEvent(
        new CustomEvent("dev:film-theme", {
          detail: {
            id: DEFAULT_THEME_ID,
            bg: hslToHex(home.bg),
            text: hslToHex(home.text),
          },
        }),
      );
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    }
  }, [colors]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (event.key === "Escape") {
        if (editRef.current) setEdit(null);
        else setInspect(false);
        return;
      }
      if (event.shiftKey && event.key === "D" && !event.metaKey && !event.ctrlKey) {
        setInspect((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!edit) {
      setSampling(false);
      setSample(null);
      setPos(null);
    }
  }, [edit]);

  const startInspect = (): void => {
    setInspect((value) => {
      if (value) {
        setHover(null);
        setEdit(null);
      }
      return !value;
    });
  };

  const onMove = (event: PointerEvent): void => {
    if (sampling && edit) {
      const img = filmImage(edit.id);
      const color = img ? sampleImage(img, event.clientX, event.clientY) : null;
      setSample(color ? { x: event.clientX, y: event.clientY, color } : null);
      setHover(null);
      return;
    }
    const next = resolveTarget(event.clientX, event.clientY);
    setHover(next);
  };

  const onPick = (event: MouseEvent): void => {
    if (sampling && edit) {
      const img = filmImage(edit.id);
      const color = img ? sampleImage(img, event.clientX, event.clientY) : null;
      if (color) setColor(edit.id, edit.kind, hexToHsl(color));
      setSampling(false);
      setSample(null);
      return;
    }
    const target = resolveTarget(event.clientX, event.clientY);
    if (!target) {
      setEdit(null);
      return;
    }
    setEdit({ id: target.id, kind: target.kind, x: event.clientX, y: event.clientY });
    setPos({
      x: Math.min(Math.max(8, event.clientX - 132), window.innerWidth - 272),
      y: Math.min(
        Math.max(8, event.clientY + 14),
        Math.max(8, window.innerHeight - 540),
      ),
    });
  };

  const setColor = (id: string, key: Kind, value: HSL): void => {
    setColors((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const reset = (): void => {
    setColors(baseColors(films));
  };

  const copy = async (kind: "yaml" | "prompt", text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const copyYaml = (): Promise<void> => {
    const body = films
      .map((film) => {
        const color = colors[film.id];
        return `${film.id}:\n  bg: "${hslToHex(color.bg)}"\n  text: "${hslToHex(color.text)}"`;
      })
      .join("\n");
    return copy("yaml", body);
  };

  const copyPrompt = (): Promise<void> => {
    const lines = films
      .map((film) => {
        const color = colors[film.id];
        return `- src/content/films/${film.id}.md ("${film.title}"): bg: "${hslToHex(color.bg)}", text: "${hslToHex(color.text)}"`;
      })
      .join("\n");
    const prompt = [
      "Update the default film colors in the Astro content frontmatter.",
      "In each file below, set the `bg` and `text` fields to the given hex values and leave everything else unchanged:",
      "",
      lines,
    ].join("\n");
    return copy("prompt", prompt);
  };

  const titleFor = (id: string): string =>
    id === DEFAULT_THEME_ID
      ? "Home"
      : (films.find((film) => film.id === id)?.title ?? id);

  const editTitle = edit ? titleFor(edit.id) : "";

  const activeHex = edit ? hslToHex(colors[edit.id][edit.kind]) : null;
  const suggestions = useMemo(
    () => (activeHex ? nearestPantones(activeHex, 40) : []),
    [activeHex],
  );
  const activePantone =
    suggestions.find((pantone) => pantone.tcx === hoverTcx) ?? suggestions[0];

  return (
    <>
      {inspect && (
        <div
          data-dev-ui
          class="fixed inset-0 z-[100] cursor-crosshair"
          onPointerMove={onMove}
          onClick={onPick}
        />
      )}

      {inspect && hover && !edit && (
        <div
          data-dev-ui
          aria-hidden="true"
          class="pointer-events-none fixed z-[101] rounded-sm border-2 border-sky-400 bg-sky-400/10"
          style={{
            left: `${hover.x}px`,
            top: `${hover.y}px`,
            width: `${hover.w}px`,
            height: `${hover.h}px`,
          }}
        >
          <span class="absolute -top-5 left-0 rounded bg-sky-500 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-white">
            {titleFor(hover.id)} · {hover.kind === "bg" ? "background" : "text"}
          </span>
        </div>
      )}

      {sampling && sample && (
        <div
          data-dev-ui
          aria-hidden="true"
          class="pointer-events-none fixed z-[115] flex items-center gap-2 rounded-lg border border-white/20 bg-neutral-900/95 p-1.5 shadow-xl backdrop-blur"
          style={{
            left: `${Math.min(sample.x + 16, window.innerWidth - 152)}px`,
            top: `${Math.min(sample.y + 16, window.innerHeight - 56)}px`,
          }}
        >
          <span
            class="h-8 w-8 rounded border border-white/25"
            style={{ background: sample.color }}
          />
          <span class="pr-1 font-mono text-[11px] text-neutral-200">
            {sample.color}
          </span>
        </div>
      )}

      {edit && (
        <div
          data-dev-ui
          class="fixed z-[110] w-[264px] rounded-xl border border-white/10 bg-neutral-900/95 p-3 text-neutral-100 shadow-2xl backdrop-blur"
          style={{
            left: `${pos ? pos.x : Math.min(Math.max(8, edit.x - 132), window.innerWidth - 272)}px`,
            top: `${pos ? pos.y : Math.min(Math.max(8, edit.y + 14), Math.max(8, window.innerHeight - 540))}px`,
          }}
        >
          <div
            class="-m-1 mb-1 flex cursor-grab touch-none items-center gap-2 rounded-lg p-1 select-none active:cursor-grabbing"
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
          >
            <span
              class="h-4 w-4 shrink-0 rounded-[4px] border border-white/25"
              style={{ background: hslToHex(colors[edit.id][edit.kind]) }}
            />
            <span class="truncate text-[11px] font-medium text-neutral-200">
              {editTitle}
            </span>
            <button
              type="button"
              onClick={() => setEdit(null)}
              aria-label="Close picker"
              class="ml-auto rounded px-1.5 py-0.5 text-[13px] leading-none text-neutral-400 transition hover:bg-white/10 hover:text-neutral-100"
            >
              ×
            </button>
          </div>
          <div class="mt-2 flex gap-1 rounded-md bg-black/30 p-0.5">
            {(["bg", "text"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setEdit((prev) => (prev ? { ...prev, kind } : prev))}
                class={`flex-1 rounded px-2 py-1 text-[10px] transition ${
                  edit.kind === kind
                    ? "bg-white/15 text-neutral-100"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {kind === "bg" ? "Background" : "Text"}
              </button>
            ))}
          </div>
          <ContrastCheck
            text={hslToHex(colors[edit.id].text)}
            bg={hslToHex(colors[edit.id].bg)}
          />
          <button
            type="button"
            onClick={() => {
              setSampling((value) => !value);
              setSample(null);
            }}
            class={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] transition ${
              sampling
                ? "bg-sky-500 text-white"
                : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-neutral-100"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="m2 22 1-1h3l9-9" />
              <path d="M3 21v-3l9-9" />
              <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.5 1.5-3 3-3-3 3-3L14 7z" />
            </svg>
            {sampling ? "click the still…" : "sample from still"}
          </button>
          <ColorSliders
            value={colors[edit.id][edit.kind]}
            onChange={(value) => setColor(edit.id, edit.kind, value)}
          />
          <div class="mt-2 flex items-center justify-between font-mono text-[10px] text-neutral-500">
            <span>{formatHsl(colors[edit.id][edit.kind])}</span>
            <span>{hslToHex(colors[edit.id][edit.kind])}</span>
          </div>
          {suggestions.length > 0 && (
            <div class="mt-3 border-t border-white/10 pt-2.5">
              <div class="flex items-baseline justify-between gap-2">
                <span class="text-[9px] font-medium tracking-[0.12em] text-neutral-400 uppercase">
                  Pantone
                </span>
                <span class="min-w-0 truncate font-mono text-[10px] text-neutral-500">
                  {activePantone
                    ? `${activePantone.name} · ${activePantone.tcx}`
                    : ""}
                </span>
              </div>
              <div class="mt-1.5 grid grid-cols-8 gap-1">
                {suggestions.map((pantone) => {
                  const selected =
                    activeHex?.toUpperCase() === pantone.hex.toUpperCase();
                  return (
                    <button
                      key={pantone.tcx}
                      type="button"
                      title={`${pantone.name} · ${pantone.tcx} · ΔE ${pantone.distance.toFixed(1)}`}
                      aria-label={`${pantone.name} ${pantone.tcx}`}
                      onMouseEnter={() => setHoverTcx(pantone.tcx)}
                      onMouseLeave={() => setHoverTcx(null)}
                      onFocus={() => setHoverTcx(pantone.tcx)}
                      onBlur={() => setHoverTcx(null)}
                      onClick={() =>
                        edit && setColor(edit.id, edit.kind, hexToHsl(pantone.hex))
                      }
                      class={`h-5 flex-1 rounded-sm border transition ${
                        selected
                          ? "border-white ring-2 ring-white/60"
                          : "border-white/15 hover:border-white/60"
                      }`}
                      style={{ background: pantone.hex }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        data-dev-ui
        class="fixed right-4 bottom-4 z-[120] flex flex-col items-end gap-2"
      >
        {inspect && (
          <span class="rounded-md bg-neutral-900/95 px-2 py-1 font-mono text-[10px] text-neutral-300 shadow-lg backdrop-blur">
            click text, or click the background
          </span>
        )}
        <div class="flex items-center gap-1 rounded-full border border-white/10 bg-neutral-900/95 p-1 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={startInspect}
            title="Toggle inspect mode (Shift+D)"
            class={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-mono text-[11px] transition ${
              inspect
                ? "bg-sky-500 text-white"
                : "text-neutral-300 hover:bg-white/10 hover:text-neutral-100"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="m2 22 1-1h3l9-9" />
              <path d="M3 21v-3l9-9" />
              <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.5 1.5-3 3-3-3 3-3L14 7z" />
            </svg>
            pick
          </button>
          <button
            type="button"
            onClick={reset}
            class="rounded-full px-2.5 py-1.5 font-mono text-[11px] text-neutral-400 transition hover:bg-white/10 hover:text-neutral-100"
          >
            reset
          </button>
          <button
            type="button"
            onClick={copyYaml}
            class="rounded-full px-2.5 py-1.5 font-mono text-[11px] text-neutral-400 transition hover:bg-white/10 hover:text-neutral-100"
          >
            {copied === "yaml" ? "copied" : "yaml"}
          </button>
          <button
            type="button"
            onClick={copyPrompt}
            title="Copy an AI prompt that updates the default colors in the content files"
            class="rounded-full px-2.5 py-1.5 font-mono text-[11px] text-neutral-400 transition hover:bg-white/10 hover:text-neutral-100"
          >
            {copied === "prompt" ? "copied" : "prompt"}
          </button>
        </div>
      </div>
    </>
  );
}
