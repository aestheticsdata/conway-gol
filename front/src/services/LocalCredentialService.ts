const ACCOUNT_PASSWORD_KEY = "cgl.account.password";
const ACCOUNT_RECOVERY_PASSPHRASE_KEY = "cgl.account.recovery_passphrase";

class LocalCredentialService {
  public getPassword(): string | null {
    try {
      const value = window.localStorage.getItem(ACCOUNT_PASSWORD_KEY)?.trim();
      return value ? value : null;
    } catch {
      return null;
    }
  }

  public setPassword(password: string): void {
    const normalized = password.trim();

    try {
      if (normalized.length === 0) {
        window.localStorage.removeItem(ACCOUNT_PASSWORD_KEY);
        return;
      }

      window.localStorage.setItem(ACCOUNT_PASSWORD_KEY, normalized);
    } catch {
      // Ignore storage failures in the demo flow.
    }
  }

  public getRecoveryPassphrase(): string | null {
    try {
      const value = window.localStorage.getItem(ACCOUNT_RECOVERY_PASSPHRASE_KEY)?.trim();
      return value ? value : null;
    } catch {
      return null;
    }
  }

  public setRecoveryPassphrase(passphrase: string): void {
    const normalized = passphrase.trim();

    try {
      if (normalized.length === 0) {
        window.localStorage.removeItem(ACCOUNT_RECOVERY_PASSPHRASE_KEY);
        return;
      }

      window.localStorage.setItem(ACCOUNT_RECOVERY_PASSPHRASE_KEY, normalized);
    } catch {
      // Ignore storage failures in the demo flow.
    }
  }
}

export default LocalCredentialService;
