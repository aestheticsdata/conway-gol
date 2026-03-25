type UiSliderFieldOptions = {
  afterControlHtml?: string;
  className?: string;
  controlClassName?: string;
  displayValue?: string;
  id: string;
  inputClassName?: string;
  label?: string;
  labelClassName?: string;
  labelId?: string;
  max: number;
  min: number;
  overlayHtml?: string;
  step?: number;
  value: number;
  valueClassName?: string;
  valueId?: string;
};

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function buildClassName(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function buildIdAttribute(name: string, value?: string): string {
  return value ? ` ${name}="${escapeHtml(value)}"` : "";
}

export function createSliderField(options: UiSliderFieldOptions): string {
  const {
    afterControlHtml = "",
    className = "",
    controlClassName = "",
    displayValue = String(options.value),
    id,
    inputClassName = "",
    label = "",
    labelClassName = "",
    labelId,
    max,
    min,
    overlayHtml = "",
    step = 1,
    value,
    valueClassName = "",
    valueId,
  } = options;

  const rootClassName = buildClassName("ui-slider-field", className);
  const legendClassName = "ui-slider-field__legend";
  const controlClassNames = buildClassName("ui-slider-field__control", controlClassName);
  const inputClassNames = buildClassName("ui-slider-field__input", inputClassName);
  const labelClassNames = buildClassName("ui-slider-field__label", labelClassName);
  const valueClassNames = buildClassName("ui-slider-field__value", valueClassName);

  return `
    <div class="${rootClassName}">
      <label for="${escapeHtml(id)}" class="${legendClassName}">
        <span${buildIdAttribute("id", labelId)} class="${labelClassNames}">${escapeHtml(label)}</span>
        <span${buildIdAttribute("id", valueId)} class="${valueClassNames}">${escapeHtml(displayValue)}</span>
      </label>
      <div class="${controlClassNames}">
        <input
          type="range"
          id="${escapeHtml(id)}"
          class="${inputClassNames}"
          min="${min}"
          max="${max}"
          value="${value}"
          step="${step}"
        >
        ${overlayHtml}
      </div>
      ${afterControlHtml}
    </div>
  `;
}

export function syncSliderFill(input: HTMLInputElement): void {
  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);

  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(value) || max <= min) {
    input.style.setProperty("--ui-slider-percent", "0%");
    return;
  }

  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  input.style.setProperty("--ui-slider-percent", `${percent}%`);
}
