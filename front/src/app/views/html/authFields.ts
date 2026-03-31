import { CLOSE_ICON } from "@assets/icons/closeIcon";
import { EYE_ICON, EYE_OFF_ICON } from "@assets/icons/passwordVisibilityIcon";

interface AuthFieldOptions {
  autocomplete?: string;
  errorId?: string;
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  value?: string;
}

interface AuthTextFieldOptions extends AuthFieldOptions {
  type?: "text" | "email";
  /** Wraps the input in `ui-input-shell` with the same close (×) control as save/credential modals. */
  clearable?: boolean;
  clearAriaLabel?: string;
}

interface AuthSecretFieldOptions extends AuthFieldOptions {
  toggleSubject?: string;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function createOptionalAttribute(name: string, value?: string): string {
  return value !== undefined ? ` ${name}="${escapeHtml(value)}"` : "";
}

function createFieldErrorMessage(errorId?: string, fieldName?: string): string {
  if (!errorId || !fieldName) {
    return "";
  }

  return `<span class="auth-field__message" id="${escapeHtml(errorId)}" data-field-error-for="${escapeHtml(fieldName)}" aria-live="polite"></span>`;
}

export function createAuthTextField(options: AuthTextFieldOptions): string {
  const {
    autocomplete,
    clearable = false,
    clearAriaLabel = "Clear",
    errorId,
    label,
    name,
    placeholder,
    required = true,
    type = "text",
    value,
  } = options;
  const ariaDescribedBy = errorId ? ` aria-describedby="${escapeHtml(errorId)}"` : "";
  const requiredAttribute = required ? " required" : "";
  const inputMarkup = `<input
        class="ui-input"
        type="${type}"
        name="${escapeHtml(name)}"
        placeholder="${escapeHtml(placeholder)}"${createOptionalAttribute("autocomplete", autocomplete)}${createOptionalAttribute("value", value)}${ariaDescribedBy}${requiredAttribute}
      >`;

  const controlMarkup = clearable
    ? `<div class="ui-input-shell">
        ${inputMarkup}
        <button
          type="button"
          class="ui-input-shell__button ui-input-shell__button--clear"
          data-auth-clear-field="${escapeHtml(name)}"
          aria-label="${escapeHtml(clearAriaLabel)}"
          hidden
        >
          <span class="ui-input-shell__icon" aria-hidden="true">${CLOSE_ICON}</span>
        </button>
      </div>`
    : inputMarkup;

  return `
    <label class="auth-field">
      <span>${escapeHtml(label)}</span>
      ${controlMarkup}
      ${createFieldErrorMessage(errorId, name)}
    </label>
  `;
}

export function createAuthSecretField(options: AuthSecretFieldOptions): string {
  const { autocomplete, errorId, label, name, placeholder, required = true, toggleSubject, value } = options;
  const subject = toggleSubject ?? label.toLowerCase();
  const showLabel = `Show ${subject}`;
  const hideLabel = `Hide ${subject}`;
  const ariaDescribedBy = errorId ? ` aria-describedby="${escapeHtml(errorId)}"` : "";
  const requiredAttribute = required ? " required" : "";

  return `
    <label class="auth-field">
      <span>${escapeHtml(label)}</span>
      <div class="ui-input-shell" data-password-field>
        <input
          class="ui-input"
          type="password"
          name="${escapeHtml(name)}"
          placeholder="${escapeHtml(placeholder)}"${createOptionalAttribute("autocomplete", autocomplete)}${createOptionalAttribute("value", value)}${ariaDescribedBy}${requiredAttribute}
        >
        <button
          type="button"
          class="ui-input-shell__button"
          data-password-toggle
          data-password-visible="false"
          data-show-label="${escapeHtml(showLabel)}"
          data-hide-label="${escapeHtml(hideLabel)}"
          aria-label="${escapeHtml(showLabel)}"
          title="${escapeHtml(showLabel)}"
        >
          <span class="ui-input-shell__icon ui-input-shell__icon--visible" aria-hidden="true">${EYE_ICON}</span>
          <span class="ui-input-shell__icon ui-input-shell__icon--hidden" aria-hidden="true">${EYE_OFF_ICON}</span>
        </button>
      </div>
      ${createFieldErrorMessage(errorId, name)}
    </label>
  `;
}
