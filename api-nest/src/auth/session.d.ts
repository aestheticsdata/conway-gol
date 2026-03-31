import type { Session } from "express-session";

/**
 * Application session — extends express-session's Session with our custom fields.
 * Use this type instead of the bare Session type in auth-related code.
 */
export interface AppSession extends Session {
  userId?: string;
  csrfToken?: string;
  /** Temporary: userId awaiting password reset (set by verify-passphrase, consumed by reset-password) */
  recoveryUserId?: string;
}
