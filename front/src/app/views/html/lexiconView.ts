import { LEXICON_ROUTE, SIMULATION_ROUTE } from "@app/routes";
import { LEXICON_ICON } from "@assets/icons/lexiconIcon";
import { LICENSE_ICON } from "@assets/icons/licenseIcon";
import { PERSON_ICON } from "@assets/icons/personIcon";
import { LIFE_LEXICON } from "@data/lexicon/lexiconParser";
import { normalizeBasePath, toDocumentPath } from "@router/paths";
import { APP_TEXTS } from "@texts";
import { ARROW_RIGHT_BUTTON_ICON_MARKUP, createLinkButton } from "@ui/components/button/createButton";
import { createConnectedHeader } from "@views/html/appHeader";

import type { LexiconBlock, LexiconInlineToken, LexiconSection } from "@data/lexicon/lexiconParser";

const basePath = normalizeBasePath(import.meta.env.BASE_URL);
const LEXICON_HOME_PAGE_URL = "http://conwaylife.com/ref/lexicon/";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function renderInlineTokens(tokens: readonly LexiconInlineToken[]): string {
  return tokens
    .map((token) => {
      if (token.type === "text") {
        return escapeHtml(token.value);
      }

      const anchorId = LIFE_LEXICON.entryAnchorByNormalizedTerm.get(token.normalizedTarget);
      if (!anchorId) {
        return `<span class="lexicon-reference lexicon-reference--missing">${escapeHtml(token.label)}</span>`;
      }

      return `<a class="lexicon-reference" href="#${escapeHtml(anchorId)}">${escapeHtml(token.label)}</a>`;
    })
    .join("");
}

function renderBlocks(blocks: readonly LexiconBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "paragraph") {
        return `<p>${renderInlineTokens(block.inline)}</p>`;
      }

      const className =
        block.kind === "pattern" ? "lexicon-code-block lexicon-code-block--pattern" : "lexicon-code-block";
      return `<pre class="${className}"><code>${escapeHtml(block.code)}</code></pre>`;
    })
    .join("");
}

function renderPatternCardMarkup(entry: (typeof LIFE_LEXICON.entries)[number]): string {
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

function renderPrefaceMarkup(): string {
  const visibleSections = LIFE_LEXICON.prefaceSections.filter(
    (section) =>
      ![
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
      ].includes(section.title),
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

function renderEntryMarkup(entry: (typeof LIFE_LEXICON.entries)[number]): string {
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

const PREFACE_MARKUP = renderPrefaceMarkup();
const ENTRIES_MARKUP = LIFE_LEXICON.entries.map(renderEntryMarkup).join("");
const INDEX_MARKUP = LIFE_LEXICON.index
  .map(
    (item) =>
      `<a class="documentation-chip lexicon-index__chip" href="#${escapeHtml(item.anchorId)}">${escapeHtml(item.label)}</a>`,
  )
  .join("");

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
        <main id="lexicon-top" class="lexicon-page route-pane-fade-in">
          <div class="lexicon-layout">
            <div class="lexicon-main">
              <header class="lexicon-page-header">
                <span class="lexicon-page-header__eyebrow">
                  <span class="lexicon-page-header__icon" aria-hidden="true">${LEXICON_ICON}</span>
                  <span>${APP_TEXTS.lexicon.title}</span>
                </span>
                <h1>Conway Life Lexicon</h1>
                <p>
                  This is a lexicon of terms relating to John Horton Conway's
                  Game of Life.  It is also available in single-page and multipage
                  HTML versions. This lexicon was originally compiled between 1997 and 2006 by
                  Stephen A. Silver, and was updated in 2016-18 by Dave Greene and David
                  Bell.
                </p>
              </header>

              <section class="lexicon-section lexicon-home-page-note">
                <p class="lexicon-home-page-note__copy">
                  The latest versions of this lexicon (both HTML and ASCII) can be found at the Life Lexicon Home
                  Page,
                </p>
                <div class="lexicon-home-page-note__link-row">
                  ${createLinkButton({
                    className: "lexicon-home-page-note__link",
                    href: LEXICON_HOME_PAGE_URL,
                    label: LEXICON_HOME_PAGE_URL,
                    target: "_blank",
                    title: "Open the Life Lexicon Home Page"
                  })}
                </div>
              </section>

              <section class="lexicon-section">
                <article class="documentation-panel lexicon-license-card">
                  <span class="documentation-panel__eyebrow">License</span>
                  <div class="lexicon-license-card__headline">
                    <span class="lexicon-license-card__icon" aria-hidden="true">${LICENSE_ICON}</span>
                    <div>
                      <h2>${escapeHtml(LIFE_LEXICON.license.label)}</h2>
                      <p>${escapeHtml(LIFE_LEXICON.license.title)}</p>
                    </div>
                  </div>
                  <div class="lexicon-rich-text">
                    <p>${escapeHtml(LIFE_LEXICON.license.summary)}</p>
                    <p class="lexicon-license-card__copyright">${escapeHtml(LIFE_LEXICON.license.copyright)}</p>
                  </div>
                </article>
              </section>

              <section class="lexicon-section">
                <div class="lexicon-stats">
                  <article class="documentation-fact">
                    <span class="documentation-fact__label">Release</span>
                    <strong class="documentation-fact__value">${escapeHtml(LIFE_LEXICON.releaseLabel)}</strong>
                    <p>${escapeHtml(LIFE_LEXICON.subtitleLines[1] ?? "ASCII edition")}</p>
                  </article>
                  <article class="documentation-fact">
                    <span class="documentation-fact__label">Entries</span>
                    <strong class="documentation-fact__value">${String(LIFE_LEXICON.entryCount)}</strong>
                    <p>Original order is preserved so the archive still reads like the source text.</p>
                  </article>
                  <article class="documentation-fact">
                    <span class="documentation-fact__label">Pattern previews</span>
                    <strong class="documentation-fact__value">${String(LIFE_LEXICON.patternEntryCount)}</strong>
                    <p>Featured diagram blocks are upgraded into actual studio previews instead of raw ASCII only.</p>
                  </article>
                  <article class="documentation-fact">
                    <span class="documentation-fact__label">Internal links</span>
                    <strong class="documentation-fact__value">${String(LIFE_LEXICON.referenceCount)}</strong>
                    <p>Curly-brace references resolve with the same term normalization rule as the source lexicon.</p>
                  </article>
                </div>
              </section>

              ${PREFACE_MARKUP}

              <section class="documentation-section lexicon-section">
                <div class="lexicon-entries">
                  ${ENTRIES_MARKUP}
                </div>
              </section>
            </div>

            <aside class="lexicon-rail" aria-label="Lexicon jump index">
              <article class="documentation-panel lexicon-index">
                <div class="lexicon-index__titlebar">
                  <span class="documentation-panel__eyebrow">Jump Index</span>
                  <a class="lexicon-index__top-button" href="#lexicon-top" data-lexicon-back-to-top>
                    <span class="lexicon-index__top-button-label">${APP_TEXTS.lexicon.backToTop}</span>
                    ${ARROW_RIGHT_BUTTON_ICON_MARKUP}
                  </a>
                </div>
                <div class="lexicon-index__list">
                  ${INDEX_MARKUP}
                </div>
              </article>
            </aside>
          </div>
        </main>
      </div>
    </section>
  `;
}
