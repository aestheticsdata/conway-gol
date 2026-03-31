import { SIMULATION_ROUTE } from "@app/routes";
import AuthService from "@services/AuthService";
import { authSessionService } from "@services/AuthSessionService";
import AccountRecoveryModal from "@ui/lib/AccountRecoveryModal";
import { AuthPageView } from "./AuthPageView";
import { createLoginView } from "./html";

import type { AppPath } from "@navigation/NavigationAdapter";

export class LoginView extends AuthPageView {
  private readonly _auth = new AuthService();
  private readonly _recoveryModal = new AccountRecoveryModal(this._auth);
  private _forgotLink?: HTMLAnchorElement;
  private _guestButton?: HTMLButtonElement;
  private _usernameField?: HTMLInputElement;
  private _clearUsernameButton?: HTMLButtonElement;

  constructor(private readonly _navigate: (path: AppPath) => Promise<void>) {
    super({
      documentTitle: "Login",
      render: () => createLoginView(),
      onSubmit: async (form) => {
        const usernameField = form.querySelector<HTMLInputElement>('input[name="username"]');
        const passwordField = form.querySelector<HTMLInputElement>('input[name="password"]');
        const errorEl = form.querySelector<HTMLElement>("[data-auth-error]");
        const submitBtn = form.querySelector<HTMLButtonElement>('[type="submit"]');

        if (errorEl) errorEl.textContent = "";
        if (submitBtn) submitBtn.disabled = true;

        try {
          const authUser = await this._auth.login(usernameField?.value.trim() ?? "", passwordField?.value ?? "");
          authSessionService.setAuthenticatedUser(authUser);
          await this._navigate(SIMULATION_ROUTE);
        } catch (error: unknown) {
          const status = (error as { response?: { status?: number } })?.response?.status;

          if (errorEl) {
            errorEl.textContent =
              status === 401
                ? "Invalid username or password."
                : "Login unavailable. Check that the API server is running.";
          }

          if (submitBtn) submitBtn.disabled = false;
        }
      },
    });
  }

  public override mount(container: HTMLElement): void {
    super.mount(container);
    this._forgotLink = container.querySelector<HTMLAnchorElement>("[data-forgot-password]") ?? undefined;
    this._guestButton = container.querySelector<HTMLButtonElement>("[data-continue-as-guest]") ?? undefined;
    this._usernameField = container.querySelector<HTMLInputElement>('input[name="username"]') ?? undefined;
    this._clearUsernameButton =
      container.querySelector<HTMLButtonElement>('[data-auth-clear-field="username"]') ?? undefined;
  }

  public override enter(context: Parameters<AuthPageView["enter"]>[0]): void {
    super.enter(context);
    this._forgotLink?.addEventListener("click", this._onForgotPassword);
    this._guestButton?.addEventListener("click", this._onContinueAsGuest);
    this._usernameField?.addEventListener("input", this._onUsernameInput);
    this._usernameField?.addEventListener("change", this._onUsernameInput);
    this._clearUsernameButton?.addEventListener("click", this._onClearUsernameClick);
    this._syncUsernameFieldChrome();
  }

  public override leave(): void {
    this._forgotLink?.removeEventListener("click", this._onForgotPassword);
    this._guestButton?.removeEventListener("click", this._onContinueAsGuest);
    this._usernameField?.removeEventListener("input", this._onUsernameInput);
    this._usernameField?.removeEventListener("change", this._onUsernameInput);
    this._clearUsernameButton?.removeEventListener("click", this._onClearUsernameClick);
    super.leave();
  }

  public override destroy(): void {
    this._recoveryModal.destroy();
    this._forgotLink = undefined;
    this._guestButton = undefined;
    this._usernameField = undefined;
    this._clearUsernameButton = undefined;
    super.destroy();
  }

  private _onForgotPassword = (event: Event): void => {
    event.preventDefault();
    void this._runForgotFlow();
  };

  private _onContinueAsGuest = (): void => {
    authSessionService.setGuest();
    void this._navigate(SIMULATION_ROUTE);
  };

  private _onUsernameInput = (): void => {
    this._syncUsernameFieldChrome();
  };

  private _onClearUsernameClick = (): void => {
    if (!this._usernameField) {
      return;
    }

    this._usernameField.value = "";
    this._usernameField.focus({ preventScroll: true });
    this._usernameField.dispatchEvent(new Event("input", { bubbles: true }));
  };

  private _syncUsernameFieldChrome(): void {
    const value = this._usernameField?.value ?? "";
    const hasUsername = value.trim().length > 0;

    if (this._guestButton) {
      this._guestButton.disabled = hasUsername;
    }

    if (this._clearUsernameButton) {
      this._clearUsernameButton.hidden = value.length === 0;
    }
  }

  private _runForgotFlow = async (): Promise<void> => {
    const user = await this._recoveryModal.open();
    if (!user) return;

    authSessionService.setAuthenticatedUser(user);
    await this._navigate(SIMULATION_ROUTE);
  };
}
