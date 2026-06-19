import { getSql } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const sql = getSql();
  const result = await sql`SELECT version()`;
  return NextResponse.json(result[0]);
}
