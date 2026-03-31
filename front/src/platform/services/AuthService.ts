import { httpClient } from "@infra/http/HttpClient";

export interface AuthUser {
  username: string;
  avatarId: string | null;
  csrfToken: string;
}

class AuthService {
  async register(username: string, password: string, recoveryPassphrase: string): Promise<AuthUser> {
    return httpClient.post<AuthUser, { username: string; password: string; recoveryPassphrase: string }>(
      "/auth/register",
      { username, password, recoveryPassphrase },
    );
  }

  async login(username: string, password: string): Promise<AuthUser> {
    return httpClient.post<AuthUser, { username: string; password: string }>("/auth/login", { username, password });
  }

  async logout(): Promise<void> {
    return httpClient.post<void, Record<string, never>>("/auth/logout", {});
  }

  async me(): Promise<AuthUser> {
    return httpClient.get<AuthUser>("/auth/me");
  }

  async verifyPassphrase(username: string, recoveryPassphrase: string): Promise<{ ok: true }> {
    return httpClient.post<{ ok: true }, { username: string; recoveryPassphrase: string }>("/auth/verify-passphrase", {
      username,
      recoveryPassphrase,
    });
  }

  async resetPassword(newPassword: string): Promise<AuthUser> {
    return httpClient.post<AuthUser, { newPassword: string }>("/auth/reset-password", { newPassword });
  }

  async updateProfile(username: string, avatarId: string): Promise<AuthUser> {
    return httpClient.patch<AuthUser, { username: string; avatarId: string }>("/auth/profile", { username, avatarId });
  }
}

export default AuthService;
