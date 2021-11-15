import { CELL_STATE } from "./constants"

type CellState = typeof CELL_STATE.DEAD | typeof CELL_STATE.ALIVE

class Cell {
  public static size: number = 5
  private _state: CellState
  public color: string

  constructor(state?: CellState) {
    this._state = state ?? this._randomState()
    if (state !== undefined) {
      this.color = this._getColor(state);
    }
  }

  private _getColor(state: CellState) {
    return (state === CELL_STATE.ALIVE ? 'rgb(8,112,168)' : 'rgb(255, 255, 255)')
  }

  private _randomState(): number {
    const rnd = Math.ceil(Math.random()*100)
    const isAlive = rnd >= 82
    this.color = (isAlive ? this._getColor(CELL_STATE.ALIVE) : this._getColor(CELL_STATE.DEAD))
    return (isAlive ? CELL_STATE.ALIVE : CELL_STATE.DEAD)
  }

  public get state() {
    return this._state
  }

  public set state(cs: CellState) {
    this._state = cs
    this.color = (this.state === CELL_STATE.ALIVE ? this._getColor(CELL_STATE.ALIVE) : this._getColor(CELL_STATE.DEAD))
  }
}

export default Cell
