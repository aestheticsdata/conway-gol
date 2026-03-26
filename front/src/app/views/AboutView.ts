import { AuthPageView } from "./AuthPageView";
import { createAboutView } from "./html";

export class AboutView extends AuthPageView {
  constructor() {
    super({
      documentTitle: "About",
      render: createAboutView,
    });
  }
}
