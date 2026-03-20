/**
 * Cell state integer constants.
 *
 * DEAD and ALIVE drive the simulation (Simulation.ts).
 * BORDER and OUTSIDE are renderer-only states used exclusively by ZoomBox
 * to represent cells outside the main grid boundary.
 *
 * Colors have been moved to CELL_COLORS in Grid/constants.ts so that the
 * renderer is the single source of truth for visual representation.
 */
export const CELL_STATE = {
  DEAD: 0,
  ALIVE: 1,
  BORDER: 2,
  OUTSIDE: 3,
} as const;

export type CellState = typeof CELL_STATE[keyof typeof CELL_STATE];
