import { CLOSE_ICON } from "@assets/icons/closeIcon";
import { createButton } from "@ui/components/button/createButton";

type CredentialChangeModalTexts = {
  cancelLabel: string;
  closeLabel: string;
  confirmLabel: string;
  confirmPlaceholder: string;
  confirmRequired: string;
  currentInvalid: string;
  currentLabel: string;
  currentPlaceholder: string;
  currentRequired: string;
  description: string;
  mismatchMessage: string;
  primaryLabel: string;
  primaryPlaceholder: string;
  primaryRequired: string;
  saveLabel: string;
  title: string;
};

type CredentialChangeModalOptions = {
  autocomplete?: HTMLInputElement["autocomplete"];
  inputType?: "password" | "text";
  requireCurrent?: boolean;
  validateCurrent?: (value: string) => string;
  validatePrimary?: (value: string) => string;
};

const DEFAULT_TEXTS: CredentialChangeModalTexts = {
  cancelLabel: "cancel",
  closeLabel: "close",
  confirmLabel: "Confirm",
  confirmPlaceholder: "Confirm value",
  confirmRequired: "Confirmation is required.",
  currentInvalid: "Current value is invalid.",
  currentLabel: "Current value",
  currentPlaceholder: "Enter current value",
  currentRequired: "Current value is required.",
  description: "",
  mismatchMessage: "Values do not match.",
  primaryLabel: "Value",
  primaryPlaceholder: "Enter value",
  primaryRequired: "Value is required.",
  saveLabel: "save",
  title: "Update secret",
};

class CredentialChangeModal {
  private readonly _overlay: HTMLDivElement;
  private readonly _title: HTMLHeadingElement;
  private readonly _description: HTMLParagraphElement;
  private readonly _currentField: HTMLLabelElement;
  private readonly _currentInput: HTMLInputElement;
  private readonly _primaryInput: HTMLInputElement;
  private readonly _confirmInput: HTMLInputElement;
  private readonly _currentError: HTMLParagraphElement;
  private readonly _primaryError: HTMLParagraphElement;
  private readonly _confirmError: HTMLParagraphElement;
  private readonly _saveButton: HTMLButtonElement;
  private readonly _cancelButton: HTMLButtonElement;
  private readonly _closeButton: HTMLButtonElement;
  private _resolver: ((value: string | null) => void) | null = null;
  private _pendingPromise: Promise<string | null> | null = null;
  private _previouslyFocused: HTMLElement | null = null;
  private _texts: CredentialChangeModalTexts = DEFAULT_TEXTS;
  private _requireCurrent = false;
  private _validateCurrent?: (value: string) => string;
  private _validatePrimary?: (value: string) => string;

