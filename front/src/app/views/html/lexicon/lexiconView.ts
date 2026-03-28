import { LEXICON_ROUTE, SIMULATION_ROUTE } from "@app/routes";
import { normalizeBasePath, toDocumentPath } from "@router/paths";
import { APP_TEXTS } from "@texts";
import { createConnectedHeader } from "@views/html/appHeader";

import { renderLexiconMainMarkup } from "./templates/lexiconMain";

const basePath = normalizeBasePath(import.meta.env.BASE_URL);

export function createLexiconView(username: string, avatarId: string): string {
  return `
    <section class="workspace-screen workspace-screen--lexicon">
      <div class="workspace-shell workspace-shell--lexicon">
        ${createConnectedHeader({
          avatarId,
          currentPath: LEXICON_ROUTE,
          navContent: `<a class="workspace-header__context-link" href="${toDocumentPath(SIMULATION_ROUTE, basePath)}">${APP_TEXTS.lexicon.backToSimulation}</a>`,
          username,
        })}
        ${renderLexiconMainMarkup()}
      </div>
    </section>
  `;
}
