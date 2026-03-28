import lexiconSource from "@data/lexicon/lexicon.txt?raw";
import {
  createLexiconPatternCardMeta,
  extractAuthorFromNarrative,
  summarizeNarrative,
} from "@data/patterns/patternCardMeta";

import type { LexiconPatternCardMeta } from "@data/patterns/patternCardMeta";

export type LexiconInlineToken =
  | {
      type: "reference";
      label: string;
      normalizedTarget: string;
    }
  | {
      type: "text";
      value: string;
    };

export type LexiconBlock =
  | {
      type: "code";
      code: string;
      kind: "example" | "pattern";
    }
  | {
      type: "paragraph";
      inline: LexiconInlineToken[];
      text: string;
    };

export type LexiconSection = {
  anchorId: string;
  blocks: LexiconBlock[];
  title: string;
};

export type LexiconEntry = {
  anchorId: string;
  author: string | null;
  blocks: LexiconBlock[];
  firstIndexLabel: string;
  modifiers: string | null;
  normalizedTerm: string;
  patternCard: LexiconPatternCardMeta | null;
  summary: string;
  term: string;
};

export type LifeLexicon = {
  entryAnchorByNormalizedTerm: ReadonlyMap<string, string>;
  entryCount: number;
  entries: readonly LexiconEntry[];
  index: readonly { anchorId: string; label: string }[];
  license: {
    copyright: string;
    label: string;
    summary: string;
    title: string;
  };
  patternEntryCount: number;
  prefaceSections: readonly LexiconSection[];
  referenceCount: number;
  releaseLabel: string;
  subtitleLines: readonly string[];
  title: string;
};

type ParsedEntryDraft = {
  blocks: LexiconBlock[];
  modifiers: string | null;
  normalizedTerm: string;
  patternCard: LexiconPatternCardMeta | null;
  term: string;
};

const INTERNAL_FALLBACK_AUTHOR = "Life Lexicon archive";
const INTERNAL_FALLBACK_DESCRIPTION = "Lexicon entry from the Conway Life archive.";

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeLexiconTerm(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "entry"
  );
}

function tokenizeInlineText(text: string): LexiconInlineToken[] {
  const tokens: LexiconInlineToken[] = [];
  const matcher = /\{([^{}]+)\}/g;
  let cursor = 0;

  for (const match of text.matchAll(matcher)) {
    const index = match.index ?? 0;
    const label = match[1]?.trim();

    if (index > cursor) {
      tokens.push({ type: "text", value: text.slice(cursor, index) });
    }

    if (label) {
      tokens.push({
        type: "reference",
        label,
        normalizedTarget: normalizeLexiconTerm(label),
      });
    }

    cursor = index + match[0].length;
  }

  if (cursor < text.length) {
    tokens.push({ type: "text", value: text.slice(cursor) });
  }

  return tokens.length > 0 ? tokens : [{ type: "text", value: text }];
}

function createParagraphBlock(text: string): LexiconBlock | null {
  const normalized = collapseWhitespace(text);
  if (!normalized) {
    return null;
  }

  return {
    type: "paragraph",
    text: normalized,
    inline: tokenizeInlineText(normalized),
  };
}

function detectCodeBlockKind(code: string): "example" | "pattern" {
  const lines = code
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length > 0 && lines.every((line) => /^[.*]+$/.test(line)) ? "pattern" : "example";
}

function createCodeBlock(lines: string[]): LexiconBlock | null {
  const normalizedLines = lines.map((line) => line.replace(/\s+$/g, ""));
  const code = normalizedLines.join("\n").trimEnd();

  if (!code) {
    return null;
  }

  return {
    type: "code",
    code,
    kind: detectCodeBlockKind(code),
  };
}

function parseBlocks(lines: readonly string[]): LexiconBlock[] {
  const blocks: LexiconBlock[] = [];
  let paragraphLines: string[] = [];
  let codeLines: string[] = [];

  const flushParagraph = (): void => {
    if (paragraphLines.length === 0) {
      return;
    }

    const paragraph = createParagraphBlock(paragraphLines.join(" "));
    if (paragraph) {
      blocks.push(paragraph);
    }
    paragraphLines = [];
  };

  const flushCode = (): void => {
    if (codeLines.length === 0) {
      return;
    }

    const codeBlock = createCodeBlock(codeLines);
    if (codeBlock) {
      blocks.push(codeBlock);
    }
    codeLines = [];
  };

  for (const rawLine of lines) {
    if (rawLine.startsWith("\t")) {
      flushParagraph();
      codeLines.push(rawLine.replace(/^\t/, ""));
      continue;
    }

    if (!rawLine.trim()) {
      flushParagraph();
      flushCode();
      continue;
    }

    flushCode();
    paragraphLines.push(rawLine.trim());
  }

  flushParagraph();
  flushCode();

  return blocks;
}

