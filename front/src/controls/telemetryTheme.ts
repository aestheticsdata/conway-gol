export type TelemetryTheme = {
  radius: number;
  surfaceTop: string;
  surfaceBottom: string;
  border: string;
  highlight: string;
  axis: string;
  zeroLine: string;
  label: string;
  line: string;
  marker: string;
  positive: string;
  negative: string;
  neutral: string;
};

export const TELEMETRY_LABEL_FONT = "10px 'JetBrains Mono', monospace";

type TelemetryAxisLayout = {
  axisX: number;
  labelLeft: number;
  labelCenter: number;
  plotLeft: number;
};

const AXIS_LABEL_SAMPLE = "max";
const AXIS_LABEL_LEFT = 6;
const AXIS_LABEL_GAP = 6;
const AXIS_PLOT_GAP = 6.5;

export const DEFAULT_TELEMETRY_THEME: TelemetryTheme = {
  radius: 5,
  surfaceTop: "rgba(32, 47, 71, 0.92)",
  surfaceBottom: "rgba(13, 20, 34, 0.92)",
  border: "rgba(117, 161, 205, 0.24)",
  highlight: "rgba(255, 255, 255, 0.08)",
  axis: "rgba(143, 169, 194, 0.24)",
  zeroLine: "rgba(37, 219, 255, 0.2)",
  label: "rgba(143, 169, 194, 0.94)",
  line: "#25dbff",
  marker: "#78efff",
  positive: "#78efff",
  negative: "#f3b165",
  neutral: "rgba(143, 169, 194, 0.94)",
};

function readCssColorVariable(
  styles: CSSStyleDeclaration,
  variableName: string,
  fallback: string,
): string {
  return styles.getPropertyValue(variableName).trim() || fallback;
}

function readCssNumberVariable(
  styles: CSSStyleDeclaration,
  variableName: string,
  fallback: number,
): number {
  const value = styles.getPropertyValue(variableName).trim();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getTelemetryTheme(): TelemetryTheme {
  if (typeof window === "undefined") {
    return DEFAULT_TELEMETRY_THEME;
  }

  const styles = window.getComputedStyle(document.documentElement);

  return {
    radius: readCssNumberVariable(styles, "--radius", DEFAULT_TELEMETRY_THEME.radius),
    surfaceTop: readCssColorVariable(styles, "--telemetry-surface-top", DEFAULT_TELEMETRY_THEME.surfaceTop),
    surfaceBottom: readCssColorVariable(styles, "--telemetry-surface-bottom", DEFAULT_TELEMETRY_THEME.surfaceBottom),
    border: readCssColorVariable(styles, "--telemetry-border", DEFAULT_TELEMETRY_THEME.border),
    highlight: readCssColorVariable(styles, "--telemetry-highlight", DEFAULT_TELEMETRY_THEME.highlight),
    axis: readCssColorVariable(styles, "--telemetry-axis", DEFAULT_TELEMETRY_THEME.axis),
    zeroLine: readCssColorVariable(styles, "--telemetry-zero-line", DEFAULT_TELEMETRY_THEME.zeroLine),
    label: readCssColorVariable(styles, "--telemetry-label", DEFAULT_TELEMETRY_THEME.label),
    line: readCssColorVariable(styles, "--telemetry-line", DEFAULT_TELEMETRY_THEME.line),
    marker: readCssColorVariable(styles, "--telemetry-marker", DEFAULT_TELEMETRY_THEME.marker),
    positive: readCssColorVariable(styles, "--telemetry-positive", DEFAULT_TELEMETRY_THEME.positive),
    negative: readCssColorVariable(styles, "--telemetry-negative", DEFAULT_TELEMETRY_THEME.negative),
    neutral: readCssColorVariable(styles, "--telemetry-neutral", DEFAULT_TELEMETRY_THEME.neutral),
  };
}

export function drawTelemetrySurface(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: TelemetryTheme,
): void {
  const radius = Math.max(0, Math.min(theme.radius, width / 2, height / 2));
  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, theme.surfaceTop);
  background.addColorStop(1, theme.surfaceBottom);

  ctx.clearRect(0, 0, width, height);
  buildRoundedRectPath(ctx, 0.5, 0.5, width - 1, height - 1, radius);
  ctx.fillStyle = background;
  ctx.fill();

  ctx.save();
  buildRoundedRectPath(ctx, 0.5, 0.5, width - 1, height - 1, radius);
  ctx.clip();
  const highlightHeight = Math.max(12, Math.floor(height * 0.28));
  const highlight = ctx.createLinearGradient(0, 0, 0, highlightHeight);
  highlight.addColorStop(0, theme.highlight);
  highlight.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = highlight;
  ctx.fillRect(1, 1, width - 2, highlightHeight);
  ctx.restore();

  buildRoundedRectPath(ctx, 0.5, 0.5, width - 1, height - 1, radius);
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function getTelemetryAxisLayout(ctx: CanvasRenderingContext2D): TelemetryAxisLayout {
  const previousFont = ctx.font;
  ctx.font = TELEMETRY_LABEL_FONT;
  const widestLabel = ctx.measureText(AXIS_LABEL_SAMPLE).width;
  ctx.font = previousFont;

  const axisX = Math.ceil(AXIS_LABEL_LEFT + widestLabel + AXIS_LABEL_GAP) + 0.5;

  return {
    axisX,
    labelLeft: AXIS_LABEL_LEFT,
    labelCenter: (AXIS_LABEL_LEFT + axisX) / 2,
    plotLeft: axisX + AXIS_PLOT_GAP,
  };
}

export function drawTelemetryAxes(
  ctx: CanvasRenderingContext2D,
  theme: TelemetryTheme,
  axisX: number,
  plotTop: number,
  plotRight: number,
  plotBottom: number,
): void {
  const arrowSize = 4;

  ctx.strokeStyle = theme.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(axisX, plotTop);
  ctx.lineTo(axisX, plotBottom);
  ctx.lineTo(plotRight, plotBottom);
  ctx.moveTo(axisX, plotTop);
  ctx.lineTo(axisX + arrowSize, plotTop + arrowSize);
  ctx.moveTo(plotRight, plotBottom);
  ctx.lineTo(plotRight - arrowSize, plotBottom - arrowSize);
  ctx.stroke();
}

function buildRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
