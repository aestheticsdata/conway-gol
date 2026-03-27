import { LOGIN_ROUTE } from "@app/routes";
import { createButton } from "@ui/components/button/createButton";
import { createAuthSecretField, createAuthTextField } from "@views/html/authFields";
import { createAuthLayout } from "@views/html/authLayout";

export function createLoginView(username: string): string {
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
          placeholder: "your-username",
          value: username,
          autocomplete: "username",
        })}
        ${createAuthSecretField({
          label: "Password",
          name: "password",
          placeholder: "••••••••",
          value: "demo-password",
          autocomplete: "current-password",
          toggleSubject: "password",
        })}
        ${createButton({
          type: "submit",
          className: "auth-submit",
          icon: "arrow-right",
          iconPosition: "trailing",
          label: "Enter Simulation",
          size: "compact",
        })}
      </form>
    `,
  });
}
