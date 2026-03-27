import { LOGIN_ROUTE } from "@app/routes";
import { getUserAvatarOption, USER_AVATAR_OPTIONS } from "@assets/icons/userAvatars";
import { queryAll } from "@helpers/dom";
import LocalCredentialService from "@services/LocalCredentialService";
import SessionService from "@services/SessionService";
import { APP_TEXTS, AUTH_VALIDATION_TEXTS } from "@texts";
import CredentialChangeModal from "@ui/lib/CredentialChangeModal";
import WorkspaceUserMenu from "@ui/lib/WorkspaceUserMenu";
import {
  getCurrentRecoveryPassphraseValidationError,
  getPasswordValidationError,
  getRecoveryPassphraseValidationError,
  getUsernameValidationError,
} from "./authValidation";
import { createSettingsView } from "./html";

import type { AppPath } from "@navigation/NavigationAdapter";
import type { RouteContext, Screen } from "@router/Screen";

const SETTINGS_SAVE_STATUS_DURATION_MS = 2500;

export class SettingsView implements Screen {
  private _root?: HTMLElement;
  private _logoutButton?: HTMLButtonElement;
  private _changePassphraseButton?: HTMLButtonElement;
  private _changePasswordButton?: HTMLButtonElement;
  private _saveChangesButton?: HTMLButtonElement;
  private _usernameInput?: HTMLInputElement;
  private _usernameMessage?: HTMLElement;
  private _recoveryMessage?: HTMLElement;
  private _passwordMessage?: HTMLElement;
  private _saveStatus?: HTMLElement;
  private _menuUsername?: HTMLElement;
  private _menuMetaUsername?: HTMLElement;
  private _menuAvatar?: HTMLElement;
  private _avatarButtons: HTMLButtonElement[] = [];
  private _userMenu?: WorkspaceUserMenu;
  private readonly _credentials = new LocalCredentialService();
  private readonly _session = new SessionService();
  private readonly _passphraseModal = new CredentialChangeModal();
  private readonly _passwordModal = new CredentialChangeModal();
  private _savedUsername = this._session.getUsernameOrFallback();
  private _savedAvatarId = this._session.getAvatarIdOrFallback();
  private _draftAvatarId = this._savedAvatarId;
  private _saveStatusTimeoutId?: number;

  constructor(private readonly _navigate: (path: AppPath) => Promise<void>) {}

  public mount(container: HTMLElement): void {
    const htmlHost = document.createElement("div");
    htmlHost.innerHTML = createSettingsView(this._savedUsername, this._draftAvatarId, this._createAvatarGridMarkup());
    this._root = htmlHost.firstElementChild as HTMLElement;
    container.replaceChildren(this._root);
    this._logoutButton = this._root.querySelector<HTMLButtonElement>(".settings-logout") ?? undefined;
    this._changePassphraseButton =
      this._root.querySelector<HTMLButtonElement>(".settings-change-passphrase") ?? undefined;
    this._changePasswordButton = this._root.querySelector<HTMLButtonElement>(".settings-change-password") ?? undefined;
    this._saveChangesButton = this._root.querySelector<HTMLButtonElement>(".settings-save-changes") ?? undefined;
    this._usernameInput = this._root.querySelector<HTMLInputElement>(".settings-username-input") ?? undefined;
    this._usernameMessage = this._root.querySelector<HTMLElement>(".settings-username-message") ?? undefined;
    this._recoveryMessage = this._root.querySelector<HTMLElement>(".settings-recovery-message") ?? undefined;
    this._passwordMessage = this._root.querySelector<HTMLElement>(".settings-password-message") ?? undefined;
    this._saveStatus = this._root.querySelector<HTMLElement>(".settings-panel__status") ?? undefined;
    this._menuUsername = this._root.querySelector<HTMLElement>(".workspace-user-menu__name") ?? undefined;
    this._menuMetaUsername = this._root.querySelector<HTMLElement>(".workspace-user-menu__meta-value") ?? undefined;
    this._menuAvatar = this._root.querySelector<HTMLElement>(".workspace-user-menu__avatar") ?? undefined;
    this._avatarButtons = queryAll<HTMLButtonElement>("[data-avatar-id]", this._root);
    this._userMenu = new WorkspaceUserMenu({
      root: this._root,
      onLogout: this._onLogout,
    });
    this._syncSaveButtonState();
  }