  constructor(root: HTMLElement = document.body) {
    this._overlay = document.createElement("div");
    this._overlay.className = "ui-save-modal ui-credential-modal";
    this._overlay.hidden = true;
    this._overlay.innerHTML = `
      <div class="ui-save-modal__backdrop"></div>
      <section class="ui-save-modal__dialog ui-credential-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="ui-credential-modal-title">
        <div class="ui-save-modal__header">
          <h2 id="ui-credential-modal-title" class="ui-save-modal__title">${DEFAULT_TEXTS.title}</h2>
          <button type="button" class="ui-save-modal__close" aria-label="${DEFAULT_TEXTS.closeLabel}">
            <span aria-hidden="true">${CLOSE_ICON}</span>
          </button>
        </div>
        <p class="ui-credential-modal__description" hidden></p>
        <div class="ui-credential-modal__fields">
          <label class="ui-credential-modal__field ui-credential-modal__field--current">
            <span class="ui-credential-modal__label">${DEFAULT_TEXTS.currentLabel}</span>
            <input
              type="password"
              class="ui-input ui-save-modal__input ui-credential-modal__input ui-credential-modal__input--current"
              maxlength="128"
              autocomplete="off"
              placeholder="${DEFAULT_TEXTS.currentPlaceholder}"
            >
            <p class="ui-save-modal__error ui-credential-modal__error" aria-hidden="true"></p>
          </label>
          <label class="ui-credential-modal__field">
            <span class="ui-credential-modal__label">${DEFAULT_TEXTS.primaryLabel}</span>
            <input
              type="password"
              class="ui-input ui-save-modal__input ui-credential-modal__input"
              maxlength="128"
              autocomplete="off"
              placeholder="${DEFAULT_TEXTS.primaryPlaceholder}"
            >
          </label>
          <label class="ui-credential-modal__field">
            <span class="ui-credential-modal__label">${DEFAULT_TEXTS.confirmLabel}</span>
            <input
              type="password"
              class="ui-input ui-save-modal__input ui-credential-modal__input"
              maxlength="128"
              autocomplete="off"
              placeholder="${DEFAULT_TEXTS.confirmPlaceholder}"
            >
          </label>
        </div>
        <div class="ui-credential-modal__errors" aria-live="polite">
          <p class="ui-save-modal__error ui-credential-modal__error" aria-hidden="true"></p>
          <p class="ui-save-modal__error ui-credential-modal__error" aria-hidden="true"></p>
        </div>
        <div class="ui-save-modal__actions">
          ${createButton({ className: "ui-save-modal__cancel", label: DEFAULT_TEXTS.cancelLabel, size: "compact" })}
          ${createButton({ className: "ui-save-modal__save", label: DEFAULT_TEXTS.saveLabel, size: "compact" })}
        </div>
      </section>
    `;

    this._title = this._query(".ui-save-modal__title");
    this._description = this._query(".ui-credential-modal__description");
    this._currentField = this._query(".ui-credential-modal__field--current");
    const inputs = this._overlay.querySelectorAll<HTMLInputElement>(".ui-credential-modal__input");
    const currentInput = inputs.item(0);
    const primaryInput = inputs.item(1);
    const confirmInput = inputs.item(2);
    if (
      !(currentInput instanceof HTMLInputElement) ||
      !(primaryInput instanceof HTMLInputElement) ||
      !(confirmInput instanceof HTMLInputElement)
    ) {
      throw new Error("Missing credential modal inputs.");
    }
    this._currentInput = currentInput;
    this._primaryInput = primaryInput;
    this._confirmInput = confirmInput;
    const errors = this._overlay.querySelectorAll<HTMLParagraphElement>(".ui-credential-modal__error");
    const currentError = errors.item(0);
    const primaryError = errors.item(1);
    const confirmError = errors.item(2);
    if (
      !(currentError instanceof HTMLParagraphElement) ||
      !(primaryError instanceof HTMLParagraphElement) ||
      !(confirmError instanceof HTMLParagraphElement)
    ) {
      throw new Error("Missing credential modal errors.");
    }
    this._currentError = currentError;
    this._primaryError = primaryError;
    this._confirmError = confirmError;
    this._saveButton = this._query(".ui-save-modal__save");
    this._cancelButton = this._query(".ui-save-modal__cancel");
    this._closeButton = this._query(".ui-save-modal__close");

    this._saveButton.addEventListener("click", this._handleSave);
    this._cancelButton.addEventListener("click", this._handleCancel);
    this._closeButton.addEventListener("click", this._handleCancel);
    this._overlay.addEventListener("click", this._handleOverlayClick);
    this._currentInput.addEventListener("keydown", this._handleInputKeyDown);
    this._primaryInput.addEventListener("keydown", this._handleInputKeyDown);
    this._confirmInput.addEventListener("keydown", this._handleInputKeyDown);

    root.append(this._overlay);
  }

  public open(
    texts: Partial<CredentialChangeModalTexts> = {},
    options: CredentialChangeModalOptions = {},
  ): Promise<string | null> {
    if (this._resolver) {
      this._resolver(null);
      this._resolver = null;
    }

    this._texts = {
      ...DEFAULT_TEXTS,
      ...texts,
    };
    this._requireCurrent = options.requireCurrent ?? false;
    this._validateCurrent = options.validateCurrent;
    this._validatePrimary = options.validatePrimary;

    this._previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this._overlay.hidden = false;
    this._overlay.classList.remove("is-closing");
    requestAnimationFrame(() => {
      this._overlay.classList.add("is-open");
    });

    this._title.textContent = this._texts.title;
    this._description.textContent = this._texts.description;
    this._description.hidden = this._texts.description.length === 0;
    this._currentField.hidden = !this._requireCurrent;
    this._currentInput.type = options.inputType ?? "password";
    this._primaryInput.type = options.inputType ?? "password";
    this._confirmInput.type = options.inputType ?? "password";
    this._currentInput.autocomplete = options.autocomplete ?? "off";
    this._primaryInput.autocomplete = options.autocomplete ?? "off";
    this._confirmInput.autocomplete = options.autocomplete ?? "off";
    this._currentInput.placeholder = this._texts.currentPlaceholder;
    this._primaryInput.placeholder = this._texts.primaryPlaceholder;
    this._confirmInput.placeholder = this._texts.confirmPlaceholder;
    this._currentInput.previousElementSibling?.replaceChildren(this._texts.currentLabel);
    this._primaryInput.previousElementSibling?.replaceChildren(this._texts.primaryLabel);
    this._confirmInput.previousElementSibling?.replaceChildren(this._texts.confirmLabel);
    this._saveButton.textContent = this._texts.saveLabel;
    this._cancelButton.textContent = this._texts.cancelLabel;
    this._closeButton.setAttribute("aria-label", this._texts.closeLabel);
    this._currentInput.value = "";
    this._primaryInput.value = "";
    this._confirmInput.value = "";
    this._setErrors("", "", "");
    (this._requireCurrent ? this._currentInput : this._primaryInput).focus();
    document.addEventListener("keydown", this._handleDocumentKeyDown);

    this._pendingPromise = new Promise<string | null>((resolve) => {
      this._resolver = resolve;
    });

    return this._pendingPromise;
  }

