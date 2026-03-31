import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { assertValidCsrfToken } from "./assert-valid-csrf-token";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { VerifyPassphraseDto } from "./dto/verify-passphrase.dto";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "./session.constants";
import { SessionAuthGuard } from "./session-auth.guard";

import type { Request, Response } from "express";
import type { AppSession } from "./session.d";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(201)
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  @Post("logout")
  @HttpCode(204)
  @UseGuards(SessionAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) response: Response) {
    const session = assertValidCsrfToken(req);
    await this.authService.logout(session);
    response.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions(process.env.NODE_ENV === "production"));
  }

  @Get("me")
  @UseGuards(SessionAuthGuard)
  me(@Req() req: Request) {
    return this.authService.me(req.session as AppSession);
  }

  @Patch("profile")
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  updateProfile(@Body() dto: UpdateProfileDto, @Req() req: Request) {
    const session = assertValidCsrfToken(req);
    return this.authService.updateProfile(dto, session);
  }

  @Post("verify-passphrase")
  @HttpCode(200)
  verifyPassphrase(@Body() dto: VerifyPassphraseDto, @Req() req: Request) {
    return this.authService.verifyPassphrase(dto, req.session as AppSession);
  }

  @Post("reset-password")
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(dto, req);
  }
}
