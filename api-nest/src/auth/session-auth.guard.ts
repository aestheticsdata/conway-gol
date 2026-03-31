import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

import type { Request } from "express";
import type { AppSession } from "./session.d";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const session = request.session as AppSession | undefined;

    if (!session?.userId) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
