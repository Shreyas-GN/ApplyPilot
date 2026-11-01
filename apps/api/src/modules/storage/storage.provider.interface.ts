export interface PutObjectInput {
  key: string;
  body: Buffer;
  contentType: string;
}

// S3-compatible abstraction (see docs/SYSTEM_ARCHITECTURE.md). Two
// implementations: local disk (dev/test default, no credentials) and
// S3 (any S3-compatible endpoint). Selected via STORAGE_PROVIDER.
export interface StorageProvider {
  putObject(input: PutObjectInput): Promise<void>;
  deleteObject(key: string): Promise<void>;
  /** A short-lived URL usable without an Authorization header — same trust
   * model as an S3 presigned URL: the signature *is* the authorization. */
  getSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
}

export const STORAGE_PROVIDER = "STORAGE_PROVIDER";
