import { ABOUT_ROUTE, LOGIN_ROUTE, REGISTER_ROUTE } from "@app/routes";
import { normalizeBasePath, toDocumentPath } from "@router/paths";
import { APP_TEXTS } from "@texts";

import type { AppPath } from "@navigation/NavigationAdapter";

const basePath = normalizeBasePath(import.meta.env.BASE_URL);

const AUTH_NAV_ITEMS: readonly { label: string; route: AppPath }[] = [
  { label: APP_TEXTS.auth.nav.login, route: LOGIN_ROUTE },
  { label: APP_TEXTS.auth.nav.register, route: REGISTER_ROUTE },
  { label: APP_TEXTS.auth.nav.about, route: ABOUT_ROUTE },
];

export function createWorkspaceBrand(): string {
  return `
    <div class="workspace-brand" aria-label="${APP_TEXTS.workspace.studioTitle}">
      <span class="workspace-brand__mark" aria-hidden="true"></span>
      <strong class="workspace-brand__title">${APP_TEXTS.workspace.studioTitle}</strong>
    </div>
  `;
}

function createAuthNavLink(activeRoute: AppPath, route: AppPath, label: string): string {
  const currentAttribute = activeRoute === route ? ' aria-current="page"' : "";

  return `<a class="workspace-auth-nav__link" href="${toDocumentPath(route, basePath)}"${currentAttribute}>${label}</a>`;
}

export function createAuthHeader(activeRoute: AppPath): string {
  return `
    <header class="workspace-header workspace-header--auth">
      ${createWorkspaceBrand()}
      <div class="workspace-header__nav workspace-header__nav--auth">
        <nav class="workspace-auth-nav" aria-label="Authentication pages">
          ${AUTH_NAV_ITEMS.map(({ label, route }) => createAuthNavLink(activeRoute, route, label)).join("")}
        </nav>
      </div>
    </header>
  `;
}
