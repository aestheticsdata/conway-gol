import { URLS } from "@helpers/constants";
import { httpClient } from "@infra/http/HttpClient";
import { authSessionService } from "@services/AuthSessionService";

import type HttpClient from "@infra/http/HttpClient";

export interface PatternFavoriteSnapshot {
  counts: Record<string, number>;
  favorites: string[];
}

export interface PatternFavoriteMutation {
  favoriteCount: number;
  isFavorite: boolean;
  patternName: string;
}

class PatternFavoriteService {
  private _counts = new Map<string, number>();
  private _favorites = new Set<string>();
  private _isLoaded = false;
  private _loadPromise: Promise<void> | null = null;
  private _loadedForSessionKey: string | null = null;
  private readonly _pendingFavorites = new Set<string>();

  constructor(private readonly _http: HttpClient = httpClient) {}

  public hasSnapshot(): boolean {
    return this._isLoaded;
  }

  public isFavorite(patternName: string): boolean {
    return this._favorites.has(this._normalizePatternName(patternName));
  }

  public isPending(patternName: string): boolean {
    return this._pendingFavorites.has(this._normalizePatternName(patternName));
  }

  public getFavoriteCount(patternName: string): number {
    return this._counts.get(this._normalizePatternName(patternName)) ?? 0;
  }

  public async ensureLoaded(): Promise<void> {
    const sessionKey = authSessionService.sessionCacheKey();
    if (this._isLoaded && this._loadedForSessionKey === sessionKey) {
      return;
    }

    await this.refreshSnapshot();
  }

  public async refreshSnapshot(): Promise<void> {
    const sessionKey = authSessionService.sessionCacheKey();
    if (this._loadPromise && this._loadedForSessionKey === sessionKey) {
      return this._loadPromise;
    }

    this._loadedForSessionKey = sessionKey;
    this._loadPromise = this._http
      .get<PatternFavoriteSnapshot>(URLS.catalogPatternFavorites)
      .then((snapshot) => {
        this._replaceSnapshot(snapshot);
      })
      .catch((error: unknown) => {
        this._counts.clear();
        this._favorites.clear();
        this._isLoaded = false;
        this._loadedForSessionKey = null;
        throw error;
      })
      .finally(() => {
        this._loadPromise = null;
      });

    return this._loadPromise;
  }

  public async toggleFavorite(patternName: string): Promise<PatternFavoriteMutation> {
    const normalizedPatternName = this._normalizePatternName(patternName);
    if (this._pendingFavorites.has(normalizedPatternName)) {
      return {
        patternName: normalizedPatternName,
        favoriteCount: this.getFavoriteCount(normalizedPatternName),
        isFavorite: this.isFavorite(normalizedPatternName),
      };
    }

    await this.ensureLoaded();

    const wasFavorite = this._favorites.has(normalizedPatternName);
    const previousCount = this._counts.get(normalizedPatternName) ?? 0;
    this._pendingFavorites.add(normalizedPatternName);
    this._applyOptimisticFavorite(normalizedPatternName, wasFavorite, previousCount);

    try {
      const encodedPatternName = encodeURIComponent(normalizedPatternName);
      const mutation = wasFavorite
        ? await this._http.delete<PatternFavoriteMutation>(`${URLS.catalogPatternFavorites}${encodedPatternName}`)
        : await this._http.put<PatternFavoriteMutation, Record<string, never>>(
            `${URLS.catalogPatternFavorites}${encodedPatternName}`,
            {},
          );
      this._commitMutation(mutation);
      return mutation;
    } catch (error) {
      this._rollbackOptimisticFavorite(normalizedPatternName, wasFavorite, previousCount);
      throw error;
    } finally {
      this._pendingFavorites.delete(normalizedPatternName);
    }
  }

  private _applyOptimisticFavorite(patternName: string, wasFavorite: boolean, previousCount: number): void {
    if (wasFavorite) {
      this._favorites.delete(patternName);
      this._counts.set(patternName, Math.max(0, previousCount - 1));
      return;
    }

    this._favorites.add(patternName);
    this._counts.set(patternName, previousCount + 1);
  }

  private _rollbackOptimisticFavorite(patternName: string, wasFavorite: boolean, previousCount: number): void {
    if (wasFavorite) {
      this._favorites.add(patternName);
    } else {
      this._favorites.delete(patternName);
    }

    if (previousCount > 0) {
      this._counts.set(patternName, previousCount);
    } else {
      this._counts.delete(patternName);
    }
  }

  private _commitMutation(mutation: PatternFavoriteMutation): void {
    const normalizedPatternName = this._normalizePatternName(mutation.patternName);
    if (mutation.isFavorite) {
      this._favorites.add(normalizedPatternName);
    } else {
      this._favorites.delete(normalizedPatternName);
    }

    if (mutation.favoriteCount > 0) {
      this._counts.set(normalizedPatternName, mutation.favoriteCount);
    } else {
      this._counts.delete(normalizedPatternName);
    }
  }

  private _replaceSnapshot(snapshot: PatternFavoriteSnapshot): void {
    this._counts = new Map(
      Object.entries(snapshot.counts).map(([patternName, count]) => [this._normalizePatternName(patternName), count]),
    );
    this._favorites = new Set(snapshot.favorites.map((patternName) => this._normalizePatternName(patternName)));
    this._isLoaded = true;
  }

  private _normalizePatternName(patternName: string): string {
    return patternName.trim().toLowerCase();
  }
}

export const patternFavoriteService = new PatternFavoriteService();

export default PatternFavoriteService;
