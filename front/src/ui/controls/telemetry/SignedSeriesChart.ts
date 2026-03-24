import { getRequiredContext2D } from "@helpers/dom";
import {
  drawTelemetryAxes,
  drawTelemetrySurface,
  getTelemetryAxisLayout,
  getTelemetryTheme,
  TELEMETRY_LABEL_FONT,
} from "./telemetryTheme";

const SCALE_RELAXATION = 0.12;

type ChartPoint = {
  x: number;
  y: number;
  value: number;
};

type SignedSeriesChartOptions = {
  canvas: HTMLCanvasElement;
  lineColor: string;
};

/**
 * Reusable signed-series canvas chart.
 *
 * It is designed for compact telemetry panels where values can be positive or
 * negative around a central zero line:
 * - left to right = oldest to newest sample
 * - center dashed line = zero
 * - above center = positive values
 * - below center = negative values
 *
 * The chart owns only rendering concerns. Call `setValues()` with the full
 * series to display, and it will handle sizing, scaling, axes and the latest
 * marker. This makes it reusable for raw deltas, moving averages, or any other
 * signed metric that should be shown in the same visual language.
 */
class SignedSeriesChart {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _ctx: CanvasRenderingContext2D;
  private readonly _lineColor: string;
  private _values: number[] = [];
  private _width = 1;
  private _height = 1;
  private _verticalScale = 1;

  constructor(options: SignedSeriesChartOptions) {
    this._canvas = options.canvas;
    this._ctx = getRequiredContext2D(options.canvas);
    this._lineColor = options.lineColor;
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
    const { axisX, labelCenter, plotLeft } = getTelemetryAxisLayout(this._ctx);
    const plotRight = width - 4;
    const plotTop = 5;
    const plotBottom = height - 6;
    const plotHeight = Math.max(1, plotBottom - plotTop);
    const plotWidth = Math.max(1, plotRight - plotLeft);
    const zeroY = plotTop + plotHeight / 2;
    const graphAmplitude = Math.max(1, plotHeight / 2 - 3);
    const theme = getTelemetryTheme();

    drawTelemetrySurface(this._ctx, width, height, theme);

    this._ctx.strokeStyle = theme.zeroLine;
    this._ctx.lineWidth = 1;
    this._ctx.setLineDash([3, 3]);
    this._ctx.beginPath();
    this._ctx.moveTo(plotLeft, Math.round(zeroY) + 0.5);
    this._ctx.lineTo(plotRight, Math.round(zeroY) + 0.5);
    this._ctx.stroke();
    this._ctx.setLineDash([]);

    this._drawScaleLabels(theme, labelCenter, plotTop, zeroY, plotBottom);

    drawTelemetryAxes(this._ctx, theme, axisX, plotTop, plotRight, plotBottom);

    if (this._values.length === 0) {
      return;
    }

    const targetScale = Math.max(1, ...this._values.map((value) => Math.abs(value)));
    const scale = this._updateVerticalScale(targetScale);
    const stepX = this._values.length > 1 ? plotWidth / (this._values.length - 1) : 0;
    const points = this._values.map((value, index) => ({
      x: plotLeft + stepX * index,
      y: zeroY - (value / scale) * graphAmplitude,
      value,
    }));

    this._drawLine(points);
    this._drawLatestMarker(points[points.length - 1]);
  }

  private _drawScaleLabels(
    theme: ReturnType<typeof getTelemetryTheme>,
    labelCenter: number,
    plotTop: number,
    zeroY: number,
    plotBottom: number,
  ): void {
    this._ctx.fillStyle = theme.label;
    this._ctx.font = TELEMETRY_LABEL_FONT;
    this._ctx.textAlign = "center";
    this._ctx.textBaseline = "middle";
    this._ctx.fillText("+", labelCenter, plotTop + 4);
    this._ctx.fillText("0", labelCenter, zeroY);
    this._ctx.fillText("-", labelCenter, plotBottom - 2);
  }

  private _updateVerticalScale(targetScale: number): number {
    if (targetScale >= this._verticalScale) {
      this._verticalScale = targetScale;
      return this._verticalScale;
    }

    this._verticalScale = Math.max(1, this._verticalScale - (this._verticalScale - targetScale) * SCALE_RELAXATION);
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
    this._ctx.fillStyle = this._colorForDelta(point.value);
    this._ctx.beginPath();
    this._ctx.arc(point.x, point.y, 2.4, 0, Math.PI * 2);
    this._ctx.fill();
  }

  private _colorForDelta(delta: number): string {
    const theme = getTelemetryTheme();
    if (delta > 0) {
      return theme.positive;
    }
    if (delta < 0) {
      return theme.negative;
    }
    return theme.neutral;
  }
}

export default SignedSeriesChart;
