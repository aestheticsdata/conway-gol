import Cell from "../Cell/Cell";
import { CELL_STATE } from "../Cell/constants";
import type { CellGrid } from "../Grid/Grid";
import Grid from "../Grid/Grid";

type Entity = number[][]

class Data {
  public grid: CellGrid = []

  // for many entities, see this catalog:
  // http://www.ericweisstein.com/encyclopedias/life
  // http://pentadecathlon.com/lifeNews/oscillators/
  private _glider: Entity = [
    [0,1,1,1],
    [0,1,0,0],
    [0,0,1,0],
  ]
  private _pulsar: Entity = [
    [0,0,1,1,1,0,0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],
    [0,0,1,1,1,0,0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,0,0,0,1,1,1,0,0],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,0,0,0,1,1,1,0,0],
  ]
  private _pentadecathlon: Entity = [
    [0,1,0],
    [0,1,0],
    [1,0,1],
    [0,1,0],
    [0,1,0],
    [0,1,0],
    [0,1,0],
    [1,0,1],
    [0,1,0],
    [0,1,0],
  ]
  private _fumarol: Entity = [
    [0,0,0,1,1,0,0,0],
    [0,1,0,0,0,0,1,0],
    [0,1,0,0,0,0,1,0],
    [0,1,0,0,0,0,1,0],
    [0,0,1,0,0,1,0,0],
    [1,0,1,0,0,1,0,1],
    [1,1,0,0,0,0,1,1],
  ]

  private makeEntity(entity: string, startIndex: number[]) {
    for (let j=0; j<this['_'+entity].length; j++) {
      for (let i=0; i<this['_'+entity][0].length; i++) {
        if (this['_'+entity][j][i] === 1) {
          this.grid[j+startIndex[0]][i+startIndex[1]].state = CELL_STATE.ALIVE
        }
      }
    }
  }

  public factory(entity, startIndex: number[]) {
    for (let i=0; i<Grid.gridSize; i++) {
      this.grid.push([])
      for (let j=0; j<Grid.gridSize; j++) {
        this.grid[i].push(new Cell(CELL_STATE.DEAD))
      }
    }
    this.makeEntity(entity, startIndex)
  }
}

export default Data
