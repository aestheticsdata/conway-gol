import { ABOUT_ROUTE } from "@app/routes";
import { createAuthLayout } from "@views/html/authLayout";

export function createAboutView(): string {
  return createAuthLayout({
    activeRoute: ABOUT_ROUTE,
    content: `
      <p class="auth-card__copy">
        Site hébergé chez OVH SAS<br>Siège social : 2 rue Kellermann - 59100 Roubaix - France<br>Code APE 2620Z<br>N° TVA : FR 22 424 761 419
      </p>
    `,
  });
}
