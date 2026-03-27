import { REGISTER_ROUTE } from "@app/routes";
import { createButton } from "@ui/components/button/createButton";
import { createAuthSecretField, createAuthTextField } from "@views/html/authFields";
import { createAuthLayout } from "@views/html/authLayout";

export function createRegisterView(): string {
  return createAuthLayout({
    activeRoute: REGISTER_ROUTE,
    content: `
      <p class="auth-card__copy">
        Create your account and set a recovery passphrase to regain access if you forget your credentials.
      </p>
      <form class="auth-form" novalidate>
        ${createAuthTextField({
          label: "Username",
          name: "username",
          placeholder: "your-username",
          autocomplete: "username",
          errorId: "register-username-error",
        })}
        ${createAuthSecretField({
          label: "Password",
          name: "password",
          placeholder: "••••••••",
          autocomplete: "new-password",
          errorId: "register-password-error",
          toggleSubject: "password",
        })}
        ${createAuthSecretField({
          label: "Confirm Password",
          name: "passwordConfirmation",
          placeholder: "••••••••",
          autocomplete: "new-password",
          errorId: "register-password-confirmation-error",
          toggleSubject: "password confirmation",
        })}
        ${createAuthSecretField({
          label: "Recovery Passphrase",
          name: "recoveryPassphrase",
          placeholder: "Enter a passphrase to recover your password",
          autocomplete: "off",
          errorId: "register-recovery-passphrase-error",
          toggleSubject: "recovery passphrase",
        })}
        ${createAuthSecretField({
          label: "Confirm Recovery Passphrase",
          name: "recoveryPassphraseConfirmation",
          placeholder: "Repeat your recovery passphrase",
          autocomplete: "off",
          errorId: "register-recovery-passphrase-confirmation-error",
          toggleSubject: "recovery passphrase confirmation",
        })}
        ${createButton({ type: "submit", className: "auth-submit", label: "Create Account", size: "compact" })}
      </form>
    `,
  });
}
