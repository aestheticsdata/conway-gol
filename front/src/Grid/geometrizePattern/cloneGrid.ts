export function cloneGrid(grid: number[][]): number[][] {
  return grid.map((row) => [...row]);
}
