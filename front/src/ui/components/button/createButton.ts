type UiButtonSize = "compact";
type UiButtonWidth = "auto" | "block";
type UiButtonType = "button" | "submit" | "reset";
type UiButtonIcon = "pause" | "play";

export type UiButtonOptions = {
  ariaLabel?: string;
  className?: string;
  icon?: UiButtonIcon;
  label?: string;
  size?: UiButtonSize;
  title?: string;
  type?: UiButtonType;
  width?: UiButtonWidth;
};

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function createButton(options: UiButtonOptions): string {
  const { ariaLabel, className = "", icon, label = "", size = "compact", title, type = "button", width = "auto" } =
    options;

  const classes = ["ui-button", `ui-button--${size}`, `ui-button--${width}`, icon ? "ui-button--with-icon" : "", className]
    .filter(Boolean)
    .join(" ");
  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
  const ariaLabelAttribute = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : "";
  const dataIconAttribute = icon ? ` data-icon="${icon}"` : "";
  const buttonLabel = escapeHtml(label);
  const content = icon
    ? `<span class="ui-button__icon" aria-hidden="true"></span><span class="ui-button__label">${buttonLabel}</span>`
    : buttonLabel;

  return `<button type="${type}" class="${classes}"${titleAttribute}${ariaLabelAttribute}${dataIconAttribute}>${content}</button>`;
}
