import Cell from "../Cell/Cell";
import { CELL_STATE } from "../Cell/constants";
import type { CellGrid } from "../Grid/Grid";
import Grid from "../Grid/Grid";

class Data {
  public grid: CellGrid = []

  public factory() {
    for (let i=0; i<Grid.gridSize; i++) {
      this.grid.push([])
      for (let j=0; j<Grid.gridSize; j++) {
        this.grid[i].push(new Cell(CELL_STATE.DEAD))
      }
    }
    this.grid[1][1].state = CELL_STATE.ALIVE
    this.grid[1][2].state = CELL_STATE.ALIVE
    this.grid[1][3].state = CELL_STATE.ALIVE
    this.grid[2][1].state = CELL_STATE.ALIVE
    this.grid[3][2].state = CELL_STATE.ALIVE
  }
}

export default Data
