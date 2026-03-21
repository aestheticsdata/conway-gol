import { CELL_STATE } from "@cell/constants";
import type { RandomPresetId } from "@grid/randomPresets";

export type NoiseType = "uniform" | "perlin-like" | "clusters";

export interface RandomSeedParams {
  density: number;       // 0–1: shape count / frequency for patterns; alive probability for "noise"
  noiseType: NoiseType;  // direct algorithm for "noise"; spatial mask for other presets
  seed: number | null;   // null = auto (preset hash or Math.random())
}

export const DEFAULT_RANDOM_PARAMS: RandomSeedParams = {
  density: 0.09, // matches the UI default: 30% slider → 9% effective density
  noiseType: "uniform",
  seed: null,
};

/** Writes random-mode initial states into a flat cell buffer (ALIVE/DEAD). */
export interface IRandomPresetSeeder {
  seedInto(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    preset: RandomPresetId,
    randomVariation: boolean,
    params?: RandomSeedParams,
  ): void;
}

function presetSeed(preset: RandomPresetId): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < preset.length; i++) {
    h ^= preset.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_MOTIFS = [
  [[0,0],[-1,0],[1,0],[0,-1],[0,1]],
  [[0,0],[-1,-1],[-1,1],[1,-1],[1,1]],
  [[0,0],[-1,0],[-2,0],[1,0],[2,0],[0,-1],[0,-2],[0,1],[0,2]],
  [[0,0],[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]],
  [[0,0],[0,-2],[-1,-1],[-2,0],[-1,1],[0,2],[1,1],[2,0],[1,-1]],
  [[0,0],[-2,0],[-1,-1],[-1,1],[1,-1],[1,1],[2,0]],
  [[0,0],[-1,-1],[-2,-2],[1,1],[2,2],[-1,1],[-2,2],[1,-1],[2,-2]],
] as const;

function stampStarMotif(
  buf: Uint8Array,
  rows: number,
  cols: number,
  centerR: number,
  centerC: number,
  motif: readonly (readonly [number, number])[],
  quarterTurns: number,
): void {
  const q = ((quarterTurns % 4) + 4) % 4;
  for (const [dr0, dc0] of motif) {
    let dr = dr0;
    let dc = dc0;
    for (let t = 0; t < q; t++) {
      const ndr = -dc;
      const ndc = dr;
      dr = ndr;
      dc = ndc;
    }
    const r = centerR + dr;
    const c = centerC + dc;
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      buf[r * cols + c] = CELL_STATE.ALIVE;
    }
  }
}

/**
 * Fills a buffer with named random-mode presets.
 *
 * density controls the NUMBER / FREQUENCY of shapes for pattern presets:
 *   - stars/clusters/sinus: number of objects scales with density
 *   - rings/stripes/diagonal: frequency (inverse of period) scales with density
 *   - circles: number of circles scales with density
 *   - checker: square size is inversely proportional to density (more density → more squares)
 *   - cross: arm thickness scales with density
 *   - noise: density = alive-cell probability; noiseType = generation algorithm
 *
 * seed overrides the RNG for any preset (deterministic replay when non-null).
 */
