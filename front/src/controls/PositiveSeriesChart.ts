import { getRequiredContext2D } from "@helpers/dom";
import { TELEMETRY_CHART_COLORS } from "@controls/constants";

const SCALE_RELAXATION = 0.12;

type ChartPoint = {
  x: number;
  y: number;
};

type PositiveSeriesChartOptions = {
  canvas: HTMLCanvasElement;
  lineColor: string;
  markerColor?: string;
};

/**
 * Reusable compact chart for non-negative time series.
 *
 * It keeps the same telemetry styling as the signed variation chart, but uses
 * the full chart height for values that evolve from zero upwards.
 */
class PositiveSeriesChart {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _ctx: CanvasRenderingContext2D;
  private readonly _lineColor: string;
  private readonly _markerColor: string;
  private _values: number[] = [];
  private _width = 1;
  private _height = 1;
  private _verticalScale = 1;

  constructor(options: PositiveSeriesChartOptions) {
    this._canvas = options.canvas;
    this._ctx = getRequiredContext2D(options.canvas);
    this._lineColor = options.lineColor;
    this._markerColor = options.markerColor ?? options.lineColor;
    window.addEventListener("resize", this._resize);
    this._resize();
  }

  public reset(): void {
    this._values = [];
    this._verticalScale = 1;
    this._draw();
  }

  public setValues(values: number[]): void {
    this._values = values.slice(-this.capacity);
    this._draw();
  }

  public get capacity(): number {
    return Math.max(2, Math.floor(this._width - 18));
  }

  private _resize = (): void => {
    const rect = this._canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const devicePixelRatio = window.devicePixelRatio || 1;

    this._width = width;
    this._height = height;
    this._canvas.width = Math.max(1, Math.floor(width * devicePixelRatio));
    this._canvas.height = Math.max(1, Math.floor(height * devicePixelRatio));
    this._ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    this._values = this._values.slice(-this.capacity);
    this._draw();
  };

  private _draw(): void {
    const width = this._width;
    const height = this._height;
    const plotLeft = 16;
    const plotRight = width - 4;
    const plotTop = 5;
    const plotBottom = height - 6;
    const plotHeight = Math.max(1, plotBottom - plotTop);
    const plotWidth = Math.max(1, plotRight - plotLeft);
    const graphHeight = Math.max(1, plotHeight - 3);

    this._ctx.clearRect(0, 0, width, height);
    this._ctx.fillStyle = TELEMETRY_CHART_COLORS.background;
    this._ctx.fillRect(0, 0, width, height);

    this._drawScaleLabels(plotTop, plotBottom);

    this._ctx.strokeStyle = TELEMETRY_CHART_COLORS.axis;
    this._ctx.beginPath();
    this._ctx.moveTo(0.5, 0.5);
    this._ctx.lineTo(0.5, height - 0.5);
    this._ctx.lineTo(width - 0.5, height - 0.5);
    this._ctx.moveTo(0.5, 0.5);
    this._ctx.lineTo(4.5, 4.5);
    this._ctx.moveTo(width - 0.5, height - 0.5);
    this._ctx.lineTo(width - 4.5, height - 4.5);
    this._ctx.stroke();

    if (this._values.length === 0) {
      return;
    }

    const targetScale = Math.max(1, ...this._values);
    const scale = this._updateVerticalScale(targetScale);
    const stepX = this._values.length > 1 ? plotWidth / (this._values.length - 1) : 0;
    const points = this._values.map((value, index) => ({
      x: plotLeft + (stepX * index),
      y: plotBottom - ((value / scale) * graphHeight),
    }));

    this._drawLine(points);
    this._drawLatestMarker(points[points.length - 1]);
  }

  private _drawScaleLabels(plotTop: number, plotBottom: number): void {
    this._ctx.fillStyle = TELEMETRY_CHART_COLORS.label;
    this._ctx.font = "10px sans-serif";
    this._ctx.textAlign = "left";
    this._ctx.textBaseline = "middle";
    this._ctx.fillText("max", 2, plotTop + 4);
    this._ctx.fillText("0", 4, plotBottom - 2);
  }

  private _updateVerticalScale(targetScale: number): number {
    if (targetScale >= this._verticalScale) {
      this._verticalScale = targetScale;
      return this._verticalScale;
    }

    this._verticalScale = Math.max(
      1,
      this._verticalScale - ((this._verticalScale - targetScale) * SCALE_RELAXATION),
    );
    return this._verticalScale;
  }

  private _drawLine(points: ChartPoint[]): void {
    if (points.length === 1) {
      this._ctx.fillStyle = this._lineColor;
      this._ctx.beginPath();
      this._ctx.arc(points[0].x, points[0].y, 1.5, 0, Math.PI * 2);
      this._ctx.fill();
      return;
    }

    this._ctx.strokeStyle = this._lineColor;
    this._ctx.lineWidth = 1.6;
    this._ctx.beginPath();

    points.forEach((point, index) => {
      if (index === 0) {
        this._ctx.moveTo(point.x, point.y);
      } else {
        this._ctx.lineTo(point.x, point.y);
      }
    });

    this._ctx.stroke();
  }

  private _drawLatestMarker(point: ChartPoint): void {
    this._ctx.fillStyle = this._markerColor;
    this._ctx.beginPath();
    this._ctx.arc(point.x, point.y, 2.4, 0, Math.PI * 2);
    this._ctx.fill();
  }
}

export default PositiveSeriesChart;
