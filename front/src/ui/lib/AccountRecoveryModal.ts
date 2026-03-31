import { CLOSE_ICON } from "@assets/icons/closeIcon";
import { createButton } from "@ui/components/button/createButton";
import {
  getPasswordConfirmationValidationError,
  getPasswordValidationError,
  getRecoveryPassphraseValidationError,
  getUsernameValidationError,
} from "@views/authValidation";

import type AuthService from "@services/AuthService";
import type { AuthUser } from "@services/AuthService";

type AccountRecoveryModalTexts = {
  cancelLabel: string;
  closeLabel: string;
  confirmNewPasswordLabel: string;
  confirmNewPasswordPlaceholder: string;
  description: string;
  newPasswordLabel: string;
  newPasswordPlaceholder: string;
  passphraseLabel: string;
  passphrasePlaceholder: string;
  submitLabel: string;
  title: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  verifyLabel: string;
};

const DEFAULT_TEXTS: AccountRecoveryModalTexts = {
  cancelLabel: "cancel",
  closeLabel: "close",
  confirmNewPasswordLabel: "Confirm new password",
  confirmNewPasswordPlaceholder: "Repeat new password",
  description: "Enter your username and recovery passphrase, then set a new password.",
  newPasswordLabel: "New password",
  newPasswordPlaceholder: "New password",
  passphraseLabel: "Recovery passphrase",
  passphrasePlaceholder: "Recovery passphrase",
  submitLabel: "Submit",
  title: "Account recovery",
  usernameLabel: "Username",
  usernamePlaceholder: "Username",
  verifyLabel: "Verify passphrase",
};

const VERIFY_ERROR = "Invalid username or recovery passphrase.";
const RESET_ERROR = "Could not reset your password. Please try again.";

class AccountRecoveryModal {
  private readonly _overlay: HTMLDivElement;
  private readonly _title: HTMLHeadingElement;
  private readonly _description: HTMLParagraphElement;
  private readonly _usernameInput: HTMLInputElement;
  private readonly _passphraseInput: HTMLInputElement;
  private readonly _newPasswordInput: HTMLInputElement;
  private readonly _confirmPasswordInput: HTMLInputElement;
  private readonly _message: HTMLParagraphElement;
  private readonly _verifyButton: HTMLButtonElement;
  private readonly _submitButton: HTMLButtonElement;
  private readonly _cancelButton: HTMLButtonElement;
  private readonly _closeButton: HTMLButtonElement;
  private readonly _auth: AuthService;
  private _resolver: ((value: AuthUser | null) => void) | null = null;
  private _pendingPromise: Promise<AuthUser | null> | null = null;
  private _previouslyFocused: HTMLElement | null = null;
  private _texts: AccountRecoveryModalTexts = DEFAULT_TEXTS;
  private _verified = false;

