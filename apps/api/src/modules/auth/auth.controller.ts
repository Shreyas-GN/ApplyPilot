import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import type { AuthTokensDto, AuthUserDto } from "@applypilot/shared";
import { AuthService, type RequestMeta } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";

const REFRESH_COOKIE_NAME = "refresh_token";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthUserDto; tokens: AuthTokensDto }> {
    const { user, tokens } = await this.authService.register(dto.email, dto.password, meta(req));
    this.setRefreshCookie(res, tokens.refreshToken);
    return { user: userToDto(user), tokens: tokensToDto(tokens) };
  }

  @Post("login")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthUserDto; tokens: AuthTokensDto }> {
    const { user, tokens } = await this.authService.login(dto.email, dto.password, meta(req));
    this.setRefreshCookie(res, tokens.refreshToken);
    return { user: userToDto(user), tokens: tokensToDto(tokens) };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.authService.logout(req.cookies?.[REFRESH_COOKIE_NAME], meta(req));
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
  }

  @Post("refresh")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ tokens: AuthTokensDto }> {
    const tokens = await this.authService.refresh(req.cookies?.[REFRESH_COOKIE_NAME], meta(req));
    this.setRefreshCookie(res, tokens.refreshToken);
    return { tokens: tokensToDto(tokens) };
  }

  @Post("forgot-password")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request): Promise<void> {
    await this.authService.forgotPassword(dto.email, meta(req));
  }

  @Post("reset-password")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request): Promise<void> {
    await this.authService.resetPassword(dto.token, dto.password, meta(req));
  }

  @Post("verify-email")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request): Promise<void> {
    await this.authService.verifyEmail(dto.token, meta(req));
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserDto> {
    return userToDto(await this.authService.me(user.id));
  }

  @Post("resend-verification")
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  async resendVerification(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.resendEmailVerification(user.id);
  }

  private setRefreshCookie(res: Response, rawRefreshToken: string): void {
    const refreshTtlDays = this.config.get<number>("JWT_REFRESH_TTL_DAYS") ?? 30;
    res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, {
      httpOnly: true,
      secure: this.config.get<string>("NODE_ENV") === "production",
      sameSite: "strict",
      path: "/api/v1/auth",
      maxAge: refreshTtlDays * 24 * 60 * 60 * 1000,
    });
  }
}

function meta(req: Request): RequestMeta {
  const userAgent = req.headers["user-agent"];
  return {
    ipAddress: req.ip,
    userAgent: typeof userAgent === "string" ? userAgent : undefined,
  };
}

function userToDto(user: { id: string; email: string; emailVerified: boolean; createdAt: Date }): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

function tokensToDto(tokens: { accessToken: string; accessTokenExpiresInSeconds: number }): AuthTokensDto {
  return {
    accessToken: tokens.accessToken,
    accessTokenExpiresInSeconds: tokens.accessTokenExpiresInSeconds,
  };
}
