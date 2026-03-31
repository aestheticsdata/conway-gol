import { httpClient } from "@infra/http/HttpClient";
import AuthService from "@services/AuthService";
import SessionService from "@services/SessionService";

export interface AuthenticatedSessionUser {
  username: string;
  avatarId: string | null;
  csrfToken: string;
}

export interface SessionCapabilities {
  canAccessSettings: boolean;
  canFavoritePatterns: boolean;
  canSaveDrawings: boolean;
}

export interface SessionViewer {
  avatarId: string;
  capabilities: SessionCapabilities;
  mode: AuthSessionMode;
  username: string;
}

export type AuthSessionMode = "authenticated" | "guest";

type AuthSessionStatus = AuthSessionMode | "unknown";

const GUEST_USERNAME = "Guest";

class AuthSessionService {
  private _status: AuthSessionStatus = "unknown";

  constructor(
    private readonly _auth = new AuthService(),
    private readonly _session = new SessionService(),
  ) {}

  public isAuthenticated(): boolean {
    return this._status === "authenticated";
  }

  public mode(): AuthSessionMode {
    return this._status === "authenticated" ? "authenticated" : "guest";
  }

  public capabilities(): SessionCapabilities {
    if (this.isAuthenticated()) {
      return {
        canAccessSettings: true,
        canFavoritePatterns: true,
        canSaveDrawings: true,
      };
    }

    return {
      canAccessSettings: false,
      canFavoritePatterns: false,
      canSaveDrawings: false,
    };
  }

  public getViewer(): SessionViewer {
    return {
      mode: this.mode(),
      username: this.isAuthenticated() ? this._session.getUsernameOrFallback() : GUEST_USERNAME,
      avatarId: this._session.getAvatarIdOrFallback(),
      capabilities: this.capabilities(),
    };
  }

  public sessionCacheKey(): string {
    return this.isAuthenticated() ? `authenticated:${this._session.getUsernameOrFallback()}` : "guest";
  }

  public setAuthenticatedUser(user: AuthenticatedSessionUser): void {
    httpClient.setCsrfToken(user.csrfToken);
    this._session.setUsername(user.username);
    this._session.setAvatarId(user.avatarId ?? this._session.getAvatarIdOrFallback());
    this._status = "authenticated";
  }

  public async restore(): Promise<AuthSessionMode> {
    if (this._status !== "unknown") {
      return this.mode();
    }

    try {
      this.setAuthenticatedUser(await this._auth.me());
      return "authenticated";
    } catch {
      this.setGuest();
      return "guest";
    }
  }

  public async logout(): Promise<void> {
    try {
      await this._auth.logout();
    } finally {
      this.clearLocal();
    }
  }

  public setGuest(): void {
    this.clearLocal();
  }

  public clearLocal(): void {
    this._status = "guest";
    httpClient.clearCsrfToken();
    this._session.clear();
  }
}

export const authSessionService = new AuthSessionService();

export default AuthSessionService;
