import { CELL_STATE } from "@cell/constants";

import type { RandomPresetSeedContext } from "@grid/seeding/randomPresetTypes";

// ---------------------------------------------------------------------------
// Conway motifs preset
//
// Density controls CELL COUNT per constellation, not shape count:
//   - Low density  → 1 small motif (3 cells: blinker / L-corner)
//   - Mid density  → a cluster of still lifes or oscillators
//   - High density → a large multi-ring constellation (up to ~80 cells)
//
// Always 1–2 constellations on the grid (never a full scattered grid).
// Symmetry is optional (≈50% chance) — h or v mirror, never forced 4-fold.
// The spatial noise mask is NOT applied for this preset.
// ---------------------------------------------------------------------------

type ConwayCells = readonly (readonly [number, number])[];

interface ConwayMotif {
  readonly cells: ConwayCells;
  readonly complexity: number; // 1=minimal … 4=complex
}

const CONWAY_MOTIFS: readonly ConwayMotif[] = [
  // --- complexity 1: 3-cell patterns ---
  {
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    complexity: 1,
  }, // blinker (h)
  {
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    complexity: 1,
  }, // blinker (v)
  {
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    complexity: 1,
  }, // L-corner
  {
    cells: [
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    complexity: 1,
  }, // L-corner (flipped)
  {
    cells: [
      [0, 0],
      [1, 1],
      [2, 0],
    ],
    complexity: 1,
  }, // zigzag

  // --- complexity 2: 4–7 cell still lifes ---
  {
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    complexity: 2,
  }, // block
  {
    cells: [
      [0, 1],
      [1, 0],
      [1, 2],
      [2, 1],
    ],
    complexity: 2,
  }, // tub
  {
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 2],
      [2, 1],
    ],
    complexity: 2,
  }, // boat
  {
    cells: [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 3],
      [2, 1],
      [2, 2],
    ],
    complexity: 2,
  }, // beehive
  {
    cells: [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 3],
      [2, 1],
      [2, 3],
      [3, 2],
    ],
    complexity: 2,
  }, // loaf

  // --- complexity 3: oscillators and glider ---
  {
    cells: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2],
    ],
    complexity: 3,
  }, // glider
  {
    cells: [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    complexity: 3,
  }, // R-pentomino
  {
    cells: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    complexity: 3,
  }, // toad
  {
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [2, 3],
      [3, 2],
      [3, 3],
    ],
    complexity: 3,
  }, // beacon

  // --- complexity 4: spaceships and methuselahs ---
  // LWSS (lightweight spaceship)
  {
    cells: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 0],
      [1, 4],
      [2, 4],
      [3, 0],
      [3, 3],
    ],
    complexity: 4,
  },
  // acorn (methuselah)
  {
    cells: [
      [0, 1],
      [1, 3],
      [2, 0],
      [2, 1],
      [2, 4],
      [2, 5],
      [2, 6],
    ],
    complexity: 4,
  },
  // B-heptomino
  {
    cells: [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [2, 1],
      [3, 1],
      [3, 2],
    ],
    complexity: 4,
  },
  // pi-heptomino (symmetric)
  {
    cells: [
      [0, 0],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 0],
      [2, 2],
    ],
    complexity: 4,
  },
];

function stampConwayMotif(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  cr: number,
  cc: number,
  cells: ConwayCells,
  quarterTurns: number,
  flipH: boolean,
): void {
  let minR = Infinity,
    maxR = -Infinity,
    minC = Infinity,
    maxC = -Infinity;
  for (const [r, c] of cells) {
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (c < minC) minC = c;
    if (c > maxC) maxC = c;
  }
  const centerOffsetR = (minR + maxR) / 2;
  const centerOffsetC = (minC + maxC) / 2;
  const rot = ((quarterTurns % 4) + 4) % 4;

  for (const [baseR, baseC] of cells) {
    let dr = baseR - centerOffsetR;
    let dc = baseC - centerOffsetC;

    // 90° clockwise per turn: (dr, dc) → (dc, -dr)
    for (let t = 0; t < rot; t++) {
      const tmp = dr;
      dr = dc;
      dc = -tmp;
    }

    if (flipH) dc = -dc;

    const finalR = Math.round(cr + dr);
    const finalC = Math.round(cc + dc);
    if (finalR >= 0 && finalR < rows && finalC >= 0 && finalC < cols) {
      buffer[finalR * cols + finalC] = CELL_STATE.ALIVE;
    }
  }
}

/**
 * Returns relative [dr, dc] offsets for N motifs arranged in concentric rings.
 * Ring unit scales with grid size so spacing feels consistent.
 */
function getConstellationPositions(count: number, rng: () => number, ringUnit: number): [number, number][] {
  const positions: [number, number][] = [[0, 0]];
  if (count <= 1) return positions;

  let remaining = count - 1;
  const rings = [
    { radius: ringUnit, max: 4 },
    { radius: ringUnit * 2, max: 6 },
    { radius: ringUnit * 3, max: 8 },
  ];

  for (const ring of rings) {
    if (remaining <= 0) break;
    const n = Math.min(remaining, ring.max);
    const angleOffset = rng() * Math.PI * 2; // randomise start angle
    for (let i = 0; i < n; i++) {
      const angle = angleOffset + (i / n) * Math.PI * 2;
      positions.push([Math.round(Math.sin(angle) * ring.radius), Math.round(Math.cos(angle) * ring.radius)]);
    }
    remaining -= n;
  }

  return positions;
}

