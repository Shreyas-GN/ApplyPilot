import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { AuditAction } from "@applypilot/shared";
import type { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { AuditService, type AuditMeta } from "../audit/audit.service";
import { generateOpaqueToken, hashToken } from "./token.util";
import type { AccessTokenPayload } from "./token.types";

export interface RequestMeta extends AuditMeta {
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
}

export interface PublicUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
}

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async register(email: string, password: string, meta: RequestMeta): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Same external response as an unrelated validation error would give —
      // deliberately not more specific, to avoid confirming account
      // existence to an attacker probing emails. We still return 409
      // because this endpoint's own caller (the person registering) is the
      // most common case and deserves the clear "already have an account"
      // message; forgot-password is where we stay silent either way.
      throw new ConflictException("An account with this email already exists.");
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { email, passwordHash } });
      await tx.profile.create({ data: { userId: created.id } });
      return created;
    });

    await this.auditService.record(user.id, AuditAction.REGISTER, meta);
    await this.issueEmailVerification(user);
    const tokens = await this.issueTokenPair(user, meta);

    return { user: toPublicUser(user), tokens };
  }

  async login(email: string, password: string, meta: RequestMeta): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const valid = user?.passwordHash ? await argon2.verify(user.passwordHash, password) : false;

    if (!user || !valid) {
      await this.auditService.record(user?.id ?? null, AuditAction.LOGIN_FAILED, {
        ...meta,
        email,
      });
      throw new UnauthorizedException("Invalid email or password.");
    }

    await this.auditService.record(user.id, AuditAction.LOGIN_SUCCESS, meta);
    const tokens = await this.issueTokenPair(user, meta);
    return { user: toPublicUser(user), tokens };
  }

  async logout(rawRefreshToken: string | undefined, meta: RequestMeta): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    const result = await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count > 0) {
      const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
      await this.auditService.record(record?.userId ?? null, AuditAction.LOGOUT, meta);
    }
  }

  async refresh(rawRefreshToken: string | undefined, meta: RequestMeta): Promise<TokenPair> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException("Missing refresh token.");
    }
    const tokenHash = hashToken(rawRefreshToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!existing || existing.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token.");
    }

    if (existing.revokedAt) {
      // A revoked (already-rotated) token being presented again means the
      // token was either replayed or stolen. We cannot tell which, so the
      // safe response is to revoke the entire session rather than issue a
      // new token pair.
      await this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.auditService.record(existing.userId, AuditAction.TOKEN_REFRESH_REUSE_DETECTED, meta);
      throw new UnauthorizedException("Invalid or expired refresh token.");
    }

    const user = await this.prisma.user.findUnique({ where: { id: existing.userId } });
    if (!user) {
      throw new UnauthorizedException("Invalid or expired refresh token.");
    }

    const tokens = await this.prisma.$transaction(async (tx) => {
      const newRaw = generateOpaqueToken();
      const newHash = hashToken(newRaw);
      const refreshTtlDays = this.config.get<number>("JWT_REFRESH_TTL_DAYS") ?? 30;
      const created = await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: newHash,
          expiresAt: new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000),
          userAgent: meta.userAgent,
          ipAddress: meta.ipAddress,
        },
      });
      await tx.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date(), replacedByTokenId: created.id },
      });
      return { rawRefreshToken: newRaw };
    });

    await this.auditService.record(user.id, AuditAction.TOKEN_REFRESH, meta);
    const accessToken = await this.signAccessToken(user);
    return {
      accessToken,
      refreshToken: tokens.rawRefreshToken,
      accessTokenExpiresInSeconds: this.config.get<number>("JWT_ACCESS_TTL_SECONDS") ?? 900,
    };
  }

  async forgotPassword(email: string, meta: RequestMeta): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // No email-enumeration signal: identical response whether or not the
    // account exists. Only act when it does.
    if (!user) return;

    const raw = generateOpaqueToken();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });
    await this.emailService.sendPasswordReset(user.email, raw);
    await this.auditService.record(user.id, AuditAction.PASSWORD_RESET_REQUESTED, meta);
  }

  async resetPassword(rawToken: string, newPassword: string, meta: RequestMeta): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.consumedAt || record.expiresAt < new Date()) {
      throw new BadRequestException("This password reset link is invalid or has expired.");
    }

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      // Resetting the password invalidates every existing session — the
      // most likely reason someone resets a password is that a prior
      // session may be compromised.
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.auditService.record(record.userId, AuditAction.PASSWORD_RESET_COMPLETED, meta);
  }

  async verifyEmail(rawToken: string, meta: RequestMeta): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.consumedAt || record.expiresAt < new Date()) {
      throw new BadRequestException("This verification link is invalid or has expired.");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    await this.auditService.record(record.userId, AuditAction.EMAIL_VERIFIED, meta);
  }

  async resendEmailVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.emailVerifiedAt) {
      return; // already verified, or user vanished mid-request — nothing to do
    }
    await this.issueEmailVerification(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toPublicUser(user);
  }

  private async issueEmailVerification(user: User): Promise<void> {
    const raw = generateOpaqueToken();
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });
    await this.emailService.sendEmailVerification(user.email, raw);
    await this.auditService.record(user.id, AuditAction.EMAIL_VERIFICATION_SENT, {});
  }

  private async issueTokenPair(user: User, meta: RequestMeta): Promise<TokenPair> {
    const accessToken = await this.signAccessToken(user);
    const raw = generateOpaqueToken();
    const refreshTtlDays = this.config.get<number>("JWT_REFRESH_TTL_DAYS") ?? 30;

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken: raw,
      accessTokenExpiresInSeconds: this.config.get<number>("JWT_ACCESS_TTL_SECONDS") ?? 900,
    };
  }

  private async signAccessToken(user: User): Promise<string> {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email };
    return this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.config.get<number>("JWT_ACCESS_TTL_SECONDS") ?? 900,
    });
  }
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
    createdAt: user.createdAt,
  };
}
