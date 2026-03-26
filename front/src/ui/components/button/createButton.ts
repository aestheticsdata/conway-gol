type UiButtonSize = "compact";
type UiButtonType = "button" | "submit" | "reset";
type UiButtonIcon = "arrow-right" | "pause" | "play";
type UiButtonIconPosition = "leading" | "trailing";

export type UiButtonOptions = {
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  icon?: UiButtonIcon;
  iconPosition?: UiButtonIconPosition;
  label?: string;
  size?: UiButtonSize;
  title?: string;
  type?: UiButtonType;
};

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function createIconMarkup(icon: UiButtonIcon): string {
  if (icon === "arrow-right") {
    return `
      <span class="ui-button__icon ui-button__icon--arrow-right" aria-hidden="true">
        <svg viewBox="0 0 16 12" focusable="false">
          <path d="M1.5 6H10.5M7 2.5L10.5 6L7 9.5" />
        </svg>
      </span>
    `;
  }

  return `<span class="ui-button__icon" aria-hidden="true"></span>`;
}

export function createButton(options: UiButtonOptions): string {
  const {
    ariaLabel,
    className = "",
    disabled = false,
    icon,
    iconPosition = "leading",
    label = "",
    size = "compact",
    title,
    type = "button",
  } = options;

  const classes = [
    "ui-button",
    `ui-button--${size}`,
    icon ? "ui-button--with-icon" : "",
    icon ? `ui-button--icon-${iconPosition}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
  const ariaLabelAttribute = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : "";
  const dataIconAttribute = icon ? ` data-icon="${icon}"` : "";
  const disabledAttribute = disabled ? " disabled" : "";
  const buttonLabel = escapeHtml(label);
  const iconMarkup = icon ? createIconMarkup(icon) : "";
  const labelMarkup = `<span class="ui-button__label">${buttonLabel}</span>`;
  const content = icon
    ? iconPosition === "trailing"
      ? `${labelMarkup}${iconMarkup}`
      : `${iconMarkup}${labelMarkup}`
    : buttonLabel;

  return `<button type="${type}" class="${classes}"${titleAttribute}${ariaLabelAttribute}${dataIconAttribute}${disabledAttribute}>${content}</button>`;
}
