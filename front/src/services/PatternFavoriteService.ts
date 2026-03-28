const FAVORITE_PATTERNS_KEY = "cgl.zoo.favorite-patterns";

class PatternFavoriteService {
  private _favorites = new Set<string>(this._readFavorites());

  public isFavorite(patternName: string): boolean {
    return this._favorites.has(patternName);
  }

  public toggleFavorite(patternName: string): boolean {
    if (this._favorites.has(patternName)) {
      this._favorites.delete(patternName);
    } else {
      this._favorites.add(patternName);
    }

    this._persistFavorites();
    return this._favorites.has(patternName);
  }

  public getFavoriteCount(patternName: string): number {
    return this._placeholderCount(patternName) + (this.isFavorite(patternName) ? 1 : 0);
  }

  private _readFavorites(): string[] {
    try {
      const raw = window.localStorage.getItem(FAVORITE_PATTERNS_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        : [];
    } catch {
      return [];
    }
  }

  private _persistFavorites(): void {
    try {
      window.localStorage.setItem(FAVORITE_PATTERNS_KEY, JSON.stringify([...this._favorites].sort()));
    } catch {
      // Ignore storage failures while the API-backed favorites flow is not wired yet.
    }
  }

  private _placeholderCount(patternName: string): number {
    let hash = 0;
    for (let index = 0; index < patternName.length; index++) {
      hash = Math.imul(hash ^ patternName.charCodeAt(index), 16777619);
    }

    return 48 + (Math.abs(hash) % 431);
  }
}

export default PatternFavoriteService;
