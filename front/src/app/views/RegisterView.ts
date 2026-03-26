import { LOGIN_ROUTE } from "@app/routes";
import { AuthPageView } from "./AuthPageView";
import { createRegisterView } from "./html";

import type { AppPath } from "@navigation/NavigationAdapter";

export class RegisterView extends AuthPageView {
  constructor(navigate: (path: AppPath) => Promise<void>) {
    super({
      documentTitle: "Register",
      render: createRegisterView,
      onSubmit: (form) => {
        const passwordField = form.querySelector<HTMLInputElement>('input[name="password"]');
        const passwordConfirmationField = form.querySelector<HTMLInputElement>('input[name="passwordConfirmation"]');

        if (!passwordField || !passwordConfirmationField) {
          return;
        }

        const passwordsMatch = passwordField.value === passwordConfirmationField.value;
        passwordConfirmationField.setCustomValidity(passwordsMatch ? "" : "Passwords do not match.");

        if (!passwordsMatch) {
          passwordConfirmationField.reportValidity();
          return;
        }

        void navigate(LOGIN_ROUTE);
      },
    });
  }
}
