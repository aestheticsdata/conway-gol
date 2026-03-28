import { LEXICON_ICON } from "@assets/icons/lexiconIcon";
import { LICENSE_ICON } from "@assets/icons/licenseIcon";
import { LIFE_LEXICON } from "@data/lexicon/lexiconParser";
import { APP_TEXTS } from "@texts";
import { ARROW_RIGHT_BUTTON_ICON_MARKUP, createLinkButton } from "@ui/components/button/createButton";

import { escapeHtml } from "../escapeHtml";
import { ENTRIES_MARKUP, INDEX_MARKUP, PREFACE_MARKUP } from "../markups";

const LEXICON_HOME_PAGE_URL = "http://conwaylife.com/ref/lexicon/";

export function renderLexiconMainMarkup(): string {
  return `
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
                    title: "Open the Life Lexicon Home Page",
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
  `;
}
