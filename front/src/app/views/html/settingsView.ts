import { SETTINGS_ROUTE, SIMULATION_ROUTE } from "@app/routes";
import { SETTINGS_ICON } from "@assets/icons/settingsIcon";
import { normalizeBasePath, toDocumentPath } from "@router/paths";
import { APP_TEXTS } from "@texts";
import { createButton } from "@ui/components/button/createButton";
import { createConnectedHeader } from "@views/html/appHeader";

const basePath = normalizeBasePath(import.meta.env.BASE_URL);

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function createSettingsView(username: string, avatarId: string, avatarGrid: string): string {
  return `
    <section class="workspace-screen workspace-screen--settings">
      <div class="workspace-shell">
        ${createConnectedHeader({
          avatarId,
          currentPath: SETTINGS_ROUTE,
          username,
        })}
        <div class="settings-layout route-pane-fade-in">
          <section class="settings-panel">
            <div class="settings-panel__header">
              <div class="settings-panel__intro">
                <span class="settings-panel__eyebrow">
                  <span class="settings-panel__eyebrow-icon" aria-hidden="true">${SETTINGS_ICON}</span>
                  <span>${APP_TEXTS.settings.title}</span>
                </span>
              </div>
              <a class="settings-back-link" href="${toDocumentPath(SIMULATION_ROUTE, basePath)}">
                ${APP_TEXTS.settings.backToStudio}
              </a>
            </div>
            <div class="settings-grid">
              <article class="settings-card">
                <span class="settings-card__eyebrow">${APP_TEXTS.settings.account.eyebrow}</span>
                <div class="settings-account-editor">
                  <div class="settings-field">
                    <input
                      class="ui-input settings-username-input"
                      type="text"
                      name="settingsUsername"
                      value="${escapeHtml(username.replace(/^@+/, ""))}"
                      autocomplete="username"
                      aria-label="Username"
                      maxlength="24"
                    >
                  </div>
                  <span class="settings-field__message settings-username-message" aria-live="polite"></span>
                </div>
                <p class="settings-card__copy">${APP_TEXTS.settings.account.copy}</p>
                <div class="settings-card__meta">
                  <span class="settings-card__meta-label">${APP_TEXTS.settings.account.statusLabel}</span>
                  <strong class="settings-card__meta-value">${APP_TEXTS.settings.account.statusValue}</strong>
                </div>
              </article>
              <article class="settings-card">
                <span class="settings-card__eyebrow">${APP_TEXTS.settings.avatar.eyebrow}</span>
                <div class="settings-avatar-grid" data-settings-avatar-grid>
                  ${avatarGrid}
                </div>
              </article>
              <article class="settings-card">
                <span class="settings-card__eyebrow">${APP_TEXTS.settings.recovery.eyebrow}</span>
                <p class="settings-card__copy">${APP_TEXTS.settings.recovery.copy}</p>
                ${createButton({
                  type: "button",
                  className: "settings-card__action settings-change-passphrase",
                  label: APP_TEXTS.settings.recovery.action,
                  size: "compact",
                })}
                <span class="settings-field__message settings-recovery-message" aria-live="polite"></span>
              </article>
              <article class="settings-card">
                <span class="settings-card__eyebrow">${APP_TEXTS.settings.password.eyebrow}</span>
                <p class="settings-card__copy">${APP_TEXTS.settings.password.copy}</p>
                ${createButton({
                  type: "button",
                  className: "settings-card__action settings-change-password",
                  label: APP_TEXTS.settings.password.action,
                  size: "compact",
                })}
                <span class="settings-field__message settings-password-message" aria-live="polite"></span>
              </article>
              <article class="settings-card">
                <span class="settings-card__eyebrow">${APP_TEXTS.settings.session.eyebrow}</span>
                <p class="settings-card__copy">${APP_TEXTS.settings.session.copy}</p>
                ${createButton({
                  type: "button",
                  className: "settings-card__action settings-logout",
                  label: APP_TEXTS.workspace.logOut,
                  size: "compact",
                })}
              </article>
            </div>
            <div class="settings-panel__footer">
              <span class="settings-panel__status" aria-live="polite"></span>
              ${createButton({
                type: "button",
                className: "settings-save-changes",
                label: APP_TEXTS.settings.saveChanges,
                size: "compact",
                disabled: true,
              })}
            </div>
          </section>
        </div>
      </div>
    </section>
  `;
}
