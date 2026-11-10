import { defineConfig } from 'drizzle-kit';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Parse .env.local manually so dotenv dep is not required
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...vals] = trimmed.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_MIGRATION_URL ||
      process.env.DATABASE_URL ||
      'postgresql://postgres.nnaxrcknrbnaukyeotvq:Makememad%401122@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  },
});
