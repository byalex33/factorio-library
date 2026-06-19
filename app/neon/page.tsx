import { getSql } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

async function getDbVersion() {
  const sql = getSql();
  const result = await sql`SELECT version()`;
  return result[0].version as string;
}

export default async function NeonPage() {
  const version = await getDbVersion();

  return (
    <main>
      <h1>Next.js + Neon</h1>
      <p>PostgreSQL Version: {version}</p>
    </main>
  );
}
