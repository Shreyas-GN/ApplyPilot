import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { PutObjectInput, StorageProvider } from "../storage.provider.interface";

// Any S3-compatible endpoint: AWS S3 itself, MinIO, Cloudflare R2, etc. —
// selected via STORAGE_PROVIDER=s3. See .env.example for required S3_* vars.
@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>("S3_BUCKET");
    this.client = new S3Client({
      region: config.getOrThrow<string>("S3_REGION"),
      endpoint: config.get<string>("S3_ENDPOINT"),
      forcePathStyle: config.get<boolean>("S3_FORCE_PATH_STYLE") ?? false,
      credentials: config.get<string>("S3_ACCESS_KEY_ID")
        ? {
            accessKeyId: config.getOrThrow<string>("S3_ACCESS_KEY_ID"),
            secretAccessKey: config.getOrThrow<string>("S3_SECRET_ACCESS_KEY"),
          }
        : undefined,
    });
  }

  async putObject(input: PutObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
