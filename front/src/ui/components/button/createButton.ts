type UiButtonSize = "compact";
/** Smaller label text for long copy (explicit opt-in; prefer over JS text fitting). */
type UiButtonLabelSize = "default" | "sm";
type UiButtonType = "button" | "submit" | "reset";
type UiButtonIcon = "arrow-right" | "pause" | "play";
type UiButtonIconPosition = "leading" | "trailing";
type UiLinkTarget = "_blank" | "_self" | "_parent" | "_top";

export const ARROW_RIGHT_BUTTON_ICON_MARKUP = `
  <span class="ui-button__icon ui-button__icon--arrow-right" aria-hidden="true">
    <svg viewBox="0 0 16 12" focusable="false">
      <path d="M1.5 6H10.5M7 2.5L10.5 6L7 9.5" />
    </svg>
  </span>
`;

export type UiButtonOptions = {
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  icon?: UiButtonIcon;
  iconPosition?: UiButtonIconPosition;
  label?: string;
  /** Default: inherit DS body size; `sm` uses `ui-button--label-sm` (see buttons.css). */
  labelSize?: UiButtonLabelSize;
  size?: UiButtonSize;
  title?: string;
  type?: UiButtonType;
};

export type UiLinkButtonOptions = {
  ariaLabel?: string;
  className?: string;
  href: string;
  label: string;
  rel?: string;
  target?: UiLinkTarget;
  title?: string;
};

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function createIconMarkup(icon: UiButtonIcon): string {
  if (icon === "arrow-right") {
    return ARROW_RIGHT_BUTTON_ICON_MARKUP;
  }

  return `<span class="ui-button__icon" aria-hidden="true"></span>`;
}

function buildLinkButtonClasses(className = ""): string {
  return ["ui-link-button", className].filter(Boolean).join(" ");
}

function resolveLinkRel(target?: UiLinkTarget, rel?: string): string {
  if (rel) {
    return rel;
  }

  return target === "_blank" ? "noopener noreferrer" : "";
}

export function createButton(options: UiButtonOptions): string {
  const {
    ariaLabel,
    className = "",
    disabled = false,
    icon,
    iconPosition = "leading",
    label = "",
    labelSize = "default",
    size = "compact",
    title,
    type = "button",
  } = options;

  const classes = [
    "ui-button",
    `ui-button--${size}`,
    labelSize === "sm" ? "ui-button--label-sm" : "",
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

export function createLinkButton(options: UiLinkButtonOptions): string {
  const { ariaLabel, className = "", href, label, rel, target, title } = options;
  const classes = buildLinkButtonClasses(className);
  const relValue = resolveLinkRel(target, rel);
  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
  const ariaLabelAttribute = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : "";
  const targetAttribute = target ? ` target="${escapeHtml(target)}"` : "";
  const relAttribute = relValue ? ` rel="${escapeHtml(relValue)}"` : "";

  return `<a class="${classes}" href="${escapeHtml(href)}"${titleAttribute}${ariaLabelAttribute}${targetAttribute}${relAttribute}><span class="ui-link-button__label">${escapeHtml(label)}</span><span class="ui-link-button__icon" aria-hidden="true">${ARROW_RIGHT_BUTTON_ICON_MARKUP}</span></a>`;
}

export function createLinkButtonElement(options: UiLinkButtonOptions): HTMLAnchorElement {
  const { ariaLabel, className = "", href, label, rel, target, title } = options;
  const anchor = document.createElement("a");
  const relValue = resolveLinkRel(target, rel);

  anchor.className = buildLinkButtonClasses(className);
  anchor.href = href;

  if (title) {
    anchor.title = title;
  }

  if (ariaLabel) {
    anchor.setAttribute("aria-label", ariaLabel);
  }

  if (target) {
    anchor.target = target;
  }

  if (relValue) {
    anchor.rel = relValue;
  }

  const labelElement = document.createElement("span");
  labelElement.className = "ui-link-button__label";
  labelElement.textContent = label;

  const iconElement = document.createElement("span");
  iconElement.className = "ui-link-button__icon";
  iconElement.setAttribute("aria-hidden", "true");
  iconElement.innerHTML = ARROW_RIGHT_BUTTON_ICON_MARKUP;

  anchor.append(labelElement, iconElement);
  return anchor;
}
