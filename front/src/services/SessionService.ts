const SESSION_USERNAME_KEY = "cgl.session.username";
const SESSION_AVATAR_KEY = "cgl.session.avatar";
const DEFAULT_SESSION_USERNAME = "demo-user";
const DEFAULT_SESSION_AVATAR = "node-grid";

class SessionService {
  public getUsername(): string | null {
    try {
      const value = window.localStorage.getItem(SESSION_USERNAME_KEY)?.trim();
      return value ? value : null;
    } catch {
      return null;
    }
  }

  public getUsernameOrFallback(fallback = DEFAULT_SESSION_USERNAME): string {
    return this.getUsername() ?? fallback;
  }

  public setUsername(username: string): void {
    const normalized = username.trim();

    try {
      if (normalized.length === 0) {
        window.localStorage.removeItem(SESSION_USERNAME_KEY);
        return;
      }

      window.localStorage.setItem(SESSION_USERNAME_KEY, normalized);
    } catch {
      // Ignore storage failures in the demo flow.
    }
  }

  public getAvatarId(): string | null {
    try {
      const value = window.localStorage.getItem(SESSION_AVATAR_KEY)?.trim();
      return value ? value : null;
    } catch {
      return null;
    }
  }

  public getAvatarIdOrFallback(fallback = DEFAULT_SESSION_AVATAR): string {
    return this.getAvatarId() ?? fallback;
  }

  public setAvatarId(avatarId: string): void {
    const normalized = avatarId.trim();

    try {
      if (normalized.length === 0) {
        window.localStorage.removeItem(SESSION_AVATAR_KEY);
        return;
      }

      window.localStorage.setItem(SESSION_AVATAR_KEY, normalized);
    } catch {
      // Ignore storage failures in the demo flow.
    }
  }

  public clear(): void {
    try {
      window.localStorage.removeItem(SESSION_USERNAME_KEY);
      window.localStorage.removeItem(SESSION_AVATAR_KEY);
    } catch {
      // Ignore storage failures in the demo flow.
    }
  }
}

export default SessionService;
