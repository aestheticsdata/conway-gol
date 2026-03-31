import crypto from "node:crypto";
import { PrismaService } from "@db/prisma.service";
import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

import type { Request } from "express";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";
import type { ResetPasswordDto } from "./dto/reset-password.dto";
import type { UpdateProfileDto } from "./dto/update-profile.dto";
import type { VerifyPassphraseDto } from "./dto/verify-passphrase.dto";
import type { AppSession } from "./session.d";
import { resolveCanonicalAvatarId } from "../shared/user-avatar-ids";

export interface AuthUser {
  username: string;
  avatarId: string | null;
  csrfToken: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto, req: Request): Promise<AuthUser> {
    const [passwordHash, recoveryPassphraseHash] = await Promise.all([
      bcrypt.hash(dto.password, 12),
      bcrypt.hash(dto.recoveryPassphrase, 12),
    ]);

    let userId: string;
    try {
      const user = await this.prisma.user.create({
        data: { username: dto.username, passwordHash, recoveryPassphraseHash },
        select: { id: true, username: true },
      });
      userId = user.id;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        throw new ConflictException("Username or email already taken");
      }
      throw new InternalServerErrorException();
    }

    const csrfToken = crypto.randomBytes(32).toString("hex");
    await this._setAppSession(req, userId, csrfToken);

    return { username: dto.username, avatarId: null, csrfToken };
  }

  async login(dto: LoginDto, req: Request): Promise<AuthUser> {
    const user = await this.prisma.user.findFirst({
      where: { username: dto.username, deletedAt: null },
      select: { id: true, username: true, avatarId: true, passwordHash: true },
    });

    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const csrfToken = crypto.randomBytes(32).toString("hex");
    await this._setAppSession(req, user.id, csrfToken);

    return { username: user.username, avatarId: resolveCanonicalAvatarId(user.avatarId), csrfToken };
  }

  async logout(session: AppSession): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      session.destroy((err) => {
        if (err) reject(new InternalServerErrorException());
        else resolve();
      });
    });
  }

  async me(session: AppSession): Promise<AuthUser> {
    const userId = session.userId;
    if (!userId) throw new UnauthorizedException();

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { username: true, avatarId: true },
    });

    if (!user) throw new UnauthorizedException();

    if (!session.csrfToken) {
      session.csrfToken = crypto.randomBytes(32).toString("hex");
    }

    return { username: user.username, avatarId: resolveCanonicalAvatarId(user.avatarId), csrfToken: session.csrfToken };
  }

  async updateProfile(dto: UpdateProfileDto, session: AppSession): Promise<AuthUser> {
    const userId = session.userId;
    if (!userId) throw new UnauthorizedException();

    const data: { username?: string; avatarId?: string } = {};
    if (dto.username !== undefined) data.username = dto.username;
    if (dto.avatarId !== undefined) data.avatarId = dto.avatarId;

    let user: { username: string; avatarId: string | null };
    try {
      user = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: { username: true, avatarId: true },
      });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") throw new ConflictException("Username already taken");
      throw new InternalServerErrorException();
    }

    if (!session.csrfToken) {
      session.csrfToken = crypto.randomBytes(32).toString("hex");
    }

    return { username: user.username, avatarId: resolveCanonicalAvatarId(user.avatarId), csrfToken: session.csrfToken };
  }

  async verifyPassphrase(dto: VerifyPassphraseDto, session: AppSession): Promise<{ ok: true }> {
    const user = await this.prisma.user.findFirst({
      where: { username: dto.username, deletedAt: null },
      select: { id: true, recoveryPassphraseHash: true },
    });

    if (!user?.recoveryPassphraseHash || !(await bcrypt.compare(dto.recoveryPassphrase, user.recoveryPassphraseHash))) {
      throw new UnauthorizedException("Invalid username or recovery passphrase");
    }

    session.recoveryUserId = user.id;
    await new Promise<void>((resolve, reject) =>
      session.save((err) => (err ? reject(new InternalServerErrorException()) : resolve())),
    );

    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto, req: Request): Promise<AuthUser> {
    const session = req.session as AppSession;
    const recoveryUserId = session.recoveryUserId;
    if (!recoveryUserId) throw new UnauthorizedException("No pending recovery session");

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    const user = await this.prisma.user.update({
      where: { id: recoveryUserId },
      data: { passwordHash },
      select: { id: true, username: true },
    });

    delete session.recoveryUserId;

    const csrfToken = crypto.randomBytes(32).toString("hex");
    await this._setAppSession(req, user.id, csrfToken);

    return { username: user.username, avatarId: null, csrfToken };
  }

  private _setAppSession(req: Request, userId: string, csrfToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const session = req.session as AppSession;

      session.regenerate((err) => {
        if (err) {
          reject(new InternalServerErrorException());
          return;
        }

        const regeneratedSession = req.session as AppSession;
        regeneratedSession.userId = userId;
        regeneratedSession.csrfToken = csrfToken;
        regeneratedSession.save((saveErr) => {
          if (saveErr) reject(new InternalServerErrorException());
          else resolve();
        });
      });
    });
  }
}