  constructor(auth: AuthService, root: HTMLElement = document.body) {
    this._auth = auth;
    this._overlay = document.createElement("div");
    this._overlay.className = "ui-save-modal ui-credential-modal ui-account-recovery-modal";
    this._overlay.hidden = true;
    this._overlay.innerHTML = `
      <div class="ui-save-modal__backdrop"></div>
      <section
        class="ui-save-modal__dialog ui-credential-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ui-account-recovery-modal-title"
      >
        <div class="ui-save-modal__header">
          <h2 id="ui-account-recovery-modal-title" class="ui-save-modal__title">${DEFAULT_TEXTS.title}</h2>
          <button type="button" class="ui-save-modal__close" aria-label="${DEFAULT_TEXTS.closeLabel}">
            <span aria-hidden="true">${CLOSE_ICON}</span>
          </button>
        </div>
        <p class="ui-credential-modal__description">${DEFAULT_TEXTS.description}</p>
        <div class="ui-credential-modal__fields">
          <label class="ui-credential-modal__field">
            <span class="ui-credential-modal__label">${DEFAULT_TEXTS.usernameLabel}</span>
            <input
              type="text"
              class="ui-input ui-save-modal__input ui-credential-modal__input"
              maxlength="24"
              autocomplete="username"
              placeholder="${DEFAULT_TEXTS.usernamePlaceholder}"
            >
          </label>
          <label class="ui-credential-modal__field">
            <span class="ui-credential-modal__label">${DEFAULT_TEXTS.passphraseLabel}</span>
            <input
              type="password"
              class="ui-input ui-save-modal__input ui-credential-modal__input"
              maxlength="128"
              autocomplete="off"
              placeholder="${DEFAULT_TEXTS.passphrasePlaceholder}"
            >
          </label>
        </div>
        <div class="ui-account-recovery-modal__verify-actions">
          ${createButton({
            className: "ui-account-recovery-modal__verify ui-save-modal__save",
            label: DEFAULT_TEXTS.verifyLabel,
            size: "compact",
          })}
        </div>
        <div class="ui-account-recovery-modal__password-section">
          <div class="ui-credential-modal__fields">
            <label class="ui-credential-modal__field">
              <span class="ui-credential-modal__label">${DEFAULT_TEXTS.newPasswordLabel}</span>
              <input
                type="password"
                class="ui-input ui-save-modal__input ui-credential-modal__input"
                maxlength="128"
                autocomplete="new-password"
                placeholder="${DEFAULT_TEXTS.newPasswordPlaceholder}"
                disabled
              >
            </label>
            <label class="ui-credential-modal__field">
              <span class="ui-credential-modal__label">${DEFAULT_TEXTS.confirmNewPasswordLabel}</span>
              <input
                type="password"
                class="ui-input ui-save-modal__input ui-credential-modal__input"
                maxlength="128"
                autocomplete="new-password"
                placeholder="${DEFAULT_TEXTS.confirmNewPasswordPlaceholder}"
                disabled
              >
            </label>
          </div>
        </div>
        <p class="ui-save-modal__error ui-account-recovery-modal__message" aria-live="polite" aria-hidden="true"></p>
        <div class="ui-save-modal__actions">
          ${createButton({ className: "ui-save-modal__cancel", label: DEFAULT_TEXTS.cancelLabel, size: "compact" })}
          ${createButton({
            className: "ui-save-modal__save ui-account-recovery-modal__submit",
            label: DEFAULT_TEXTS.submitLabel,
            size: "compact",
            disabled: true,
          })}
        </div>
      </section>
    `;

    this._title = this._query(".ui-save-modal__title");
    this._description = this._query(".ui-credential-modal__description");
    const inputs = this._overlay.querySelectorAll<HTMLInputElement>(".ui-credential-modal__input");
    const u = inputs.item(0);
    const p = inputs.item(1);
    const n = inputs.item(2);
    const c = inputs.item(3);
    if (!(u instanceof HTMLInputElement) || !(p instanceof HTMLInputElement)) {
      throw new Error("Missing account recovery modal inputs.");
    }
    this._usernameInput = u;
    this._passphraseInput = p;
    if (!(n instanceof HTMLInputElement) || !(c instanceof HTMLInputElement)) {
      throw new Error("Missing account recovery password inputs.");
    }
    this._newPasswordInput = n;
    this._confirmPasswordInput = c;
    this._message = this._query(".ui-account-recovery-modal__message");
    this._verifyButton = this._query(".ui-account-recovery-modal__verify");
    this._submitButton = this._query(".ui-account-recovery-modal__submit");
    this._cancelButton = this._query(".ui-save-modal__cancel");
    this._closeButton = this._query(".ui-save-modal__close");

    this._verifyButton.addEventListener("click", this._handleVerify);
    this._submitButton.addEventListener("click", this._handleSubmit);
    this._cancelButton.addEventListener("click", this._handleCancel);
    this._closeButton.addEventListener("click", this._handleCancel);
    this._overlay.addEventListener("click", this._handleOverlayClick);
    this._usernameInput.addEventListener("keydown", this._handleInputKeyDown);
    this._passphraseInput.addEventListener("keydown", this._handleInputKeyDown);
    this._newPasswordInput.addEventListener("keydown", this._handleInputKeyDown);
    this._confirmPasswordInput.addEventListener("keydown", this._handleInputKeyDown);

    root.append(this._overlay);
  }

