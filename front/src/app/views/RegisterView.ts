import { SIMULATION_ROUTE } from "@app/routes";
import AuthService from "@services/AuthService";
import { authSessionService } from "@services/AuthSessionService";
import SessionService from "@services/SessionService";
import { AuthPageView } from "./AuthPageView";
import {
  getPasswordConfirmationValidationError,
  getPasswordValidationError,
  getRecoveryPassphraseConfirmationValidationError,
  getRecoveryPassphraseValidationError,
  getUsernameValidationError,
} from "./authValidation";
import { createRegisterView } from "./html";

import type { AppPath } from "@navigation/NavigationAdapter";

const REGISTER_FIELD_NAMES = [
  "username",
  "password",
  "passwordConfirmation",
  "recoveryPassphrase",
  "recoveryPassphraseConfirmation",
] as const;

type RegisterFieldName = (typeof REGISTER_FIELD_NAMES)[number];

type RegisterFields = Record<RegisterFieldName, HTMLInputElement>;
type RegisterFieldInteractionState = Record<RegisterFieldName, { touched: boolean }>;

function createRegisterFieldInteractionState(): RegisterFieldInteractionState {
  return {
    username: { touched: false },
    password: { touched: false },
    passwordConfirmation: { touched: false },
    recoveryPassphrase: { touched: false },
    recoveryPassphraseConfirmation: { touched: false },
  };
}

export class RegisterView extends AuthPageView {
  private _registerForm?: HTMLFormElement;
  private _fields?: RegisterFields;
  private _isValidationBound = false;
  private _fieldInteractionState = createRegisterFieldInteractionState();
  private readonly _auth = new AuthService();
  private readonly _session = new SessionService();

  constructor(navigate: (path: AppPath) => Promise<void>) {
    super({
      documentTitle: "Register",
      render: createRegisterView,
      onSubmit: async (form) => {
        const fields = this._fields ?? this._resolveFields(form);
        if (!fields) {
          return;
        }

        this._fields = fields;

        const errors = this._collectFieldErrors();
        const firstInvalidFieldName = REGISTER_FIELD_NAMES.find((fieldName) => Boolean(errors[fieldName]));
        if (firstInvalidFieldName) {
          this._fieldInteractionState[firstInvalidFieldName].touched = true;
          this._renderFieldState(firstInvalidFieldName);
          this._renderRelatedFieldStates(firstInvalidFieldName);
          fields[firstInvalidFieldName].focus();
          return;
        }

        const errorEl = form.querySelector<HTMLElement>("[data-auth-error]");
        const submitBtn = form.querySelector<HTMLButtonElement>('[type="submit"]');

        if (errorEl) errorEl.textContent = "";
        if (submitBtn) submitBtn.disabled = true;

        try {
          const authUser = await this._auth.register(
            fields.username.value.trim(),
            fields.password.value,
            fields.recoveryPassphrase.value,
          );
          authSessionService.setAuthenticatedUser(authUser);
          this._session.setUsername(authUser.username);
          await navigate(SIMULATION_ROUTE);
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (errorEl) {
            errorEl.textContent =
              status === 409 ? "Username or email already taken." : "Registration failed. Please try again.";
          }
          if (submitBtn) submitBtn.disabled = false;
        }
      },
    });
  }

  public override mount(container: HTMLElement): void {
    super.mount(container);
    this._registerForm = container.querySelector<HTMLFormElement>(".auth-form") ?? undefined;
    this._fields = this._registerForm ? this._resolveFields(this._registerForm) : undefined;

    if (!this._fields) {
      return;
    }

    this._resetValidationState();
  }

  public override enter(context: Parameters<AuthPageView["enter"]>[0]): void {
    super.enter(context);

    if (!this._fields || this._isValidationBound) {
      return;
    }

    for (const fieldName of REGISTER_FIELD_NAMES) {
      const field = this._fields[fieldName];
      field.addEventListener("input", this._onFieldInput);
      field.addEventListener("blur", this._onFieldBlur);
    }

    this._isValidationBound = true;
  }

  public override leave(): void {
    this._unbindValidation();
    super.leave();
  }

  public override destroy(): void {
    this._unbindValidation();
    this._fields = undefined;
    this._registerForm = undefined;
    super.destroy();
  }

