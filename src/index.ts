import Grid from "./Grid/Grid";

class Main {
  private readonly _canvas: HTMLCanvasElement
  private readonly _stage: CanvasRenderingContext2D
  private _requestAnimationID: number
  private _isPlaying: boolean = true
  private _grid: Grid
  private _iterationCounterValue: number = 0
  private _iterationCounter: HTMLElement = document.querySelector('.iteration-counter')
  private _pauseBtn: HTMLButtonElement = document.querySelector('button')
  private _fps = 7
  private _fpsInterval
  private _startTime
  private _now
  private _lastDrawTime
  private _elapsed;

  constructor() {
    this._canvas = document.querySelector('canvas')
    this._stage = this._canvas.getContext('2d')
    this._grid = new Grid(this._stage, this._canvas)
    this._pauseBtn.addEventListener('click', this._togglePause)
  }

  private _renderGeneration() {
    this._grid.processNextGeneration(this._stage)
  }

  private _togglePause = () => {
    console.log('toggle pause')
    this._isPlaying ? this._stop() : this._start();
    this._isPlaying = !this._isPlaying;
  }

  private _step = (_timestamp) => {
    this._now = Date.now();
    this._elapsed = this._now - this._lastDrawTime;
    if (this._elapsed > this._fpsInterval) {
      this._lastDrawTime = this._now - (this._elapsed % this._fpsInterval);
      this._iterationCounterValue++
      this._iterationCounter.textContent = String(this._iterationCounterValue)
      this._renderGeneration();
    }
    this._requestAnimationID = window.requestAnimationFrame(this._step);
  }

  private _start = () => {
    console.log('start')
    // https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
    this._fpsInterval = 1000 / this._fps;
    this._lastDrawTime = Date.now();
    this._startTime = this._lastDrawTime;
    this._requestAnimationID = window.requestAnimationFrame(this._step);
  }

  private _stop = () => {
    console.log('stop');
    cancelAnimationFrame(this._requestAnimationID);
  }

  init() {
    console.log('init')
    this._start()
  }
}

(new Main()).init()
