import { LIFE_LEXICON } from "@data/lexicon/lexiconParser";

import { escapeHtml } from "./escapeHtml";

import type { LexiconBlock, LexiconInlineToken } from "@data/lexicon/lexiconParser";

export function renderInlineTokens(tokens: readonly LexiconInlineToken[]): string {
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

export function renderBlocks(blocks: readonly LexiconBlock[]): string {
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
