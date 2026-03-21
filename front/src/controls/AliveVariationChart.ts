import { getRequiredContext2D } from "@helpers/dom";
import { ALIVE_VARIATION_CHART_COLORS } from "@controls/constants";

class AliveVariationChart {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _ctx: CanvasRenderingContext2D;
  private _history: number[] = [];
  private _lastAliveCount: number | null = null;
  private _width = 1;
  private _height = 1;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._ctx = getRequiredContext2D(canvas);
    window.addEventListener("resize", this._resize);
    this._resize();
  }

  public reset(): void {
    this._history = [];
    this._lastAliveCount = null;
    this._draw();
  }

  public push(aliveCount: number): void {
    if (this._lastAliveCount === null) {
      this._lastAliveCount = aliveCount;
      this._history = [0];
      this._trimHistory();
      this._draw();
      return;
    }

    this._history.push(aliveCount - this._lastAliveCount);
    this._lastAliveCount = aliveCount;
    this._trimHistory();
    this._draw();
  }

  private _resize = (): void => {
    const rect = this._canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;

    this._width = width;
    this._height = height;
    this._canvas.width = Math.max(1, Math.floor(width * dpr));
    this._canvas.height = Math.max(1, Math.floor(height * dpr));
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this._trimHistory();
    this._draw();
  };

  private _trimHistory(): void {
    const maxPoints = Math.max(2, Math.floor(this._width - 10));
    if (this._history.length > maxPoints) {
      this._history = this._history.slice(-maxPoints);
    }
  }

  private _draw(): void {
    const width = this._width;
    const height = this._height;
    const plotLeft = 6;
    const plotRight = width - 4;
    const plotTop = 5;
    const plotBottom = height - 6;
    const plotHeight = Math.max(1, plotBottom - plotTop);
    const plotWidth = Math.max(1, plotRight - plotLeft);
    const zeroY = plotTop + (plotHeight / 2);
    const graphAmplitude = Math.max(1, (plotHeight / 2) - 3);

    this._ctx.clearRect(0, 0, width, height);

    this._ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    this._ctx.fillRect(0, 0, width, height);

    this._ctx.strokeStyle = "rgba(13, 94, 141, 0.22)";
    this._ctx.lineWidth = 1;
    this._ctx.setLineDash([3, 3]);
    this._ctx.beginPath();
    this._ctx.moveTo(plotLeft, Math.round(zeroY) + 0.5);
    this._ctx.lineTo(plotRight, Math.round(zeroY) + 0.5);
    this._ctx.stroke();
    this._ctx.setLineDash([]);

    this._ctx.strokeStyle = "#0d5e8d";
    this._ctx.beginPath();
    this._ctx.moveTo(0.5, 0.5);
    this._ctx.lineTo(0.5, height - 0.5);
    this._ctx.lineTo(width - 0.5, height - 0.5);
    this._ctx.moveTo(0.5, 0.5);
    this._ctx.lineTo(4.5, 4.5);
    this._ctx.moveTo(width - 0.5, height - 0.5);
    this._ctx.lineTo(width - 4.5, height - 4.5);
    this._ctx.stroke();

    if (this._history.length === 0) {
      return;
    }

    const maxAbsDelta = Math.max(1, ...this._history.map((value) => Math.abs(value)));
    const stepX = this._history.length > 1 ? plotWidth / (this._history.length - 1) : 0;

    this._ctx.strokeStyle = "#00699f";
    this._ctx.lineWidth = 1.5;
    this._ctx.beginPath();

    this._history.forEach((delta, index) => {
      const x = plotLeft + (stepX * index);
      const y = zeroY - ((delta / maxAbsDelta) * graphAmplitude);
      if (index === 0) {
        this._ctx.moveTo(x, y);
      } else {
        this._ctx.lineTo(x, y);
      }
    });

    this._ctx.stroke();

    const lastDelta = this._history[this._history.length - 1];
    const lastX = plotLeft + (stepX * (this._history.length - 1));
    const lastY = zeroY - ((lastDelta / maxAbsDelta) * graphAmplitude);

    this._ctx.fillStyle =
      lastDelta > 0
        ? ALIVE_VARIATION_CHART_COLORS.positive
        : (lastDelta < 0 ? ALIVE_VARIATION_CHART_COLORS.negative : "#0d5e8d");
    this._ctx.beginPath();
    this._ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    this._ctx.fill();
  }
}

export default AliveVariationChart;
