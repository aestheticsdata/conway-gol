import { isHxfNoiseCommentLine, resolveHxfDisplayAutomata } from "@data/patterns/hxfPatternAdapter";

import type { RemotePattern } from "@services/PatternService";

export interface PatternCardLink {
  href: string;
  label: string;
  title: string;
}

interface PatternCardMetaBase {
  author: string;
  description: string;
  displayName: string;
  links: PatternCardLink[];
}

export interface HxfPatternCardMeta extends PatternCardMetaBase {
  pattern: number[][];
}

export interface LexiconPatternCardMeta extends PatternCardMetaBase {
  anchorId: string;
  modifiers: string | null;
  previewAscii: string;
}

export interface ExtractHxfPatternCardMetaInput {
  patternName: string;
  remotePattern: RemotePattern;
  fallbackAuthor: string;
  fallbackDescription: string;
}

interface LexiconPatternCardMetaOptions {
  anchorId: string;
  displayName: string;
  fallbackAuthor: string;
  fallbackDescription: string;
  modifiers: string | null;
  narrative: string;
  previewAscii: string;
}

const AUTHOR_PATTERNS = [
  /\b[Ff]ound by ([^.;]+?)(?= in\b| on\b| before\b| after\b| during\b|,|\.|;|$)/,
  /\b[Dd]iscovered by ([^.;]+?)(?= in\b| on\b| before\b| after\b| during\b|,|\.|;|$)/,
  /\b[Cc]onstructed by ([^.;]+?)(?= in\b| on\b| before\b| after\b| during\b|,|\.|;|$)/,
  /\b[Cc]reated by ([^.;]+?)(?= in\b| on\b| before\b| after\b| during\b|,|\.|;|$)/,
  /\b[Ww]ritten by ([^.;]+?)(?= in\b| on\b| before\b| after\b| during\b|,|\.|;|$)/,
  /^\s*[Bb]y ([^.;]+?)(?= in\b| on\b| before\b| after\b| during\b|,|\.|;|$)/,
] as const;

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripLexiconReferences(value: string): string {
  return value.replace(/\{([^{}]+)\}/g, "$1");
}

function cleanAuthorCandidate(value: string): string | null {
  const normalized = collapseWhitespace(
    value
      .replace(/^["']+|["']+$/g, "")
      .replace(/\s+\([^)]*\)$/g, "")
      .replace(/\s+and named by.+$/i, ""),
  );

  return normalized || null;
}

function firstSentence(value: string): string {
  const sentenceMatch = value.match(/^(.{1,220}?[.!?])(?:\s|$)/);
  return sentenceMatch?.[1]?.trim() ?? value;
}

function truncateSummary(value: string, maxLength = 180): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function isUrlLine(line: string): boolean {
  return line.startsWith("http://") || line.startsWith("https://");
}

function parseCommentMeta(line: string): { label: string; value: string } | null {
  const match = line.match(/^([^:]+):\s*(.+)$/);
  if (!match) {
    return null;
  }

  const label = match[1]?.trim();
  const value = match[2]?.trim();
  if (!label || !value) {
    return null;
  }

  return { label, value };
}

function createPatternLink(href: string): PatternCardLink {
  return {
    href,
    label: href,
    title: href,
  };
}

export function summarizeNarrative(text: string, fallback: string): string {
  const normalized = collapseWhitespace(stripLexiconReferences(text));
  if (!normalized) {
    return fallback;
  }

  return truncateSummary(firstSentence(normalized));
}

export function extractAuthorFromNarrative(text: string): string | null {
  const normalized = collapseWhitespace(stripLexiconReferences(text));
  if (!normalized) {
    return null;
  }

  for (const pattern of AUTHOR_PATTERNS) {
    const match = normalized.match(pattern);
    const candidate = match?.[1];
    if (!candidate) {
      continue;
    }

    const author = cleanAuthorCandidate(candidate);
    if (author) {
      return author;
    }
  }

  return null;
}

export function extractHxfPatternCardMeta(input: ExtractHxfPatternCardMetaInput): HxfPatternCardMeta {
  const { patternName, remotePattern, fallbackAuthor, fallbackDescription } = input;
  let displayName = patternName;
  let author = fallbackAuthor;
  const descriptionCandidates: string[] = [];
  const linkCandidates: string[] = [];

  for (const rawLine of remotePattern.comments) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (isUrlLine(line)) {
      linkCandidates.push(line);
      continue;
    }

    const meta = parseCommentMeta(line);
    if (meta) {
      const normalizedLabel = meta.label.toLowerCase();

      if (normalizedLabel === "name") {
        displayName = meta.value;
        continue;
      }

      if (normalizedLabel === "author" || normalizedLabel === "discoverer" || normalizedLabel === "discovered by") {
        author = meta.value;
        continue;
      }
    }

    if (isHxfNoiseCommentLine(line)) {
      continue;
    }

    descriptionCandidates.push(line);
  }

  const pattern = resolveHxfDisplayAutomata(remotePattern.automata, remotePattern.comments);

  return {
    author,
    description: descriptionCandidates[0] ?? fallbackDescription,
    displayName,
    links: linkCandidates.map((href) => createPatternLink(href)),
    pattern,
  };
}

export function createLexiconPatternCardMeta(options: LexiconPatternCardMetaOptions): LexiconPatternCardMeta {
  const { anchorId, displayName, fallbackAuthor, fallbackDescription, modifiers, narrative, previewAscii } = options;

  return {
    anchorId,
    author: extractAuthorFromNarrative(narrative) ?? fallbackAuthor,
    description: summarizeNarrative(narrative, fallbackDescription),
    displayName,
    links: [],
    modifiers,
    previewAscii,
  };
}