  private _resolveFields(form: HTMLFormElement): RegisterFields | undefined {
    const resolvedFields = REGISTER_FIELD_NAMES.map((fieldName) =>
      form.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`),
    );

    if (resolvedFields.some((field) => !field)) {
      return undefined;
    }

    return Object.fromEntries(
      REGISTER_FIELD_NAMES.map((fieldName, index) => [fieldName, resolvedFields[index]]),
    ) as RegisterFields;
  }

  private _unbindValidation(): void {
    if (!this._fields || !this._isValidationBound) {
      return;
    }

    for (const fieldName of REGISTER_FIELD_NAMES) {
      const field = this._fields[fieldName];
      field.removeEventListener("input", this._onFieldInput);
      field.removeEventListener("blur", this._onFieldBlur);
    }

    this._isValidationBound = false;
  }

  private _resetValidationState(): void {
    this._fieldInteractionState = createRegisterFieldInteractionState();

    for (const fieldName of REGISTER_FIELD_NAMES) {
      this._setFieldState(fieldName, "");
    }
  }

  private _onFieldInput = (event: Event): void => {
    const field = event.currentTarget;
    if (!(field instanceof HTMLInputElement)) {
      return;
    }

    const fieldName = field.name as RegisterFieldName;
    if (!REGISTER_FIELD_NAMES.includes(fieldName)) {
      return;
    }

    this._renderFieldState(fieldName);
    this._renderRelatedFieldStates(fieldName);
  };

  private _onFieldBlur = (event: Event): void => {
    const field = event.currentTarget;
    if (!(field instanceof HTMLInputElement)) {
      return;
    }

    const fieldName = field.name as RegisterFieldName;
    if (!REGISTER_FIELD_NAMES.includes(fieldName)) {
      return;
    }

    this._fieldInteractionState[fieldName].touched = true;
    this._renderFieldState(fieldName);
    this._renderRelatedFieldStates(fieldName);
  };

  private _collectFieldErrors(): Partial<Record<RegisterFieldName, string>> {
    const errors: Partial<Record<RegisterFieldName, string>> = {};

    for (const fieldName of REGISTER_FIELD_NAMES) {
      const errorMessage = this._getFieldError(fieldName);

      if (errorMessage) {
        errors[fieldName] = errorMessage;
      }
    }

    return errors;
  }

  private _renderFieldState(fieldName: RegisterFieldName): string {
    const errorMessage = this._getFieldError(fieldName);
    this._setFieldState(fieldName, this._shouldShowFieldError(fieldName) ? errorMessage : "");
    return errorMessage;
  }

  private _renderRelatedFieldStates(fieldName: RegisterFieldName): void {
    if (fieldName === "password") {
      this._renderFieldState("passwordConfirmation");
    }

    if (fieldName === "recoveryPassphrase") {
      this._renderFieldState("recoveryPassphraseConfirmation");
    }
  }

  private _shouldShowFieldError(fieldName: RegisterFieldName): boolean {
    return this._fieldInteractionState[fieldName].touched;
  }

  private _getFieldError(fieldName: RegisterFieldName): string {
    if (!this._fields) {
      return "";
    }

    const fields = this._fields;

    switch (fieldName) {
      case "username":
        return getUsernameValidationError(fields.username.value);
      case "password":
        return getPasswordValidationError(fields.password.value);
      case "passwordConfirmation":
        return getPasswordConfirmationValidationError(fields.password.value, fields.passwordConfirmation.value);
      case "recoveryPassphrase":
        return getRecoveryPassphraseValidationError(fields.recoveryPassphrase.value);
      case "recoveryPassphraseConfirmation":
        return getRecoveryPassphraseConfirmationValidationError(
          fields.recoveryPassphrase.value,
          fields.recoveryPassphraseConfirmation.value,
        );
      default:
        return "";
    }
  }

  private _setFieldState(fieldName: RegisterFieldName, errorMessage: string): void {
    if (!this._fields || !this._registerForm) {
      return;
    }

    const field = this._fields[fieldName];
    const errorHost = this._registerForm.querySelector<HTMLElement>(`[data-field-error-for="${fieldName}"]`);

    if (errorMessage.length > 0) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }

    if (errorHost) {
      errorHost.textContent = errorMessage;
    }
  }
}
