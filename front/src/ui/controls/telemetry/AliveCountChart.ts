import PositiveSeriesChart from "./PositiveSeriesChart";
import { getTelemetryTheme } from "./telemetryTheme";

const MAX_HISTORY_POINTS = 1024;

/**
 * Controller for the absolute alive-cell count telemetry chart.
 */
class AliveCountChart {
  private readonly _chart: PositiveSeriesChart;
  private _history: number[] = [];

  constructor(canvas: HTMLCanvasElement) {
    const theme = getTelemetryTheme();
    this._chart = new PositiveSeriesChart({
      canvas,
      lineColor: theme.line,
      markerColor: theme.marker,
    });
  }

  public reset(): void {
    this._history = [];
    this._chart.reset();
  }

  public push(aliveCount: number): void {
    this._history.push(aliveCount);
    this._trimHistory();
    this._chart.setValues(this._history);
  }

  private _trimHistory(): void {
    const maxVisiblePoints = this._chart.capacity;
    const maxPoints = Math.max(maxVisiblePoints, Math.min(MAX_HISTORY_POINTS, maxVisiblePoints * 4));
    if (this._history.length > maxPoints) {
      this._history = this._history.slice(-maxPoints);
    }
  }
}

export default AliveCountChart;
