import type { CellPatternEasingId } from "@lib/canvas/cellPatternCrossfade/types";

/**
 * Maps linear time `t ∈ [0, 1]` to eased progress for {@link runCellPatternCrossfade}.
 */
export function applyCellPatternEasing(t: number, id: CellPatternEasingId): number {
  const x = Math.max(0, Math.min(1, t));
  switch (id) {
    case "linear":
      return x;
    case "easeInCubic":
      return x * x * x;
    case "easeOutCubic":
      return 1 - (1 - x) ** 3;
    case "easeInOutCubic":
      return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
    case "easeInOutQuart":
      return x < 0.5 ? 8 * x * x * x * x : 1 - (-2 * x + 2) ** 4 / 2;
    case "easeInOutQuint":
      return x < 0.5 ? 16 * x * x * x * x * x : 1 - (-2 * x + 2) ** 5 / 2;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
