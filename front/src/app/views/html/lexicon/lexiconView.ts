import { LEXICON_ROUTE, SIMULATION_ROUTE } from "@app/routes";
import { normalizeBasePath, toDocumentPath } from "@router/paths";
import { APP_TEXTS } from "@texts";
import { createConnectedHeader } from "@views/html/appHeader";
import { renderLexiconMainMarkup } from "./templates/lexiconMain";

import type { SessionViewer } from "@services/AuthSessionService";

const basePath = normalizeBasePath(import.meta.env.BASE_URL);

export function createLexiconView(viewer: SessionViewer): string {
  return `
    <section class="workspace-screen workspace-screen--lexicon">
      <div class="workspace-shell workspace-shell--lexicon">
        ${createConnectedHeader({
          avatarId: viewer.avatarId,
          currentPath: LEXICON_ROUTE,
          sessionMode: viewer.mode,
          navContent: `<a class="workspace-header__context-link" href="${toDocumentPath(SIMULATION_ROUTE, basePath)}">${APP_TEXTS.lexicon.backToSimulation}</a>`,
          username: viewer.username,
        })}
        ${renderLexiconMainMarkup()}
      </div>
    </section>
  `;
}