  public open(texts: Partial<AccountRecoveryModalTexts> = {}): Promise<AuthUser | null> {
    if (this._resolver) {
      this._resolver(null);
      this._resolver = null;
    }

    this._texts = { ...DEFAULT_TEXTS, ...texts };
    this._verified = false;
    this._resetFormState();

    this._title.textContent = this._texts.title;
    this._description.textContent = this._texts.description;
    this._usernameInput.placeholder = this._texts.usernamePlaceholder;
    this._passphraseInput.placeholder = this._texts.passphrasePlaceholder;
    this._newPasswordInput.placeholder = this._texts.newPasswordPlaceholder;
    this._confirmPasswordInput.placeholder = this._texts.confirmNewPasswordPlaceholder;
    this._usernameInput.previousElementSibling?.replaceChildren(this._texts.usernameLabel);
    this._passphraseInput.previousElementSibling?.replaceChildren(this._texts.passphraseLabel);
    this._newPasswordInput.previousElementSibling?.replaceChildren(this._texts.newPasswordLabel);
    this._confirmPasswordInput.previousElementSibling?.replaceChildren(this._texts.confirmNewPasswordLabel);
    this._verifyButton.textContent = this._texts.verifyLabel;
    this._submitButton.textContent = this._texts.submitLabel;
    this._cancelButton.textContent = this._texts.cancelLabel;
    this._closeButton.setAttribute("aria-label", this._texts.closeLabel);

    this._previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this._overlay.hidden = false;
    this._overlay.classList.remove("is-closing");
    requestAnimationFrame(() => {
      this._overlay.classList.add("is-open");
    });

    this._usernameInput.focus();
    document.addEventListener("keydown", this._handleDocumentKeyDown);

    this._pendingPromise = new Promise<AuthUser | null>((resolve) => {
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

  private _resetFormState(): void {
    this._usernameInput.value = "";
    this._passphraseInput.value = "";
    this._usernameInput.disabled = false;
    this._passphraseInput.disabled = false;
    this._verifyButton.disabled = false;
    this._newPasswordInput.disabled = true;
    this._confirmPasswordInput.disabled = true;
    this._newPasswordInput.value = "";
    this._confirmPasswordInput.value = "";
    this._submitButton.disabled = true;
    this._clearMessage();
  }

  private _setMessage(text: string): void {
    this._message.textContent = text;
    this._message.setAttribute("aria-hidden", text.length === 0 ? "true" : "false");
  }

  private _clearMessage(): void {
    this._setMessage("");
  }

  private _handleOverlayClick = (event: MouseEvent): void => {
    if (event.target === this._overlay || (event.target as Element).classList.contains("ui-save-modal__backdrop")) {
      this._close(null);
    }
  };

  private _handleInputKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!this._verified) {
        void this._handleVerify();
      } else {
        void this._handleSubmit();
      }
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

  private _handleVerify = async (): Promise<void> => {
    if (this._verified) return;

    this._clearMessage();
    const username = this._usernameInput.value.trim();
    const passphrase = this._passphraseInput.value;

    const usernameError = getUsernameValidationError(username);
    if (usernameError) {
      this._setMessage(usernameError);
      return;
    }

    const passphraseError = getRecoveryPassphraseValidationError(passphrase);
    if (passphraseError) {
      this._setMessage(passphraseError);
      return;
    }

    this._verifyButton.disabled = true;
    try {
      await this._auth.verifyPassphrase(username, passphrase);
    } catch {
      this._setMessage(VERIFY_ERROR);
      this._verifyButton.disabled = false;
      return;
    }

    this._verified = true;
    this._usernameInput.disabled = true;
    this._passphraseInput.disabled = true;
    this._verifyButton.disabled = true;
    this._newPasswordInput.disabled = false;
    this._confirmPasswordInput.disabled = false;
    this._submitButton.disabled = false;
    this._newPasswordInput.focus();
  };

  private _handleSubmit = async (): Promise<void> => {
    if (!this._verified) return;

    this._clearMessage();
    const newPassword = this._newPasswordInput.value;
    const confirm = this._confirmPasswordInput.value;

    const pwError = getPasswordValidationError(newPassword);
    if (pwError) {
      this._setMessage(pwError);
      return;
    }

    const confirmError = getPasswordConfirmationValidationError(newPassword, confirm);
    if (confirmError) {
      this._setMessage(confirmError);
      return;
    }

    this._submitButton.disabled = true;
    try {
      const user = await this._auth.resetPassword(newPassword);
      this._close(user, { restoreFocus: false });
    } catch {
      this._setMessage(RESET_ERROR);
      this._submitButton.disabled = false;
    }
  };

  private _close(value: AuthUser | null, options?: { restoreFocus?: boolean }): void {
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
      if (didFinish) return;
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

export default AccountRecoveryModal;
