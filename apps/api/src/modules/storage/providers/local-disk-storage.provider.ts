import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, normalize, resolve } from "node:path";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { PutObjectInput, StorageProvider } from "../storage.provider.interface";

// Local-development / test default — no credentials required. Files live
// under LOCAL_STORAGE_DIR; "signed URLs" are HMAC-signed links back at this
// API's own object-serving route (see local-object.controller.ts), the same
// trust model as an S3 presigned URL.
@Injectable()
export class LocalDiskStorageProvider implements StorageProvider {
  private readonly rootDir: string;
  private readonly signingSecret: string;
  private readonly apiBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.rootDir = resolve(this.config.get<string>("LOCAL_STORAGE_DIR") ?? "../../.local-storage");
    this.signingSecret = this.config.getOrThrow<string>("JWT_ACCESS_SECRET");
    this.apiBaseUrl = this.config.get<string>("API_BASE_URL") ?? "http://localhost:3001/api/v1";
  }

  async putObject(input: PutObjectInput): Promise<void> {
    const path = this.resolveSafePath(input.key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, input.body);
  }

  async deleteObject(key: string): Promise<void> {
    const path = this.resolveSafePath(key);
    await rm(path, { force: true });
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const sig = this.sign(key, exp);
    const params = new URLSearchParams({ key, exp: String(exp), sig });
    return `${this.apiBaseUrl}/storage/local-object?${params.toString()}`;
  }

  /** Used only by the local-object controller — not part of the public interface. */
  verifyAndRead(key: string, exp: number, sig: string): Promise<Buffer> {
    if (exp < Math.floor(Date.now() / 1000)) {
      throw new Error("expired");
    }
    const expected = this.sign(key, exp);
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      throw new Error("invalid signature");
    }
    return readFile(this.resolveSafePath(key));
  }

  private sign(key: string, exp: number): string {
    return createHmac("sha256", this.signingSecret).update(`${key}:${exp}`).digest("hex");
  }

  private resolveSafePath(key: string): string {
    // Defense in depth against a crafted key escaping the storage root
    // (e.g. "../../etc/passwd") even though keys are always server-generated.
    const path = resolve(this.rootDir, normalize(key).replace(/^(\.\.(\/|\\|$))+/, ""));
    if (!path.startsWith(this.rootDir)) {
      throw new Error("Resolved path escapes storage root");
    }
    return path;
  }
}
