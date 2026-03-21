import { GRID_TEXTS } from "./texts";

/**
 * Random-mode presets, used as the single source of truth for ids and labels.
 */
export const RANDOM_PRESETS = [
  { id: "stars", label: GRID_TEXTS.randomPresets.stars },
  { id: "circles", label: GRID_TEXTS.randomPresets.circles },
  { id: "sinus", label: GRID_TEXTS.randomPresets.sinus },
  { id: "rings", label: GRID_TEXTS.randomPresets.rings },
  { id: "stripes", label: GRID_TEXTS.randomPresets.stripes },
  { id: "checker", label: GRID_TEXTS.randomPresets.checker },
  { id: "clusters", label: GRID_TEXTS.randomPresets.clusters },
  { id: "diagonal", label: GRID_TEXTS.randomPresets.diagonal },
  { id: "cross", label: GRID_TEXTS.randomPresets.cross },
  { id: "noise", label: GRID_TEXTS.randomPresets.noise },
] as const;

export type RandomPresetId = (typeof RANDOM_PRESETS)[number]["id"];

export const RANDOM_PRESET_IDS: readonly RandomPresetId[] = RANDOM_PRESETS.map(
  (preset) => preset.id,
);

export const DEFAULT_RANDOM_PRESET: RandomPresetId = RANDOM_PRESETS[0].id;

export function isRandomPresetId(value: string): value is RandomPresetId {
  return RANDOM_PRESET_IDS.includes(value as RandomPresetId);
}
