type UiButtonSize = "compact";
type UiButtonWidth = "auto" | "block";
type UiButtonType = "button" | "submit" | "reset";

export type UiButtonOptions = {
  ariaLabel?: string;
  className?: string;
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
  const { ariaLabel, className = "", label = "", size = "compact", title, type = "button", width = "auto" } = options;

  const classes = ["ui-button", `ui-button--${size}`, `ui-button--${width}`, className].filter(Boolean).join(" ");
  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
  const ariaLabelAttribute = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : "";

  return `<button type="${type}" class="${classes}"${titleAttribute}${ariaLabelAttribute}>${escapeHtml(label)}</button>`;
}