export class RandomPresetSeeder implements IRandomPresetSeeder {
  public seedInto(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    preset: RandomPresetId,
    randomVariation: boolean,
    params: RandomSeedParams = DEFAULT_RANDOM_PARAMS,
  ): void {
    const rng =
      params.seed !== null
        ? mulberry32(params.seed >>> 0)
        : randomVariation
          ? () => Math.random()
          : mulberry32(presetSeed(preset));

    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    const d = params.density;
    // When a seed is explicitly provided, treat it as random variation so that
    // changing the seed visually changes the layout (not just a formula offset).
    const effectiveRandom = randomVariation || params.seed !== null;

    switch (preset) {
      case "noise":
        this._seedNoise(buffer, rows, cols, rng, d, params.noiseType);
        break;
      case "stars":
        this._seedStars(buffer, rows, cols, rng, effectiveRandom, d);
        break;
      case "circles":
        this._seedCircles(buffer, rows, cols, rng, effectiveRandom, d);
        break;
      case "sinus":
        this._seedSinus(buffer, rows, cols, rng, effectiveRandom, d);
        break;
      case "rings":
        this._seedRings(buffer, rows, cols, cx, cy, rng, effectiveRandom, d);
        break;
      case "stripes":
        this._seedStripes(buffer, rows, cols, rng, effectiveRandom, d);
        break;
      case "checker":
        this._seedChecker(buffer, rows, cols, rng, effectiveRandom, d);
        break;
      case "clusters":
        this._seedClusters(buffer, rows, cols, rng, effectiveRandom, d);
        break;
      case "diagonal":
        this._seedDiagonal(buffer, rows, cols, rng, effectiveRandom, d);
        break;
      case "cross":
        this._seedCross(buffer, rows, cols, cx, cy, rng, effectiveRandom, d);
        break;
    }

    // Apply spatial noise post-processing for non-uniform noise types on non-noise presets.
    // Uses a large-scale smooth mask so whole regions gain/lose the pattern rather than
    // individual cells, preserving shape integrity.
    if (params.noiseType !== "uniform" && preset !== "noise") {
      const spatialMask = new Float32Array(rows * cols);
      if (params.noiseType === "perlin-like") {
        this._fillValueNoise(spatialMask, rows, cols, rng, 30);
        // keep ALIVE cells in the "bright" half of the noise field
        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === CELL_STATE.ALIVE && spatialMask[i] < 0.5) {
            buffer[i] = CELL_STATE.DEAD;
          }
        }
      } else {
        // clusters: mask value is LOW near cluster centres, HIGH elsewhere
        this._fillClusterNoise(spatialMask, rows, cols, rng);
        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === CELL_STATE.ALIVE && spatialMask[i] > 0.5) {
            buffer[i] = CELL_STATE.DEAD;
          }
        }
      }
    }
  }

  // ── Noise mask helpers (used by the "noise" preset only) ───────────────────

  private _fillNoiseMask(
    mask: Float32Array,
    rows: number,
    cols: number,
    rng: () => number,
    noiseType: NoiseType,
  ): void {
    if (noiseType === "uniform") {
      for (let i = 0; i < mask.length; i++) mask[i] = rng();
    } else if (noiseType === "perlin-like") {
      this._fillValueNoise(mask, rows, cols, rng);
    } else {
      this._fillClusterNoise(mask, rows, cols, rng);
    }
  }

  private _fillValueNoise(
    mask: Float32Array,
    rows: number,
    cols: number,
    rng: () => number,
    scale = 10,
  ): void {
    const gRows = Math.ceil(rows / scale) + 2;
    const gCols = Math.ceil(cols / scale) + 2;
    const grid = new Float32Array(gRows * gCols);
    for (let i = 0; i < grid.length; i++) grid[i] = rng();

    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gx = col / scale;
        const gy = row / scale;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const fx = gx - x0;
        const fy = gy - y0;
        const ux = fx * fx * (3 - 2 * fx);
        const uy = fy * fy * (3 - 2 * fy);
        const x1 = Math.min(x0 + 1, gCols - 1);
        const y1 = Math.min(y0 + 1, gRows - 1);
        const v00 = grid[y0 * gCols + x0];
        const v10 = grid[y0 * gCols + x1];
        const v01 = grid[y1 * gCols + x0];
        const v11 = grid[y1 * gCols + x1];
        mask[idx++] =
          v00 * (1 - ux) * (1 - uy) +
          v10 * ux * (1 - uy) +
          v01 * (1 - ux) * uy +
          v11 * ux * uy;
      }
    }
  }

  private _fillClusterNoise(
    mask: Float32Array,
    rows: number,
    cols: number,
    rng: () => number,
  ): void {
    const numClusters = 6 + Math.floor(rng() * 10);
    const baseRad = Math.min(rows, cols) * 0.12;
    const centers: { r: number; c: number; r2: number }[] = [];
    for (let k = 0; k < numClusters; k++) {
      const rad = baseRad * (0.5 + rng());
      centers.push({ r: rng() * rows, c: rng() * cols, r2: rad * rad });
    }
    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let minMask = 1.0;
        for (const { r, c, r2 } of centers) {
          const d2 = (row - r) ** 2 + (col - c) ** 2;
          if (d2 < r2) minMask = Math.min(minMask, d2 / r2);
        }
        mask[idx++] = minMask;
      }
    }
  }

  // ── "noise" preset ─────────────────────────────────────────────────────────

  private _seedNoise(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    rng: () => number,
    density: number,
    noiseType: NoiseType,
  ): void {
    if (density <= 0) { buffer.fill(CELL_STATE.DEAD); return; }
    if (density >= 1) { buffer.fill(CELL_STATE.ALIVE); return; }
    const mask = new Float32Array(buffer.length);
    this._fillNoiseMask(mask, rows, cols, rng, noiseType);
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = mask[i] < density ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    }
  }

  // ── Pattern presets — density=0 → empty, density=1 → nearly full ──────────

  /**
   * density → fill fraction via star count.
   * Rejection sampling removed — stars overlap at high density to fill the canvas.
   * baseCount sized so density=1 gives ~1.75× grid-area coverage → nearly full.
   */
  private _seedStars(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    rng: () => number,
    _randomVariation: boolean,
    density: number,
  ): void {
    buffer.fill(CELL_STATE.DEAD);
    const baseCount = Math.round(rows * cols / 4); // ~6084 for 156×156
    const numStars = Math.round(baseCount * density);
    for (let k = 0; k < numStars; k++) {
      const r = Math.floor(rng() * rows);
      const c = Math.floor(rng() * cols);
      const m = Math.floor(rng() * STAR_MOTIFS.length);
      const rot = Math.floor(rng() * 4);
      stampStarMotif(buffer, rows, cols, r, c, STAR_MOTIFS[m], rot);
    }
  }

  /**
   * density → number of circles (0% = none, 100% ≈ canvas nearly full).
   * Each circle is randomly placed with a random radius and is either filled
   * (solid disc) or hollow (ring), chosen at random.
   */
  private _seedCircles(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    rng: () => number,
    _randomVariation: boolean,
    density: number,
  ): void {
    buffer.fill(CELL_STATE.DEAD);
    // base count sized so density=1 gives ~1.5× grid-area coverage → nearly full canvas
    const baseCount = Math.round(rows * cols / 250);
    const numCircles = Math.max(0, Math.round(baseCount * density));
    if (numCircles === 0) return;

    const maxRadius = Math.min(rows, cols) * 0.13; // up to ~13% of grid side

    for (let k = 0; k < numCircles; k++) {
      const cr = rng() * rows;
      const cc = rng() * cols;
      const r = 3 + rng() * maxRadius;
      const filled = rng() < 0.5;

      const r0 = Math.max(0, Math.floor(cr - r - 2));
      const r1 = Math.min(rows - 1, Math.ceil(cr + r + 2));
      const c0 = Math.max(0, Math.floor(cc - r - 2));
      const c1 = Math.min(cols - 1, Math.ceil(cc + r + 2));

      for (let row = r0; row <= r1; row++) {
        for (let col = c0; col <= c1; col++) {
          const dist = Math.sqrt((col - cc) ** 2 + (row - cr) ** 2);
          if (filled ? dist <= r : Math.abs(dist - r) <= 1.5) {
            buffer[row * cols + col] = CELL_STATE.ALIVE;
          }
        }
      }
    }
  }

  /**
   * density → number of sine waves.
   * baseWaves=40 so at density=1 waves are tightly packed and nearly fill the canvas.
   * Layout uses numWaves for spacing (fixes the old hardcoded-5 bug).
   */
  private _seedSinus(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    rng: () => number,
    randomVariation: boolean,
    density: number,
  ): void {
    const margin = rows * 0.06;
    const usableH = rows - 2 * margin;
    const baseWaves = randomVariation ? 15 + Math.floor(rng() * 25) : 40;
    const numWaves = Math.max(0, Math.round(baseWaves * density));
    const k = randomVariation
      ? 0.05 + rng() * 0.28
      : (3 * 2 * Math.PI) / Math.max(cols, 1);
    const amp = randomVariation ? 5 + rng() * 20 : 12;
    const band = randomVariation ? 1 + Math.floor(rng() * 2) : 2;
    const y0: number[] = [];
    const phases: number[] = [];
    for (let w = 0; w < numWaves; w++) {
      if (randomVariation) {
        y0.push(margin + rng() * usableH);
        phases.push(rng() * Math.PI * 2);
      } else {
        // evenly distribute waves across usable height based on actual numWaves
        y0.push(margin + (usableH * (w + 1)) / (numWaves + 1));
        phases.push((w * 2 * Math.PI) / Math.max(1, numWaves));
      }
    }
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let alive = false;
        for (let w = 0; w < numWaves; w++) {
          const curve = y0[w] + amp * Math.sin(k * col + phases[w]);
          if (Math.abs(row - curve) <= band) { alive = true; break; }
        }
        buffer[i++] = alive ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
  }

  /**
   * density → fill fraction: phase < density → ALIVE.
   * At density=1 every cell is alive (solid). At density=0.5, classic 50/50 rings.
   * Spacing also shrinks with density so more rings appear at higher density.
   */
  private _seedRings(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    cx: number,
    cy: number,
    rng: () => number,
    randomVariation: boolean,
    density: number,
  ): void {
    const baseSpacing = randomVariation ? 3 + rng() * 3 : 4;
    const spacing = baseSpacing / Math.max(0.01, density);
    const phaseShift = randomVariation ? rng() * spacing : 0;
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dx = col - cx;
        const dy = row - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        const phase = ((r + phaseShift) / spacing) % 1.0;
        buffer[i++] = phase < density ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
  }

  /**
   * density → fill fraction: thick/period = density.
   * At density=1 the canvas is solid; at density=0 it is empty.
   * base is the fixed stripe thickness; period = base/density.
   */
  private _seedStripes(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    rng: () => number,
    randomVariation: boolean,
    density: number,
  ): void {
    const base = randomVariation ? 3 + Math.floor(rng() * 3) : 4;
    const period = Math.max(base, Math.round(base / Math.max(0.01, density)));
    const vertical = randomVariation ? rng() < 0.5 : false;
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const t = vertical ? col : row;
        buffer[i++] = t % period < base ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
  }

  /**
   * density → fill fraction via deterministic Wang-hash per checker block.
   * Even blocks: hash value in [0, 0.5). Odd blocks: hash value in [0.5, 1).
   * alive = blockValue < density → at density=0: empty; density=0.5: classic checker;
   * density=1: solid. Scale shrinks with density so the checker gets finer.
   */
  private _seedChecker(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    rng: () => number,
    randomVariation: boolean,
    density: number,
  ): void {
    if (density <= 0) { buffer.fill(CELL_STATE.DEAD); return; }
    if (density >= 1) { buffer.fill(CELL_STATE.ALIVE); return; }
    const maxScale = randomVariation ? 4 + Math.floor(rng() * 6) : 6;
    const scale = Math.max(1, Math.round(maxScale * (1 - density) + 1));
    const shift = randomVariation ? Math.floor(rng() * 2) : 0;
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const a = Math.floor(row / scale);
        const b = Math.floor(col / scale);
        const isEven = (a + b + shift) % 2 === 0;
        // deterministic hash per block → value in [0, 0.5) for even, [0.5, 1) for odd
        let h = (a * 1597 + b * 31337) >>> 0;
        h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
        h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
        h = (h ^ (h >>> 16)) >>> 0;
        const blockVal = (h / 4294967296) * 0.5; // [0, 0.5)
        const cellVal = isEven ? blockVal : blockVal + 0.5;
        buffer[i++] = cellVal < density ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
  }

  /**
   * density → number and size of clusters, giving fill ≈ density at density=1.
   * Stable: grid of clusters with radius sized to cover the canvas at full density.
   * Random: high count of overlapping blobs.
   */
  private _seedClusters(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    rng: () => number,
    randomVariation: boolean,
    density: number,
  ): void {
    if (!randomVariation) {
      const steps = Math.max(1, Math.round(14 * density)); // up to 196 clusters
      const rad = Math.max(rows, cols) / (steps * 0.9); // radius fills the grid
      const centers: { r: number; c: number; rad: number }[] = [];
      for (let gi = 0; gi < steps; gi++) {
        for (let gj = 0; gj < steps; gj++) {
          centers.push({
            r: ((gi + 0.5) * rows) / steps,
            c: ((gj + 0.5) * cols) / steps,
            rad,
          });
        }
      }
      let i = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          let falloff = 0;
          for (const { r, c, rad: R } of centers) {
            const d = (row - r) ** 2 + (col - c) ** 2;
            const r2 = R * R;
            if (d < r2) falloff = Math.max(falloff, 1 - d / r2);
          }
          buffer[i++] = falloff > 0.2 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
        }
      }
      return;
    }
    const baseNum = 40 + Math.floor(rng() * 30); // 40–70 clusters
    const num = Math.round(baseNum * density);
    const centers: { r: number; c: number; rad: number }[] = [];
    for (let k = 0; k < num; k++) {
      centers.push({ r: rng() * rows, c: rng() * cols, rad: 6 + rng() * 14 });
    }
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let falloff = 0;
        for (const { r, c, rad: R } of centers) {
          const d = (row - r) ** 2 + (col - c) ** 2;
          const r2 = R * R;
          if (d < r2) falloff = Math.max(falloff, 1 - d / r2);
        }
        buffer[i++] =
          falloff > 0 && rng() < 0.22 + 0.72 * falloff
            ? CELL_STATE.ALIVE
            : CELL_STATE.DEAD;
      }
    }
  }

  /**
   * density → fill fraction: band/period = density.
   * At density=1 the canvas is solid; at density=0 it is empty.
   */
  private _seedDiagonal(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    rng: () => number,
    randomVariation: boolean,
    density: number,
  ): void {
    const base = randomVariation ? 2 + Math.floor(rng() * 3) : 4;
    const period = Math.max(base, Math.round(base / Math.max(0.01, density)));
    const band = base;
    const offset = randomVariation ? Math.floor(rng() * period) : 0;
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const t = (row + col + offset) % period;
        buffer[i++] = t < band ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
  }

  /**
   * density → arm thickness (0% = invisible, 100% = original thickness)
   */
  private _seedCross(
    buffer: Uint8Array,
    rows: number,
    cols: number,
    cx: number,
    cy: number,
    rng: () => number,
    randomVariation: boolean,
    density: number,
  ): void {
    // thick scales from 0 to half the grid side → at density=1 the arms fill the canvas
    const halfSide = Math.min(rows, cols) / 2;
    const jitter = randomVariation ? 0.6 + rng() * 0.8 : 1;
    const thick = Math.max(0, Math.round(halfSide * density * jitter));
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const onH = Math.abs(row - cy) < thick;
        const onV = Math.abs(col - cx) < thick;
        const onCross = onH || onV;
        const hole = randomVariation && onCross && rng() < 0.08;
        buffer[i++] = onCross && !hole ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
  }
}
