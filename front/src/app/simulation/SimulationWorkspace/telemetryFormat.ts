export function formatSignedTelemetryValue(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}

export function telemetryToneForValue(value: number): "positive" | "negative" | "neutral" {
  if (value > 0) {
    return "positive";
  }
  if (value < 0) {
    return "negative";
  }
  return "neutral";
}
