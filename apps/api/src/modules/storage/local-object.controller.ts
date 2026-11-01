import { Controller, Get, NotFoundException, Query, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { LocalDiskStorageProvider } from "./providers/local-disk-storage.provider";

// Deliberately NOT behind JwtAuthGuard — this is the local-storage
// equivalent of an S3 presigned URL. The HMAC signature + expiry in the
// query string *is* the authorization, so it works from a plain browser
// navigation/download link the same way a real presigned S3 URL would.
// Only mounted meaningfully when STORAGE_PROVIDER=local; see storage.module.ts.
@Controller("storage/local-object")
export class LocalObjectController {
  constructor(
    private readonly provider: LocalDiskStorageProvider,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async download(
    @Query("key") key: string,
    @Query("exp") exp: string,
    @Query("sig") sig: string,
    @Res() res: Response,
  ): Promise<void> {
    if (this.config.get<string>("STORAGE_PROVIDER") !== "local") {
      throw new NotFoundException();
    }
    if (!key || !exp || !sig) {
      throw new NotFoundException();
    }
    try {
      const buffer = await this.provider.verifyAndRead(key, Number(exp), sig);
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Cache-Control", "private, max-age=0, no-store");
      res.send(buffer);
    } catch {
      throw new NotFoundException("Link is invalid or has expired.");
    }
  }
}
