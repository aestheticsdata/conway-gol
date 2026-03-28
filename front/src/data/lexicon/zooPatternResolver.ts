import { normalizeLexiconTerm } from "./lexiconParser";

const MANUAL_ZOO_PATTERN_ALIASES: Record<string, string> = {
  ak94gun: "ak94",
  ccsemisnark: "semisnark",
  clockii: "clock2",
  hwemulator: "heavyweightemulator",
  hwvolcano: "heavyweightvolcano",
  lwemulator: "lightweightemulator",
  mwemulator: "middleweightemulator",
  mwvolcano: "middleweightvolcano",
  octagonii: "octagon2",
  octagoniv: "octagon4",
  owemulator: "overweightemulator",
};

const ABBREVIATED_PREFIXES: Record<string, string> = {
  hw: "heavyweight",
  lw: "lightweight",
  mw: "middleweight",
  ow: "overweight",
};

const ROMAN_SUFFIX_VARIANTS: ReadonlyArray<readonly [suffix: string, replacement: string]> = [
  ["iii", "3"],
  ["iv", "4"],
  ["ii", "2"],
] as const;

function createNormalizedPatternIndex(availablePatterns: readonly string[]): Map<string, string> {
  return new Map(availablePatterns.map((patternName) => [normalizeLexiconTerm(patternName), patternName]));
}

function expandAbbreviatedPrefix(normalizedTerm: string): string | null {
  for (const [abbreviation, fullPrefix] of Object.entries(ABBREVIATED_PREFIXES)) {
    if (!normalizedTerm.startsWith(abbreviation) || normalizedTerm.length <= abbreviation.length) {
      continue;
    }

    return `${fullPrefix}${normalizedTerm.slice(abbreviation.length)}`;
  }

  return null;
}

function replaceRomanSuffix(normalizedTerm: string): string | null {
  for (const [suffix, replacement] of ROMAN_SUFFIX_VARIANTS) {
    if (!normalizedTerm.endsWith(suffix) || normalizedTerm.length <= suffix.length) {
      continue;
    }

    return `${normalizedTerm.slice(0, -suffix.length)}${replacement}`;
  }

  return null;
}

function buildCandidatePatternNames(normalizedTerm: string): string[] {
  const candidates = new Set<string>();
  const manualAlias = MANUAL_ZOO_PATTERN_ALIASES[normalizedTerm];
  if (manualAlias) {
    candidates.add(manualAlias);
  }

  const expandedPrefix = expandAbbreviatedPrefix(normalizedTerm);
  if (expandedPrefix) {
    candidates.add(expandedPrefix);
  }

  const romanSuffixVariant = replaceRomanSuffix(normalizedTerm);
  if (romanSuffixVariant) {
    candidates.add(romanSuffixVariant);
  }

  const periodGunMatch = normalizedTerm.match(/^p(\d+)(mwss|lwss|hwss)?gun$/);
  if (periodGunMatch) {
    const [, period, shipClass] = periodGunMatch;
    if (shipClass) {
      candidates.add(`period${period}${shipClass}gun`);
    } else {
      candidates.add(`period${period}glidergun`);
      candidates.add(`trueperiod${period}gun`);
      candidates.add(`p${period}gunexample`);
    }
  }

  const patternedSuffixMatch = normalizedTerm.match(/^p(\d+)(bouncer|bumper|pipsquirter|reflector)$/);
  if (patternedSuffixMatch) {
    const [, period, suffix] = patternedSuffixMatch;
    candidates.add(`p${period}${suffix}`);
  }

  if (normalizedTerm) {
    candidates.add(normalizedTerm);
  }

  return [...candidates];
}

export function resolveLexiconPatternCandidate(term: string): string | null {
  if (!term) {
    return null;
  }

  const normalizedTerm = normalizeLexiconTerm(term);
  return buildCandidatePatternNames(normalizedTerm)[0] ?? null;
}

export function resolveLexiconPatternToZooPattern(term: string, availablePatterns: readonly string[]): string | null {
  if (!term) {
    return null;
  }

  const patternSet = new Set(availablePatterns);
  if (patternSet.has(term)) {
    return term;
  }

  const normalizedTerm = normalizeLexiconTerm(term);
  const normalizedPatternIndex = createNormalizedPatternIndex(availablePatterns);
  const normalizedMatch = normalizedPatternIndex.get(normalizedTerm);
  if (normalizedMatch) {
    return normalizedMatch;
  }

  for (const candidate of buildCandidatePatternNames(normalizedTerm)) {
    if (patternSet.has(candidate)) {
      return candidate;
    }

    const normalizedCandidate = normalizedPatternIndex.get(normalizeLexiconTerm(candidate));
    if (normalizedCandidate) {
      return normalizedCandidate;
    }
  }

  return null;
}
