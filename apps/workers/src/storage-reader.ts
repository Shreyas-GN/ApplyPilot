import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Read-only counterpart to apps/api's StorageProvider (which also writes
// and signs download URLs — this worker only ever needs to read bytes back
// out for text extraction). Deliberately a separate, minimal client rather
// than importing apps/api: apps don't depend on other apps in this
// monorepo; both read the same STORAGE_PROVIDER/S3_*/LOCAL_STORAGE_DIR env
// vars so they always agree on where a given resume's bytes live.

export interface StorageReaderEnv {
  STORAGE_PROVIDER: string;
  LOCAL_STORAGE_DIR: string;
  S3_BUCKET?: string;
  S3_REGION?: string;
  S3_ENDPOINT?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  S3_FORCE_PATH_STYLE?: boolean;
}

export async function readStorageObject(key: string, env: StorageReaderEnv): Promise<Buffer> {
  if (env.STORAGE_PROVIDER === "s3") {
    const client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE ?? false,
      credentials: env.S3_ACCESS_KEY_ID
        ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? "" }
        : undefined,
    });
    const result = await client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
    const chunks: Buffer[] = [];
    for await (const chunk of result.Body as AsyncIterable<Buffer>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  const path = resolve(env.LOCAL_STORAGE_DIR, key);
  return readFile(path);
}
