import { REGISTER_ROUTE } from "@app/routes";
import { createButton } from "@ui/components/button/createButton";
import { createAuthLayout } from "@views/html/authLayout";

export function createRegisterView(): string {
  return createAuthLayout({
    activeRoute: REGISTER_ROUTE,
    content: `
      <p class="auth-card__copy">
        Create your studio access before the authentication flow is wired to the backend. This screen prepares the full registration journey on the frontend.
      </p>
      <form class="auth-form">
        <label class="auth-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          >
        </label>
        <label class="auth-field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            autocomplete="new-password"
            required
          >
        </label>
        <label class="auth-field">
          <span>Confirm Password</span>
          <input
            type="password"
            name="passwordConfirmation"
            placeholder="••••••••"
            autocomplete="new-password"
            required
          >
        </label>
        ${createButton({ type: "submit", className: "auth-submit", label: "Create Account", size: "compact" })}
      </form>
    `,
  });
}
