import chroma from "chroma-js";
import type { PantoneColor } from "./pantone-colors";
import { pantoneColors } from "./pantone-colors";

export interface PantoneSuggestion extends PantoneColor {
  /** CIEDE2000 perceptual distance to the source color (0 = identical). */
  distance: number;
}

type Chroma = ReturnType<typeof chroma>;

interface Entry extends PantoneColor {
  color: Chroma;
}

// Parse each catalogue color once so repeated slider updates stay cheap.
const entries: Entry[] = pantoneColors.map((pantone) => ({
  ...pantone,
  color: chroma(pantone.hex),
}));

export function nearestPantones(hex: string, count = 5): PantoneSuggestion[] {
  const source = chroma(hex);
  return entries
    .map((entry) => ({
      name: entry.name,
      hex: entry.hex,
      tcx: entry.tcx,
      distance: chroma.deltaE(source, entry.color),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}