  public destroy(): void {
    document.removeEventListener("keydown", this._handleDocumentKeyDown);
    this._overlay.remove();
    this._resolver = null;
    this._pendingPromise = null;
  }

  private _query<T extends HTMLElement>(selector: string): T {
    const node = this._overlay.querySelector(selector);
    if (!node || !(node instanceof HTMLElement)) {
      throw new Error(`Missing modal element: ${selector}`);
    }

    return node as T;
  }

  private _handleOverlayClick = (event: MouseEvent): void => {
    if (event.target === this._overlay || (event.target as Element).classList.contains("ui-save-modal__backdrop")) {
      this._close(null);
    }
  };

  private _handleInputKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      this._handleSave();
    }
  };

  private _handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      this._close(null, { restoreFocus: false });
    }
  };

  private _handleCancel = (): void => {
    this._close(null);
  };

  private _handleSave = (): void => {
    const currentValue = this._currentInput.value.trim();
    const primaryValue = this._primaryInput.value.trim();
    const confirmValue = this._confirmInput.value.trim();
    let currentError = "";

    if (this._requireCurrent) {
      if (!currentValue) {
        currentError = this._texts.currentRequired;
      } else {
        currentError = this._validateCurrent?.(currentValue) ?? "";
      }
    }

    if (!primaryValue) {
      this._setErrors(currentError, this._texts.primaryRequired, "");
      return;
    }

    const primaryError = this._validatePrimary?.(primaryValue) ?? "";
    let confirmError = "";

    if (!confirmValue) {
      confirmError = this._texts.confirmRequired;
    } else if (primaryValue !== confirmValue) {
      confirmError = this._texts.mismatchMessage;
    }

    if (currentError || primaryError || confirmError) {
      this._setErrors(currentError, primaryError, confirmError);
      return;
    }

    this._setErrors("", "", "");
    this._close(primaryValue, { restoreFocus: false });
  };

  private _setErrors(currentMessage: string, primaryMessage: string, confirmMessage: string): void {
    const groupedMessages = [primaryMessage, confirmMessage].filter((message) => message.length > 0);
    const firstGroupedMessage = groupedMessages[0] ?? "";
    const secondGroupedMessage = groupedMessages[1] ?? "";

    this._currentError.textContent = currentMessage;
    this._currentError.setAttribute("aria-hidden", currentMessage.length === 0 ? "true" : "false");
    this._primaryError.textContent = firstGroupedMessage;
    this._primaryError.setAttribute("aria-hidden", firstGroupedMessage.length === 0 ? "true" : "false");
    this._confirmError.textContent = secondGroupedMessage;
    this._confirmError.setAttribute("aria-hidden", secondGroupedMessage.length === 0 ? "true" : "false");
  }

  private _close(value: string | null, options?: { restoreFocus?: boolean }): void {
    const shouldRestoreFocus = options?.restoreFocus ?? true;
    const resolve = this._resolver;
    this._resolver = null;
    document.removeEventListener("keydown", this._handleDocumentKeyDown);

    if (this._overlay.hidden) {
      if (resolve) {
        this._pendingPromise = null;
        resolve(value);
      }
      return;
    }

    this._overlay.classList.remove("is-open");
    this._overlay.classList.add("is-closing");

    let didFinish = false;
    const finish = (): void => {
      if (didFinish) {
        return;
      }

      didFinish = true;
      this._overlay.hidden = true;
      this._overlay.classList.remove("is-closing");

      if (this._pendingPromise && resolve) {
        this._pendingPromise = null;
        resolve(value);
      } else {
        this._pendingPromise = null;
      }

      if (shouldRestoreFocus) {
        this._previouslyFocused?.focus();
      }
    };

    this._overlay.addEventListener("animationend", finish, { once: true });
    window.setTimeout(finish, 220);
  }
}

export default CredentialChangeModal;
