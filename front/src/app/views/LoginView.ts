import { SIMULATION_ROUTE } from "@app/routes";
import { AuthPageView } from "./AuthPageView";
import { createLoginView } from "./html";

import type { AppPath } from "@navigation/NavigationAdapter";

export class LoginView extends AuthPageView {
  constructor(navigate: (path: AppPath) => Promise<void>) {
    super({
      documentTitle: "Login",
      render: createLoginView,
      onSubmit: () => navigate(SIMULATION_ROUTE),
    });
  }
}
