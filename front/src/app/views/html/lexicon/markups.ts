import { LIFE_LEXICON } from "@data/lexicon/lexiconParser";

import { escapeHtml } from "./escapeHtml";
import { renderEntryMarkup } from "./renderEntry";
import { renderPrefaceMarkup } from "./renderPreface";

export const PREFACE_MARKUP = renderPrefaceMarkup();
export const ENTRIES_MARKUP = LIFE_LEXICON.entries.map(renderEntryMarkup).join("");
export const INDEX_MARKUP = LIFE_LEXICON.index
  .map(
    (item) =>
      `<a class="documentation-chip lexicon-index__chip" href="#${escapeHtml(item.anchorId)}">${escapeHtml(item.label)}</a>`,
  )
  .join("");
