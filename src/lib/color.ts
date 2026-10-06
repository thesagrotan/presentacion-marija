export interface HSL {
  h: number;
  s: number;
  l: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function expandHex(hex: string): string {
  const value = hex.trim().replace(/^#/, "");
  return value.length === 3
    ? value
        .split("")
        .map((char) => char + char)
        .join("")
    : value;
}

export function hexToHsl(hex: string): HSL {
  const value = expandHex(hex);
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    h =
      max === r
        ? ((g - b) / delta) % 6
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex({ h, s, l }: HSL): string {
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;
  const hue = ((h % 360) + 360) % 360;
  const chroma = sat * Math.min(light, 1 - light);
  const f = (n: number): number => {
    const k = (n + hue / 30) % 12;
    const value = light - chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * value);
  };
  return (
    "#" +
    [f(0), f(8), f(4)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

export function formatHsl({ h, s, l }: HSL): string {
  return `hsl(${h} ${s}% ${l}%)`;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function channels(hex: string): [number, number, number] {
  const value = expandHex(hex);
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function apcaY(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => Math.pow(v / 255, 2.4));
  return 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
}

export function relativeLuminance(hex: string): number {
  const lin = (v: number): number =>
    v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  const [r, g, b] = channels(hex).map((v) => lin(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function wcagContrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastLevel = "fail" | "headline" | "large" | "body" | "preferred";

// APCA Readability Criterion reference lookup table (LUT 0.1.5 G):
// minimum Lc per font size (CSS px) × font weight.
// 0 means the size/weight is not permitted for readable content (decorative/by-line only).
const APCA_LUT_SIZES = [12, 14, 15, 16, 18, 21, 24, 28, 32, 36, 42, 48, 60, 72, 96];
const APCA_LUT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const APCA_LUT: number[][] = [
  // 100 200 300  400  500  600  700  800  900
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // 12px
  [0, 0, 0, 100, 100, 90, 75, 0, 0], // 14px
  [0, 0, 0, 100, 90, 75, 70, 0, 0], // 15px
  [0, 0, 0, 90, 75, 70, 60, 60, 0], // 16px
  [0, 0, 100, 75, 70, 60, 55, 55, 55], // 18px
  [0, 0, 90, 70, 60, 55, 50, 50, 50], // 21px
  [0, 0, 75, 60, 55, 50, 45, 45, 45], // 24px
  [0, 100, 70, 55, 50, 45, 43, 43, 43], // 28px
  [0, 90, 65, 50, 45, 43, 40, 40, 40], // 32px
  [0, 75, 60, 45, 43, 40, 38, 38, 38], // 36px
  [100, 70, 55, 43, 40, 38, 35, 35, 35], // 42px
  [90, 60, 50, 40, 38, 35, 33, 33, 33], // 48px
  [75, 55, 45, 38, 35, 33, 30, 30, 30], // 60px
  [60, 50, 40, 35, 33, 30, 30, 30, 30], // 72px
  [50, 45, 35, 33, 30, 30, 30, 30, 30], // 96px
];

function interpolateAxis(
  axis: number[],
  value: number,
  read: (index: number) => number,
): number {
  if (value <= axis[0]) return read(0);
  for (let i = 1; i < axis.length; i += 1) {
    if (value <= axis[i]) {
      const t = (value - axis[i - 1]) / (axis[i] - axis[i - 1]);
      if (t <= 0) return read(i - 1);
      if (t >= 1) return read(i);
      const a = read(i - 1);
      const b = read(i);
      if (a === 0 || b === 0) return Infinity;
      return a + (b - a) * t;
    }
  }
  return read(axis.length - 1);
}

// Minimum Lc required by APCA for a given font size/weight (Infinity when the
// combination is not permitted for readable text).
export function apcaMinLc(fontSizePx: number, fontWeight = 400): number {
  const size = clamp(
    fontSizePx,
    APCA_LUT_SIZES[0],
    APCA_LUT_SIZES[APCA_LUT_SIZES.length - 1],
  );
  const weight = clamp(
    fontWeight,
    APCA_LUT_WEIGHTS[0],
    APCA_LUT_WEIGHTS[APCA_LUT_WEIGHTS.length - 1],
  );
  const min = interpolateAxis(APCA_LUT_SIZES, size, (row) =>
    interpolateAxis(APCA_LUT_WEIGHTS, weight, (col) => APCA_LUT[row][col]),
  );
  return min === 0 ? Infinity : min;
}

export function apcaLevel(
  lc: number,
  fontSizePx = 14,
  fontWeight = 400,
  minOverride?: number,
): ContrastLevel {
  const value = Math.abs(lc);
  const min = minOverride ?? apcaMinLc(fontSizePx, fontWeight);
  if (value < min) return "fail";
  if (value >= 90) return "preferred";
  if (value >= 75) return "body";
  if (value >= 60) return "large";
  if (value >= 45) return "headline";
  return "fail";
}

export function apcaContrast(text: string, background: string): number {
  const blkThrs = 0.022;
  const blkClmp = 1.414;
  const deltaYmin = 0.0005;
  const loClip = 0.1;

  let txtY = apcaY(text);
  let bgY = apcaY(background);
  if (txtY <= blkThrs) txtY += Math.pow(blkThrs - txtY, blkClmp);
  if (bgY <= blkThrs) bgY += Math.pow(blkThrs - bgY, blkClmp);
  if (Math.abs(bgY - txtY) < deltaYmin) return 0;

  let sapc: number;
  let output: number;
  if (bgY > txtY) {
    sapc = (Math.pow(bgY, 0.56) - Math.pow(txtY, 0.57)) * 1.14;
    output = sapc < loClip ? 0 : sapc - 0.027;
  } else {
    sapc = (Math.pow(bgY, 0.65) - Math.pow(txtY, 0.62)) * 1.14;
    output = sapc > -loClip ? 0 : sapc + 0.027;
  }
  return Math.round(output * 1000) / 10;
}
