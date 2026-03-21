import SignedSeriesChart from "@controls/SignedSeriesChart";
import { ALIVE_VARIATION_CHART_COLORS } from "@controls/constants";

const MAX_HISTORY_POINTS = 1024;

/**
 * Controller for the playback telemetry graphs related to living-cell variation.
 *
 * It owns the Conway-specific part of the logic:
 * - compute the signed delta of alive cells between successive states
 * - keep a bounded history of those deltas
 * - feed the reusable SignedSeriesChart with the raw variation series
 *
 * Rendering is delegated to reusable SignedSeriesChart instances so the same
 * chart style can be reused later for other signed time-series metrics.
 */
class AliveVariationChart {
  private readonly _rawChart: SignedSeriesChart;
  private _history: number[] = [];
  private _lastAliveCount: number | null = null;

  constructor(rawCanvas: HTMLCanvasElement) {
    this._rawChart = new SignedSeriesChart({
      canvas: rawCanvas,
      lineColor: ALIVE_VARIATION_CHART_COLORS.line,
    });
  }

  public reset(): void {
    this._history = [];
    this._lastAliveCount = null;
    this._rawChart.reset();
  }

  public push(aliveCount: number): void {
    if (this._lastAliveCount === null) {
      this._lastAliveCount = aliveCount;
      this._history = [0];
      this._render();
      return;
    }

    this._history.push(aliveCount - this._lastAliveCount);
    this._lastAliveCount = aliveCount;
    this._trimHistory();
    this._render();
  }

  private _trimHistory(): void {
    const maxVisiblePoints = this._rawChart.capacity;
    const maxPoints = Math.max(maxVisiblePoints, Math.min(MAX_HISTORY_POINTS, maxVisiblePoints * 4));
    if (this._history.length > maxPoints) {
      this._history = this._history.slice(-maxPoints);
    }
  }

  private _render(): void {
    this._rawChart.setValues(this._history);
  }
}

export default AliveVariationChart;
