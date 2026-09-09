type TileSelectorSize = "md" | "sm";

export interface TileSelectorButtonOptions {
  value: string;
  selected?: boolean;
  size?: TileSelectorSize;
  icon: string;
  dataAttributeName: string;
  dataAttributeValue: string;
  title?: string;
  ariaLabel?: string;
  /** A `data-testid` for the demo harness (`e2e/demo`). */
  testId?: string;
  /** `data-*` companions to the mark, for the facts a storyboard chooses on (`data-route`, `data-noise`). */
  testData?: Record<string, string>;
}

function createTileSelectorLabel(icon: string, dataAttributeName: string, dataAttributeValue: string): string {
  return `
    <span class="tile-selector__icon" aria-hidden="true">${icon}</span>
    <span class="tile-selector__text" data-${dataAttributeName}="${dataAttributeValue}"></span>
  `;
}

export function createTileSelectorButton(options: TileSelectorButtonOptions): string {
  const {
    value,
    selected = false,
    size = "md",
    icon,
    dataAttributeName,
    dataAttributeValue,
    title,
    ariaLabel,
    testId,
    testData,
  } = options;

  const selectedClass = selected ? " is-selected" : "";
  const titleAttribute = title ? ` title="${title}"` : "";
  const ariaLabelAttribute = ariaLabel ? ` aria-label="${ariaLabel}"` : "";
  const testIdAttribute = testId ? ` data-testid="${testId}"` : "";
  const testDataAttributes = Object.entries(testData ?? {}).map(([name, value]) => ` data-${name}="${value}"`);

  return `
    <div class="tile-selector__option" data-size="${size}">
      <button
        type="button"
        class="tile-selector__button${selectedClass}"
        data-value="${value}"${testIdAttribute}${testDataAttributes.join("")}${titleAttribute}${ariaLabelAttribute}
      >${createTileSelectorLabel(icon, dataAttributeName, dataAttributeValue)}</button>
    </div>
  `;
}
