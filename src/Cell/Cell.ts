import { CELL_STATE } from "./constants"

type CellState = typeof CELL_STATE.DEAD | typeof CELL_STATE.ALIVE

class Cell {
  public state: CellState
  public static size: number = 10

  constructor(state?: CellState) {
    this.state = state ?? this._randomState()
  }

  private _randomState(): number {
    const rnd = Math.ceil(Math.random()*100);
    return (rnd < 50 ? CELL_STATE.ALIVE : CELL_STATE.DEAD)
  }
}

export default Cell
