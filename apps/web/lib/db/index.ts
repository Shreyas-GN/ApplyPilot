import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.nnaxrcknrbnaukyeotvq:Makememad%401122@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn =
  globalForDb.conn ??
  postgres(connectionString, {
    prepare: false,
    fetch_types: false,
    max: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 10,
    connect_timeout: 15,
  });
globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
export * from './schema';