// Shared helper: stamp one motif at (cr+dr, cc+dc) plus its optional mirror.
function placeWithMirror(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  cr: number,
  cc: number,
  dr: number,
  dc: number,
  motif: ConwayMotif,
  rot: number,
  flip: boolean,
  symmetry: "none" | "h" | "v",
  breakSym: boolean,
): void {
  stampConwayMotif(buffer, rows, cols, cr + dr, cc + dc, motif.cells, rot, flip);

  if (!breakSym && symmetry !== "none") {
    if (symmetry === "h") {
      stampConwayMotif(buffer, rows, cols, cr + dr, cols - 1 - (cc + dc), motif.cells, rot, !flip);
    } else {
      stampConwayMotif(buffer, rows, cols, rows - 1 - (cr + dr), cc + dc, motif.cells, (rot + 2) % 4, flip);
    }
  }
}

export function seedConway(buffer: Uint8Array, rows: number, cols: number, context: RandomPresetSeedContext): void {
  buffer.fill(CELL_STATE.DEAD);
  const { rng, density, randomizedLayout } = context;

  // The slider uses a quadratic mapping (density = slider²), which compresses low values.
  // Taking √density gives a linear proxy of the raw slider position so that the visual
  // change is evenly spread across the full 0–100% range.
  const t = Math.sqrt(density); // 0.3 at slider=30%, 0.5 at slider=50%, 1.0 at slider=100%

  // t → motif count (the main visual lever, shared by both modes)
  // slider≈1% → 1 motif ; slider=30% → 5 ; slider=100% → 15
  const totalMotifs = Math.max(1, Math.round(t * 15));

  // t → motif complexity
  const maxComplexity = t < 0.25 ? 1 : t < 0.5 ? 2 : t < 0.75 ? 3 : 4;
  const pool = CONWAY_MOTIFS.filter((m) => m.complexity <= maxComplexity);

  // Symmetry (h or v reflection, ~50% chance of none)
  type Symmetry = "none" | "h" | "v";
  const symmetry: Symmetry = !randomizedLayout ? "none" : rng() < 0.5 ? "none" : rng() < 0.5 ? "h" : "v";

  // ── Mode selection ────────────────────────────────────────────────────────
  //
  //  "grow"    — one tight cluster whose physical size grows with density.
  //              Motifs are stamped on top of each other within a small radius
  //              so the result reads as ONE form that becomes more complex.
  //
  //  "scatter" — 1–3 ring-spaced constellations; count grows with density
  //              (more separate small shapes, classic constellation layout).
  //
  const mode: "grow" | "scatter" = !randomizedLayout || rng() < 0.5 ? "grow" : "scatter";

  if (mode === "grow") {
    // Single cluster centre, placed somewhere in the middle 50% of the grid
    const cr = Math.round(rows * (0.25 + rng() * 0.5));
    const cc = Math.round(cols * (0.25 + rng() * 0.5));

    // Pack radius grows with t: tight blob at low density, spread organism at high density.
    // rng()*rng() biases positions toward centre so the shape stays dense in the middle.
    const packRadius = Math.max(3, Math.round(t * 15));

    for (let mi = 0; mi < totalMotifs; mi++) {
      const angle = rng() * Math.PI * 2;
      const r = rng() * rng() * packRadius;
      const dr = Math.round(Math.sin(angle) * r);
      const dc = Math.round(Math.cos(angle) * r);
      const motif = pool[Math.floor(rng() * pool.length)];
      const rot = Math.floor(rng() * 4);
      const flip = rng() < 0.5;
      placeWithMirror(buffer, rows, cols, cr, cc, dr, dc, motif, rot, flip, symmetry, randomizedLayout && rng() < 0.12);
    }
  } else {
    // Scatter: number of constellations grows with density (1 → 3)
    const numConst = Math.max(1, Math.min(3, Math.round(1 + t * 2)));
    const perConst = Math.max(1, Math.round(totalMotifs / numConst));
    const ringUnit = Math.max(5, Math.round(Math.min(rows, cols) / 10));

    for (let ci = 0; ci < numConst; ci++) {
      const cr = Math.round(rows * (0.2 + rng() * 0.6));
      const cc = Math.round(cols * (0.2 + rng() * 0.6));
      const positions = getConstellationPositions(perConst, rng, ringUnit);

      for (const [dr, dc] of positions) {
        const motif = pool[Math.floor(rng() * pool.length)];
        const rot = Math.floor(rng() * 4);
        const flip = rng() < 0.5;
        placeWithMirror(
          buffer,
          rows,
          cols,
          cr,
          cc,
          dr,
          dc,
          motif,
          rot,
          flip,
          symmetry,
          randomizedLayout && rng() < 0.12,
        );
      }
    }
  }
}
