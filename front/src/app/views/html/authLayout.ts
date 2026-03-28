import { APP_TEXTS } from "@texts";
import { createAuthHeader } from "@views/html/appHeader";

import type { AppPath } from "@navigation/NavigationAdapter";

interface AuthLayoutOptions {
  activeRoute: AppPath;
  cardClassName?: string;
  content: string;
}

export function createAuthLayout({ activeRoute, cardClassName = "", content }: AuthLayoutOptions): string {
  const cardClasses = ["auth-card", cardClassName].filter(Boolean).join(" ");

  return `
    <section class="auth-screen">
      <div class="auth-shell">
        ${createAuthHeader(activeRoute)}
        <div class="auth-screen__body">
          <div class="${cardClasses}">
            <div class="auth-card__eyebrow">${APP_TEXTS.auth.eyebrow}</div>
            <h1 class="auth-card__title auth-card__title--studio">
              <div class="studio-brand">
                <span class="workspace-brand__mark" aria-hidden="true"></span>
                <strong class="workspace-brand__title">${APP_TEXTS.workspace.studioTitle}</strong>
              </div>
            </h1>
            ${content}
          </div>
        </div>
      </div>
    </section>
  `;
}
