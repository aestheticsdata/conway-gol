import Cell from "../Cell/Cell";
import { CELL_STATE } from "../Cell/constants";
import type { CellGrid } from "../Grid/Grid";

class Data {
  public grid: CellGrid = []

  public factory() {
    for (let i=0; i<30; i++) {
      this.grid.push([])
      for (let j=0; j<30; j++) {
        this.grid[i].push(new Cell(CELL_STATE.DEAD))
      }
    }
    this.grid[2][3].state = CELL_STATE.ALIVE
    this.grid[2][4].state = CELL_STATE.ALIVE
    this.grid[2][5].state = CELL_STATE.ALIVE
  }
}

export default Data