function extractLeadingParenthetical(text: string): { modifiers: string; rest: string } | null {
  if (!text.startsWith("(")) {
    return null;
  }

  let depth = 0;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        const modifiers = text.slice(0, index + 1).trim();
        const rest = text.slice(index + 1).trim();
        return modifiers ? { modifiers, rest } : null;
      }
    }
  }

  return null;
}

function firstIndexLabel(term: string): string {
  const firstAlphaNumeric = term.match(/[A-Za-z0-9]/)?.[0]?.toUpperCase();
  return firstAlphaNumeric ?? "#";
}

function parseEntryChunk(lines: readonly string[], uniqueIndex: number): ParsedEntryDraft {
  const [headline = "", ...bodyLines] = lines;
  const headlineMatch = headline.match(/^:(.+?):\s*(.*)$/);
  if (!headlineMatch) {
    throw new Error(`Invalid lexicon headline: ${headline}`);
  }

  const term = headlineMatch[1]?.trim() ?? "";
  const remainder = headlineMatch[2] ?? "";
  const contentLines = remainder ? [remainder, ...bodyLines] : [...bodyLines];
  let blocks = parseBlocks(contentLines);

  let modifiers: string | null = null;
  const firstParagraphIndex = blocks.findIndex((block) => block.type === "paragraph");

  if (firstParagraphIndex >= 0) {
    const firstParagraph = blocks[firstParagraphIndex];
    if (firstParagraph.type === "paragraph") {
      const leadingParenthetical = extractLeadingParenthetical(firstParagraph.text);
      if (leadingParenthetical) {
        modifiers = leadingParenthetical.modifiers;
        const nextParagraph = createParagraphBlock(leadingParenthetical.rest);
        if (nextParagraph) {
          blocks[firstParagraphIndex] = nextParagraph;
        } else {
          blocks = blocks.filter((_, index) => index !== firstParagraphIndex);
        }
      }
    }
  }

  const normalizedTerm = normalizeLexiconTerm(term);
  const anchorId = `lexicon-entry-${slugify(term)}-${uniqueIndex}`;
  const narrative = collapseWhitespace(
    blocks
      .filter((block): block is Extract<LexiconBlock, { type: "paragraph" }> => block.type === "paragraph")
      .map((block) => block.text)
      .join(" "),
  );

  let featuredPatternCode: string | null = null;
  blocks = blocks.filter((block) => {
    if (featuredPatternCode || block.type !== "code" || block.kind !== "pattern") {
      return true;
    }

    featuredPatternCode = block.code;
    return false;
  });

  return {
    blocks,
    modifiers,
    normalizedTerm,
    patternCard: featuredPatternCode
      ? createLexiconPatternCardMeta({
          anchorId,
          displayName: term,
          fallbackAuthor: INTERNAL_FALLBACK_AUTHOR,
          fallbackDescription: INTERNAL_FALLBACK_DESCRIPTION,
          modifiers,
          narrative,
          previewAscii: featuredPatternCode,
        })
      : null,
    term,
  };
}

