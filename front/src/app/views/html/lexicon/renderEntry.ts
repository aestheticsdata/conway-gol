import { PERSON_ICON } from "@assets/icons/personIcon";

import { escapeHtml } from "./escapeHtml";
import { renderBlocks } from "./renderBlocks";

import type { LexiconEntry } from "@data/lexicon/lexiconParser";

function renderPatternCardMarkup(entry: LexiconEntry): string {
  if (!entry.patternCard) {
    return "";
  }

  return `
    <section class="lexicon-pattern-preview" aria-label="${escapeHtml(`Pattern preview for ${entry.patternCard.displayName}`)}">
      <div class="lexicon-pattern-preview__center">
        <div class="zoo-pattern-card__preview lexicon-pattern-preview__frame">
          <canvas
            class="zoo-pattern-card__preview-canvas lexicon-pattern-preview__canvas"
            width="320"
            height="188"
            data-lexicon-pattern-anchor="${escapeHtml(entry.anchorId)}"
            aria-hidden="true"
          ></canvas>
        </div>
      </div>
      <p class="lexicon-pattern-preview__description">${escapeHtml(entry.patternCard.description)}</p>
    </section>
  `;
}

export function renderEntryMarkup(entry: LexiconEntry): string {
  return `
    <article id="${escapeHtml(entry.anchorId)}" class="lexicon-entry">
      <header class="lexicon-entry__header">
        <div class="lexicon-entry__heading">
          <span class="lexicon-entry__index">${escapeHtml(entry.firstIndexLabel)}</span>
          <div>
            <h2>${escapeHtml(entry.term)}</h2>
            <p class="lexicon-entry__summary">${escapeHtml(entry.summary)}</p>
          </div>
        </div>
        <div class="lexicon-entry__meta">
          ${entry.modifiers ? `<span class="lexicon-entry__badge">${escapeHtml(entry.modifiers)}</span>` : ""}
          ${
            entry.author
              ? `<span class="lexicon-entry__author"><span aria-hidden="true">${PERSON_ICON}</span>${escapeHtml(entry.author)}</span>`
              : ""
          }
        </div>
      </header>
      ${renderPatternCardMarkup(entry)}
      <div class="lexicon-entry__content lexicon-rich-text">
        ${renderBlocks(entry.blocks)}
      </div>
    </article>
  `;
}
