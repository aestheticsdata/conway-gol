export function getTrimmedSearchParam(searchParams: URLSearchParams, key: string): string | null {
  const value = searchParams.get(key)?.trim();
  return value ? value : null;
}

export function buildPathWithSearchParam(path: string, key: string, value: string | null): string {
  if (!value) {
    return path;
  }

  const searchParams = new URLSearchParams();
  searchParams.set(key, value);
  return `${path}?${searchParams.toString()}`;
}

export function replaceCurrentSearchParam(key: string, value: string | null): void {
  const url = new URL(window.location.href);
  if (value) {
    url.searchParams.set(key, value);
  } else {
    url.searchParams.delete(key);
  }

  window.history.replaceState(window.history.state, "", url);
}
