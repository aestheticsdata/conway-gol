import { LIFE_LEXICON } from "@data/lexicon/lexiconParser";
import { escapeHtml } from "./escapeHtml";
import { renderBlocks } from "./renderBlocks";

import type { LexiconSection } from "@data/lexicon/lexiconParser";

const HIDDEN_PREFACE_SECTION_TITLES = new Set([
  "COPYING",
  "CREDITS",
  "DEDICATION",
  "ERRORS AND OMISSIONS",
  "FORMAT",
  "INTRODUCTION",
  "LEXICOGRAPHIC ORDER",
  "NAMES",
  "QUOTE",
  "SCOPE",
]);

function renderSection(section: LexiconSection): string {
  return `
    <article id="${escapeHtml(section.anchorId)}" class="documentation-panel lexicon-preface-card">
      <span class="documentation-panel__eyebrow">${escapeHtml(section.title)}</span>
      <div class="lexicon-rich-text">
        ${renderBlocks(section.blocks)}
      </div>
    </article>
  `;
}

export function renderPrefaceMarkup(): string {
  const visibleSections = LIFE_LEXICON.prefaceSections.filter(
    (section) => !HIDDEN_PREFACE_SECTION_TITLES.has(section.title),
  );

  if (visibleSections.length === 0) {
    return "";
  }

  return `
    <section class="documentation-section lexicon-section">
      <div class="lexicon-preface-grid">
        ${visibleSections.map(renderSection).join("")}
      </div>
    </section>
  `;
}
