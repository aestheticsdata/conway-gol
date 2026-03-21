/**
 * Random-mode presets, used as the single source of truth for ids and labels.
 */
export const RANDOM_PRESETS = [
  { id: "stars", label: "Stars" },
  { id: "circles", label: "Random circles" },
  { id: "sinus", label: "Sine waves" },
  { id: "rings", label: "Rings" },
  { id: "stripes", label: "Stripes" },
  { id: "checker", label: "Checkerboard" },
  { id: "clusters", label: "Clusters" },
  { id: "diagonal", label: "Diagonals" },
  { id: "cross", label: "Cross" },
  { id: "noise", label: "Classic noise" },
] as const;

export type RandomPresetId = (typeof RANDOM_PRESETS)[number]["id"];

export const RANDOM_PRESET_IDS: readonly RandomPresetId[] = RANDOM_PRESETS.map(
  (preset) => preset.id,
);

export const DEFAULT_RANDOM_PRESET: RandomPresetId = RANDOM_PRESETS[0].id;

export function isRandomPresetId(value: string): value is RandomPresetId {
  return RANDOM_PRESET_IDS.includes(value as RandomPresetId);
}