  public enter(_context: RouteContext): void {
    document.title = `${APP_TEXTS.document.title} | ${APP_TEXTS.settings.title}`;
    this._logoutButton?.addEventListener("click", this._onLogout);
    this._changePassphraseButton?.addEventListener("click", this._onChangePassphrase);
    this._changePasswordButton?.addEventListener("click", this._onChangePassword);
    this._saveChangesButton?.addEventListener("click", this._onSaveChanges);
    this._usernameInput?.addEventListener("input", this._onUsernameInput);

    for (const button of this._avatarButtons) {
      button.addEventListener("click", this._onAvatarSelect);
    }
  }

  public leave(): void {
    this._logoutButton?.removeEventListener("click", this._onLogout);
    this._changePassphraseButton?.removeEventListener("click", this._onChangePassphrase);
    this._changePasswordButton?.removeEventListener("click", this._onChangePassword);
    this._saveChangesButton?.removeEventListener("click", this._onSaveChanges);
    this._usernameInput?.removeEventListener("input", this._onUsernameInput);

    for (const button of this._avatarButtons) {
      button.removeEventListener("click", this._onAvatarSelect);
    }
  }

  public destroy(): void {
    this._clearSaveStatusTimeout();
    this._userMenu?.destroy();
    this._passphraseModal.destroy();
    this._passwordModal.destroy();
    this._logoutButton = undefined;
    this._changePassphraseButton = undefined;
    this._changePasswordButton = undefined;
    this._saveChangesButton = undefined;
    this._usernameInput = undefined;
    this._usernameMessage = undefined;
    this._recoveryMessage = undefined;
    this._passwordMessage = undefined;
    this._saveStatus = undefined;
    this._menuUsername = undefined;
    this._menuMetaUsername = undefined;
    this._menuAvatar = undefined;
    this._avatarButtons = [];
    this._userMenu = undefined;
    this._root = undefined;
  }

  private _createAvatarGridMarkup(): string {
    return USER_AVATAR_OPTIONS.map((option) => {
      const selectedClass = option.id === this._draftAvatarId ? " is-selected" : "";

      return `
        <button
          type="button"
          class="settings-avatar-option${selectedClass}"
          data-avatar-id="${option.id}"
          aria-label="${option.label}"
          aria-pressed="${option.id === this._draftAvatarId ? "true" : "false"}"
        >
          <span class="settings-avatar-option__icon" aria-hidden="true">${option.svg}</span>
        </button>
      `;
    }).join("");
  }

  private _onSaveChanges = (): void => {
    if (!this._usernameInput) {
      return;
    }

    if (!this._hasPendingChanges()) {
      return;
    }

    const nextUsername = this._usernameInput.value.trim();
    const errorMessage = getUsernameValidationError(nextUsername);
    if (errorMessage) {
      this._setMessage(this._usernameMessage, errorMessage);
      this._usernameInput.setAttribute("aria-invalid", "true");
      this._usernameInput.focus();
      this._clearSaveStatus();
      return;
    }

    this._savedUsername = nextUsername;
    this._savedAvatarId = this._draftAvatarId;
    this._session.setUsername(nextUsername);
    this._session.setAvatarId(this._savedAvatarId);
    this._syncUsername(nextUsername);
    this._syncHeaderAvatar(this._savedAvatarId);
    this._usernameInput.removeAttribute("aria-invalid");
    this._usernameInput.value = nextUsername;
    this._setMessage(this._usernameMessage, "");
    this._showTransientSaveStatus(APP_TEXTS.settings.changesSaved);
    this._syncSaveButtonState();
  };

  private _onUsernameInput = (): void => {
    if (this._usernameInput) {
      this._usernameInput.removeAttribute("aria-invalid");
    }

    this._setMessage(this._usernameMessage, "");
    this._clearSaveStatus();
    this._syncSaveButtonState();
  };

  private _hasPendingChanges(): boolean {
    const nextUsername = this._usernameInput?.value.trim() ?? this._savedUsername;
    return nextUsername !== this._savedUsername || this._draftAvatarId !== this._savedAvatarId;
  }

  private _syncSaveButtonState(): void {
    if (this._saveChangesButton) {
      const hasPendingChanges = this._hasPendingChanges();
      this._saveChangesButton.disabled = !hasPendingChanges;
      this._saveChangesButton.toggleAttribute("data-pending-changes", hasPendingChanges);
    }
  }

  private _showTransientSaveStatus(message: string): void {
    this._clearSaveStatusTimeout();
    this._setMessage(this._saveStatus, message);
    this._saveStatusTimeoutId = window.setTimeout(() => {
      this._setMessage(this._saveStatus, "");
      this._saveStatusTimeoutId = undefined;
    }, SETTINGS_SAVE_STATUS_DURATION_MS);
  }

