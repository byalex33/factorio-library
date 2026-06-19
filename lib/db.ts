import "server-only";

import { neon } from "@neondatabase/serverless";

type SqlTemplate = <T = Record<string, unknown>[]>(strings: TemplateStringsArray, ...params: unknown[]) => Promise<T>;

let sqlClient: SqlTemplate | null = null;

export function getSql(): SqlTemplate {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured. Add your Neon connection string to .env.local and Vercel Environment Variables.");
  }

  sqlClient ??= neon(databaseUrl) as unknown as SqlTemplate;
  return sqlClient;
}
