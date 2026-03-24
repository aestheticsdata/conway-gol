type TileSelectorSize = "md" | "sm";

export type TileSelectorButtonOptions = {
  value: string;
  selected?: boolean;
  size?: TileSelectorSize;
  icon: string;
  dataAttributeName: string;
  dataAttributeValue: string;
  title?: string;
  ariaLabel?: string;
};

function createTileSelectorLabel(
  icon: string,
  dataAttributeName: string,
  dataAttributeValue: string,
): string {
  return `
    <span class="tile-selector__icon" aria-hidden="true">${icon}</span>
    <span class="tile-selector__text" data-${dataAttributeName}="${dataAttributeValue}"></span>
  `;
}

export function createTileSelectorButton(
  options: TileSelectorButtonOptions,
): string {
  const {
    value,
    selected = false,
    size = "md",
    icon,
    dataAttributeName,
    dataAttributeValue,
    title,
    ariaLabel,
  } = options;

  const selectedClass = selected ? " is-selected" : "";
  const titleAttribute = title ? ` title="${title}"` : "";
  const ariaLabelAttribute = ariaLabel ? ` aria-label="${ariaLabel}"` : "";

  return `
    <div class="tile-selector__option" data-size="${size}">
      <button
        type="button"
        class="tile-selector__button${selectedClass}"
        data-value="${value}"${titleAttribute}${ariaLabelAttribute}
      >${createTileSelectorLabel(icon, dataAttributeName, dataAttributeValue)}</button>
    </div>
  `;
}
