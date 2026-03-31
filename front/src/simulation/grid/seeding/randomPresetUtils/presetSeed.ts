import type { RandomPresetId } from "@grid/randomPresets";

export function presetSeed(preset: RandomPresetId): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < preset.length; i++) {
    h ^= preset.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}
