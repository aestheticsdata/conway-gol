export const SESSION_COOKIE_NAME = "cgl.sid";
export const SESSION_COOKIE_MAX_AGE_MS = 20 * 60 * 1000;

export interface SessionCookieOptions {
  httpOnly: true;
  path: "/";
  secure: boolean;
  sameSite: "lax";
}

export function getSessionCookieOptions(isProduction: boolean): SessionCookieOptions {
  return {
    httpOnly: true,
    path: "/",
    secure: isProduction,
    sameSite: "lax",
  };
}
