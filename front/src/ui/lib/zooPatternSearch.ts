/**
 * Zoo modal search: normalize punctuation and spacing so "trans", "trans-", and
 * "trans barge" match catalog names and loaded titles/descriptions consistently.
 */
export function normalizeZooSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function zooSearchFieldMatches(haystack: string, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return true;
  }
  return normalizeZooSearchText(haystack).includes(normalizedQuery);
}