function parseEntries(lines: readonly string[]): ParsedEntryDraft[] {
  const chunks: string[][] = [];
  let currentChunk: string[] = [];

  for (const line of lines) {
    if (line.startsWith(":")) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      currentChunk = [line];
      continue;
    }

    if (currentChunk.length > 0) {
      currentChunk.push(line);
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks.map((chunk, index) => parseEntryChunk(chunk, index + 1));
}

function parsePrefaceSections(lines: readonly string[]): {
  sections: LexiconSection[];
  subtitleLines: string[];
  title: string;
} {
  const title = lines[0]?.trim() || "Life Lexicon";
  const subtitleLines: string[] = [];
  let cursor = 1;

  while (cursor < lines.length) {
    const line = lines[cursor] ?? "";
    if (!line.trim()) {
      cursor += 1;
      break;
    }

    subtitleLines.push(line.trim());
    cursor += 1;
  }

  const sections: LexiconSection[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];

  const flushSection = (): void => {
    if (!currentTitle) {
      currentLines = [];
      return;
    }

    sections.push({
      anchorId: `lexicon-preface-${slugify(currentTitle)}`,
      blocks: parseBlocks(currentLines),
      title: currentTitle,
    });
    currentLines = [];
  };

  for (; cursor < lines.length; cursor++) {
    const line = lines[cursor] ?? "";
    if (/^[A-Z0-9][A-Z0-9 '&/(),-]*$/.test(line.trim()) && line.trim() === line) {
      flushSection();
      currentTitle = line.trim();
      continue;
    }

    currentLines.push(line);
  }

  flushSection();

  return { sections, subtitleLines, title };
}

function buildEntryIndex(entries: readonly LexiconEntry[]): { anchorId: string; label: string }[] {
  const seen = new Set<string>();
  const index: { anchorId: string; label: string }[] = [];

  for (const entry of entries) {
    if (seen.has(entry.firstIndexLabel)) {
      continue;
    }

    seen.add(entry.firstIndexLabel);
    index.push({ anchorId: entry.anchorId, label: entry.firstIndexLabel });
  }

  return index;
}

function extractLicense(prefaceSections: readonly LexiconSection[]) {
  const copyingSection = prefaceSections.find((section) => section.title === "COPYING");
  const paragraphs = copyingSection?.blocks.filter(
    (block): block is Extract<LexiconBlock, { type: "paragraph" }> => block.type === "paragraph",
  );
  const summaryText = collapseWhitespace(paragraphs?.map((paragraph) => paragraph.text).join(" ") ?? "");
  const copyright = summaryText.match(/copyright\s+\(C\)\s+([^.]*)/i)?.[1]?.trim() ?? "Stephen Silver, 1997-2018";
  const label = summaryText.includes("CC BY-SA 3.0") ? "CC BY-SA 3.0" : "Creative Commons";

  return {
    copyright,
    label,
    summary: summaryText || "Freely copied, modified and distributed with attribution and share-alike.",
    title: "Creative Commons Attribution-ShareAlike 3.0",
  };
}

export function parseLifeLexicon(source: string): LifeLexicon {
  const normalizedSource = source.replaceAll("\r\n", "\n");
  const lines = normalizedSource.split("\n");
  const separatorIndex = lines.findIndex((line) => /^-{5,}$/.test(line.trim()));
  const prefaceLines = separatorIndex >= 0 ? lines.slice(0, separatorIndex) : lines;
  const entryLines = separatorIndex >= 0 ? lines.slice(separatorIndex + 1) : [];

  const { sections: prefaceSections, subtitleLines, title } = parsePrefaceSections(prefaceLines);
  const parsedEntryDrafts = parseEntries(entryLines);

  const entryAnchorByNormalizedTerm = new Map<string, string>();
  const entries: LexiconEntry[] = parsedEntryDrafts.map((draft, index) => {
    const anchorId = draft.patternCard?.anchorId ?? `lexicon-entry-${slugify(draft.term)}-${index + 1}`;
    entryAnchorByNormalizedTerm.set(draft.normalizedTerm, anchorId);

    const narrative = collapseWhitespace(
      draft.blocks
        .filter((block): block is Extract<LexiconBlock, { type: "paragraph" }> => block.type === "paragraph")
        .map((block) => block.text)
        .join(" "),
    );

    return {
      anchorId,
      author: extractAuthorFromNarrative(narrative),
      blocks: draft.blocks,
      firstIndexLabel: firstIndexLabel(draft.term),
      modifiers: draft.modifiers,
      normalizedTerm: draft.normalizedTerm,
      patternCard: draft.patternCard ? { ...draft.patternCard, anchorId } : null,
      summary: summarizeNarrative(narrative, INTERNAL_FALLBACK_DESCRIPTION),
      term: draft.term,
    };
  });

  const referenceCount =
    prefaceSections.reduce(
      (count, section) =>
        count +
        section.blocks.reduce((sectionCount, block) => {
          if (block.type !== "paragraph") {
            return sectionCount;
          }

          return sectionCount + block.inline.filter((token) => token.type === "reference").length;
        }, 0),
      0,
    ) +
    entries.reduce(
      (count, entry) =>
        count +
        entry.blocks.reduce((entryCount, block) => {
          if (block.type !== "paragraph") {
            return entryCount;
          }

          return entryCount + block.inline.filter((token) => token.type === "reference").length;
        }, 0),
      0,
    );

  return {
    entryAnchorByNormalizedTerm,
    entryCount: entries.length,
    entries,
    index: buildEntryIndex(entries),
    license: extractLicense(prefaceSections),
    patternEntryCount: entries.filter((entry) => entry.patternCard).length,
    prefaceSections,
    referenceCount,
    releaseLabel: subtitleLines[0] ?? "Release 29, 2018 July 2",
    subtitleLines,
    title,
  };
}

export const LIFE_LEXICON = parseLifeLexicon(lexiconSource);
