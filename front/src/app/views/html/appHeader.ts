import {
  ABOUT_ROUTE,
  DOCUMENTATION_ROUTE,
  LEXICON_ROUTE,
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  SETTINGS_ROUTE,
} from "@app/routes";
import { DOCUMENTATION_ICON } from "@assets/icons/documentationIcon";
import { LEXICON_ICON } from "@assets/icons/lexiconIcon";
import { LOG_OUT_ICON } from "@assets/icons/logOutIcon";
import { SETTINGS_ICON } from "@assets/icons/settingsIcon";
import { getUserAvatarOption } from "@assets/icons/userAvatars";
import { normalizeBasePath, toDocumentPath } from "@router/paths";
import { APP_TEXTS } from "@texts";

import type { AppPath } from "@navigation/NavigationAdapter";

const basePath = normalizeBasePath(import.meta.env.BASE_URL);

const AUTH_NAV_ITEMS: readonly { label: string; route: AppPath }[] = [
  { label: APP_TEXTS.auth.nav.login, route: LOGIN_ROUTE },
  { label: APP_TEXTS.auth.nav.register, route: REGISTER_ROUTE },
  { label: APP_TEXTS.auth.nav.about, route: ABOUT_ROUTE },
];

type ConnectedHeaderOptions = {
  avatarId: string;
  currentPath: AppPath;
  navContent?: string;
  username: string;
};

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

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

function createConnectedUserMenu(currentPath: AppPath, username: string, avatarId: string): string {
  const normalizedUsername = username.trim().replace(/^@+/, "") || "demo-user";
  const settingsCurrentAttribute = currentPath === SETTINGS_ROUTE ? ' aria-current="page"' : "";
  const documentationCurrentAttribute = currentPath === DOCUMENTATION_ROUTE ? ' aria-current="page"' : "";
  const lexiconCurrentAttribute = currentPath === LEXICON_ROUTE ? ' aria-current="page"' : "";
  const avatar = getUserAvatarOption(avatarId);

  return `
    <div class="workspace-user-menu" data-workspace-user-menu>
      <button
        type="button"
        class="workspace-user-menu__trigger"
        data-workspace-user-menu-trigger
        aria-haspopup="menu"
        aria-expanded="false"
      >
        <span class="workspace-user-menu__avatar" data-session-avatar-id="${escapeHtml(avatar.id)}" aria-hidden="true">
          ${avatar.svg}
        </span>
        <span class="workspace-user-menu__name">${escapeHtml(normalizedUsername)}</span>
        <span class="workspace-user-menu__chevron" aria-hidden="true"></span>
      </button>
      <div class="workspace-user-menu__panel" data-workspace-user-menu-panel role="menu" hidden>
        <div class="workspace-user-menu__meta">
          <span class="workspace-user-menu__meta-label">${APP_TEXTS.workspace.userMenu.signedInAs}</span>
          <div class="workspace-user-menu__meta-account">
            <span
              class="workspace-user-menu__avatar workspace-user-menu__meta-avatar"
              data-session-avatar-id="${escapeHtml(avatar.id)}"
              aria-hidden="true"
            >
              ${avatar.svg}
            </span>
            <strong class="workspace-user-menu__meta-value">${escapeHtml(normalizedUsername)}</strong>
          </div>
        </div>
        <a
          class="workspace-user-menu__item workspace-user-menu__item--link"
          href="${toDocumentPath(SETTINGS_ROUTE, basePath)}"
          role="menuitem"${settingsCurrentAttribute}
        >
          <span class="workspace-user-menu__item-icon" aria-hidden="true">${SETTINGS_ICON}</span>
          <span class="workspace-user-menu__item-label">${APP_TEXTS.workspace.userMenu.settings}</span>
        </a>
        <a
          class="workspace-user-menu__item workspace-user-menu__item--link"
          href="${toDocumentPath(DOCUMENTATION_ROUTE, basePath)}"
          role="menuitem"${documentationCurrentAttribute}
        >
          <span class="workspace-user-menu__item-icon" aria-hidden="true">${DOCUMENTATION_ICON}</span>
          <span class="workspace-user-menu__item-label">${APP_TEXTS.workspace.userMenu.documentation}</span>
        </a>
        <a
          class="workspace-user-menu__item workspace-user-menu__item--link"
          href="${toDocumentPath(LEXICON_ROUTE, basePath)}"
          role="menuitem"${lexiconCurrentAttribute}
        >
          <span class="workspace-user-menu__item-icon" aria-hidden="true">${LEXICON_ICON}</span>
          <span class="workspace-user-menu__item-label">${APP_TEXTS.workspace.userMenu.lexicon}</span>
        </a>
        <button type="button" class="workspace-user-menu__item" data-workspace-logout role="menuitem">
          <span class="workspace-user-menu__item-icon" aria-hidden="true">${LOG_OUT_ICON}</span>
          <span class="workspace-user-menu__item-label">${APP_TEXTS.workspace.logOut}</span>
        </button>
      </div>
    </div>
  `;
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

export function createConnectedHeader(options: ConnectedHeaderOptions): string {
  const { avatarId, currentPath, navContent = "", username } = options;

  return `
    <header class="workspace-header workspace-header--connected">
      ${createWorkspaceBrand()}
      <div class="workspace-header__nav workspace-header__nav--connected">
        ${navContent}
      </div>
      ${createConnectedUserMenu(currentPath, username, avatarId)}
    </header>
  `;
}
