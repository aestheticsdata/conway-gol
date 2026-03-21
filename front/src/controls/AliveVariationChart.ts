import { getRequiredContext2D } from "@helpers/dom";
import { ALIVE_VARIATION_CHART_COLORS } from "@controls/constants";

/**
 * Mini playback chart shown in the left control column.
 *
 * It plots the variation of living cells over time, not the absolute count.
 * Each stored sample is:
 *   currentAliveCount - previousAliveCount
 *
 * Reading the graph:
 * - left to right = older to newer samples
 * - the middle dashed line = zero variation
 * - above the middle line = the alive count increased
 * - below the middle line = the alive count decreased
 *
 * The line is vertically normalized against the largest absolute variation
 * currently visible so the chart always uses the available height.
 */
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
      // First sample: establish the reference count and start with a flat point
      // at 0 variation so the graph has an initial visible state.
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
    const devicePixelRatio = window.devicePixelRatio || 1;

    // The canvas keeps its CSS size, but its internal drawing buffer is scaled
    // by the device pixel ratio so the chart stays sharp on Retina / HiDPI screens.
    this._width = width;
    this._height = height;
    this._canvas.width = Math.max(1, Math.floor(width * devicePixelRatio));
    this._canvas.height = Math.max(1, Math.floor(height * devicePixelRatio));
    this._ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    this._trimHistory();
    this._draw();
  };

  private _trimHistory(): void {
    // Keep roughly one point per horizontal pixel. If the chart becomes too
    // narrow, discard the oldest samples and keep the newest activity visible.
    const maxPoints = Math.max(2, Math.floor(this._width - 10));
    if (this._history.length > maxPoints) {
      this._history = this._history.slice(-maxPoints);
    }
  }

  private _draw(): void {
    // Inner plot box with a few pixels of margin for axes and arrowheads.
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

    // Background panel of the mini-chart.
    this._ctx.fillStyle = ALIVE_VARIATION_CHART_COLORS.background;
    this._ctx.fillRect(0, 0, width, height);

    // Zero-variation reference line across the middle.
    this._ctx.strokeStyle = ALIVE_VARIATION_CHART_COLORS.zeroLine;
    this._ctx.lineWidth = 1;
    this._ctx.setLineDash([3, 3]);
    this._ctx.beginPath();
    this._ctx.moveTo(plotLeft, Math.round(zeroY) + 0.5);
    this._ctx.lineTo(plotRight, Math.round(zeroY) + 0.5);
    this._ctx.stroke();
    this._ctx.setLineDash([]);

    // Y axis on the left and X axis at the bottom.
    // Arrowheads are single-sided so they stay inside the canvas bounds.
    this._ctx.strokeStyle = ALIVE_VARIATION_CHART_COLORS.axis;
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

    // Vertical normalization: map the strongest visible variation to the
    // available half-height so all points fit without clipping.
    const maxAbsDelta = Math.max(1, ...this._history.map((value) => Math.abs(value)));
    const stepX = this._history.length > 1 ? plotWidth / (this._history.length - 1) : 0;

    // Draw one continuous polyline from the oldest sample to the newest.
    this._ctx.strokeStyle = ALIVE_VARIATION_CHART_COLORS.line;
    this._ctx.lineWidth = 1.5;
    this._ctx.beginPath();

    this._history.forEach((delta, index) => {
      const x = plotLeft + (stepX * index);
      // Positive deltas are above the zero line, negative deltas below it.
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

    // Emphasize the most recent sample with a color that indicates direction.
    this._ctx.fillStyle =
      lastDelta > 0
        ? ALIVE_VARIATION_CHART_COLORS.positive
        : (
          lastDelta < 0
            ? ALIVE_VARIATION_CHART_COLORS.negative
            : ALIVE_VARIATION_CHART_COLORS.neutral
        );
    this._ctx.beginPath();
    this._ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    this._ctx.fill();
  }
}

export default AliveVariationChart;