  private _clearSaveStatusTimeout(): void {
    if (this._saveStatusTimeoutId !== undefined) {
      window.clearTimeout(this._saveStatusTimeoutId);
      this._saveStatusTimeoutId = undefined;
    }
  }

  private _clearSaveStatus(): void {
    this._clearSaveStatusTimeout();
    this._setMessage(this._saveStatus, "");
  }

  private _clearCredentialMessages(): void {
    this._setMessage(this._recoveryMessage, "");
    this._setMessage(this._passwordMessage, "");
  }

  private _onChangePassphrase = async (): Promise<void> => {
    this._clearCredentialMessages();

    const passphrase = await this._passphraseModal.open(
      {
        title: "Change passphrase",
        description: "Set a new recovery passphrase for this local demo flow.",
        currentLabel: "Current passphrase",
        currentPlaceholder: "Enter your current recovery passphrase",
        currentRequired: AUTH_VALIDATION_TEXTS.recoveryPassphrase.currentRequired,
        currentInvalid: AUTH_VALIDATION_TEXTS.recoveryPassphrase.currentInvalid,
        primaryLabel: "New passphrase",
        primaryPlaceholder: "Enter a new recovery passphrase",
        confirmLabel: "Confirm passphrase",
        confirmPlaceholder: "Repeat the new recovery passphrase",
        saveLabel: "save",
        cancelLabel: "cancel",
        primaryRequired: AUTH_VALIDATION_TEXTS.recoveryPassphrase.required,
        confirmRequired: AUTH_VALIDATION_TEXTS.recoveryPassphrase.confirmRequired,
        mismatchMessage: AUTH_VALIDATION_TEXTS.recoveryPassphrase.mismatch,
      },
      {
        inputType: "password",
        autocomplete: "off",
        requireCurrent: true,
        validateCurrent: (value) =>
          getCurrentRecoveryPassphraseValidationError(value, this._credentials.getRecoveryPassphrase()),
        validatePrimary: getRecoveryPassphraseValidationError,
      },
    );

    if (passphrase === null) {
      return;
    }

    this._credentials.setRecoveryPassphrase(passphrase);
    this._setMessage(this._recoveryMessage, APP_TEXTS.settings.recovery.changed);
  };

  private _onChangePassword = async (): Promise<void> => {
    this._clearCredentialMessages();

    const password = await this._passwordModal.open(
      {
        title: "Change password",
        description: "Update the studio password used by the current local demo flow.",
        primaryLabel: "New password",
        primaryPlaceholder: "Enter a new password",
        confirmLabel: "Confirm password",
        confirmPlaceholder: "Repeat the new password",
        saveLabel: "save",
        cancelLabel: "cancel",
        primaryRequired: AUTH_VALIDATION_TEXTS.password.required,
        confirmRequired: AUTH_VALIDATION_TEXTS.password.confirmRequired,
        mismatchMessage: AUTH_VALIDATION_TEXTS.password.mismatch,
      },
      {
        inputType: "password",
        autocomplete: "new-password",
        validatePrimary: getPasswordValidationError,
      },
    );

    if (password === null) {
      return;
    }

    this._credentials.setPassword(password);
    this._setMessage(this._passwordMessage, APP_TEXTS.settings.password.changed);
  };

  private _onAvatarSelect = (event: Event): void => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const avatarId = button.dataset.avatarId;
    if (!avatarId) {
      return;
    }

    this._draftAvatarId = avatarId;
    this._syncAvatarSelection();
    this._clearSaveStatus();
    this._syncSaveButtonState();
  };

  private _syncUsername(username: string): void {
    if (this._menuUsername) {
      this._menuUsername.textContent = username;
    }

    if (this._menuMetaUsername) {
      this._menuMetaUsername.textContent = username;
    }
  }

  private _syncAvatarSelection(): void {
    for (const button of this._avatarButtons) {
      const isSelected = button.dataset.avatarId === this._draftAvatarId;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    }
  }

  private _syncHeaderAvatar(avatarId: string): void {
    if (!this._menuAvatar) {
      return;
    }

    const avatar = getUserAvatarOption(avatarId);
    this._menuAvatar.innerHTML = avatar.svg;
    this._menuAvatar.setAttribute("data-session-avatar-id", avatar.id);
  }

  private _setMessage(target: HTMLElement | undefined, message: string): void {
    if (target) {
      target.textContent = message;
    }
  }

  private _onLogout = (): void => {
    this._session.clear();
    void this._navigate(LOGIN_ROUTE);
  };
}
