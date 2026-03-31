import { ForbiddenException } from "@nestjs/common";

import type { Request } from "express";
import type { AppSession } from "./session.d";

export function assertValidCsrfToken(req: Request): AppSession {
  const session = req.session as AppSession;
  const csrfToken = req.headers["x-csrf-token"];

  if (typeof csrfToken !== "string" || csrfToken !== session.csrfToken) {
    throw new ForbiddenException("Invalid CSRF token");
  }

  return session;
}
