import { SIMULATION_ROUTE } from "@app/routes";
import SessionService from "@services/SessionService";
import { AuthPageView } from "./AuthPageView";
import { createLoginView } from "./html";

import type { AppPath } from "@navigation/NavigationAdapter";

export class LoginView extends AuthPageView {
  private readonly _session = new SessionService();

  constructor(navigate: (path: AppPath) => Promise<void>) {
    super({
      documentTitle: "Login",
      render: () => createLoginView(this._session.getUsernameOrFallback()),
      onSubmit: (form) => {
        const usernameField = form.querySelector<HTMLInputElement>('input[name="username"]');
        this._session.setUsername(usernameField?.value ?? "");

        void navigate(SIMULATION_ROUTE);
      },
    });
  }
}
