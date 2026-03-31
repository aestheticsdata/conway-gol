import { LOGIN_ROUTE } from "@app/routes";
import { APP_TEXTS } from "@texts";
import { createButton } from "@ui/components/button/createButton";
import { createAuthSecretField, createAuthTextField } from "@views/html/authFields";
import { createAuthLayout } from "@views/html/authLayout";

export function createLoginView(): string {
  return createAuthLayout({
    activeRoute: LOGIN_ROUTE,
    content: `
      <p class="auth-card__copy">
        Conway's Game of Life is a cellular automaton where simple rules govern the birth and death of cells on a grid, creating complex, evolving patterns from chaos.
      </p>
      <form class="auth-form">
        ${createAuthTextField({
          label: "Username",
          name: "username",
          placeholder: "username",
          autocomplete: "username",
          clearable: true,
          clearAriaLabel: APP_TEXTS.auth.clearUsername,
        })}
        ${createAuthSecretField({
          label: "Password",
          name: "password",
          placeholder: "••••••••",
          autocomplete: "current-password",
          toggleSubject: "password",
        })}
        <p class="auth-form__error" data-auth-error aria-live="polite"></p>
        <div class="auth-form__primary-actions">
        ${createButton({
          type: "button",
          className: "auth-guest-entry",
          label: APP_TEXTS.auth.continueAsGuest,
          size: "compact",
        }).replace("<button ", "<button data-continue-as-guest ")}
        ${createButton({
          type: "submit",
          className: "auth-submit",
          icon: "arrow-right",
          iconPosition: "trailing",
          label: "Log in",
          size: "compact",
        })}
        </div>
        <p class="auth-form__guest-copy">${APP_TEXTS.guest.signInCallToAction}</p>
        <p class="auth-form__forgot">
          <a href="#" class="auth-forgot-link" data-forgot-password>Forgot password?</a>
        </p>
      </form>
    `,
  });
}
