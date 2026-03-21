import PositiveSeriesChart from "@controls/PositiveSeriesChart";
import { ALIVE_COUNT_CHART_COLORS } from "@controls/constants";

const MAX_HISTORY_POINTS = 1024;

/**
 * Controller for the absolute alive-cell count telemetry chart.
 */
class AliveCountChart {
  private readonly _chart: PositiveSeriesChart;
  private _history: number[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this._chart = new PositiveSeriesChart({
      canvas,
      lineColor: ALIVE_COUNT_CHART_COLORS.line,
      markerColor: ALIVE_COUNT_CHART_COLORS.marker,
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
