import { CELL_STATE } from "./constants"

type CellState = typeof CELL_STATE.DEAD | typeof CELL_STATE.ALIVE

class Cell {
  public state: CellState
  public static size: number = 10
  public color: string

  constructor(state?: CellState) {
    this.state = state ?? this._randomState()
  }

  private _randomState(): number {
    const rnd = Math.ceil(Math.random()*100)
    const isAlive = rnd >= 96
    isAlive ? this.color = 'rgb(8,112,168)' : this.color = 'rgb(255, 255, 255)'
    return (isAlive ? CELL_STATE.ALIVE : CELL_STATE.DEAD)
  }
}

export default Cell
