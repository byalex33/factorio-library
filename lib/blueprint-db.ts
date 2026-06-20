import "server-only";

import { getSql } from "@/lib/db";
import {
  blueprintCategories,
  formatUsername,
  makeRecordId,
  normalizeGameVersion,
  normalizePositiveInteger,
  normalizeStoredBlueprint,
  normalizeStoredBlueprintReport,
  normalizeStoredBlueprintUpdate,
  type ArchiveStats,
  type BlueprintStats,
  type BlueprintWithStats,
  type StoredBlueprint,
  type StoredBlueprintReport,
  type StoredBlueprintUpdate,
} from "@/lib/blueprints";

let schemaReady: Promise<void> | null = null;

type BlueprintRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  game_version: string;
  tags: unknown;
  blueprint_string: string;
  author: string;
  author_user_id: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  views: number | string | null;
  copies: number | string | null;
  likes: number | string | null;
};

type UpdateRow = {
  id: string;
  blueprint_id: string;
  changes: string;
  blueprint_string: string;
  created_at: string | Date;
};

type ReportRow = {
  id: string;
  blueprint_id: string;
  blueprint_title: string;
  blueprint_author: string;
  reason: string;
  details: string | null;
  reporter: string;
  created_at: string | Date;
};

function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return (value as unknown[]).filter((tag): tag is string => typeof tag === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as unknown[]).filter((tag): tag is string => typeof tag === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapUpdate(row: UpdateRow): StoredBlueprintUpdate {
  return {
    id: row.id,
    changes: row.changes,
    blueprintString: row.blueprint_string,
    createdAt: toIsoString(row.created_at),
  };
}

function mapReport(row: ReportRow): StoredBlueprintReport {
  return {
    id: row.id,
    blueprintId: row.blueprint_id,
    blueprintTitle: row.blueprint_title,
    blueprintAuthor: row.blueprint_author,
    reason: row.reason,
    details: row.details ?? "",
    reporter: row.reporter,
    createdAt: toIsoString(row.created_at),
  };
}

function mapBlueprint(row: BlueprintRow, updates: StoredBlueprintUpdate[] = []): BlueprintWithStats {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: blueprintCategories.includes(row.category) ? row.category : "Other",
    gameVersion: normalizeGameVersion(row.game_version),
    tags: parseTags(row.tags),
    blueprintString: row.blueprint_string,
    author: formatUsername(row.author),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    updates,
    views: normalizePositiveInteger(row.views),
    copies: normalizePositiveInteger(row.copies),
    likes: normalizePositiveInteger(row.likes),
  };
}

export async function ensureBlueprintSchema() {
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    const sql = getSql();

    await sql`
      CREATE TABLE IF NOT EXISTS blueprints (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'Other',
        game_version TEXT NOT NULL DEFAULT '2.0.0',
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        blueprint_string TEXT NOT NULL,
        author TEXT NOT NULL,
        author_user_id TEXT,
        views INTEGER NOT NULL DEFAULT 0,
        copies INTEGER NOT NULL DEFAULT 0,
        likes INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS blueprint_updates (
        id TEXT PRIMARY KEY,
        blueprint_id TEXT NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
        changes TEXT NOT NULL,
        blueprint_string TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS blueprint_reports (
        id TEXT PRIMARY KEY,
        blueprint_id TEXT NOT NULL,
        blueprint_title TEXT NOT NULL,
        blueprint_author TEXT NOT NULL,
        reason TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '',
        reporter TEXT NOT NULL DEFAULT 'anonymous',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS blueprint_likes (
        blueprint_id TEXT NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
        user_key TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (blueprint_id, user_key)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS blueprints_updated_at_idx ON blueprints(updated_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS blueprints_created_at_idx ON blueprints(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS blueprints_category_idx ON blueprints(category)`;
    await sql`CREATE INDEX IF NOT EXISTS blueprint_reports_created_at_idx ON blueprint_reports(created_at DESC)`;
  })();

  return schemaReady;
}

export async function listBlueprints({ query = "", limit = 200 }: { query?: string; limit?: number } = {}) {
  await ensureBlueprintSchema();
  const sql = getSql();
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 500);
  const normalizedQuery = query.trim().toLowerCase();

  const rows = await sql<BlueprintRow[]>`
    SELECT * FROM blueprints
    ORDER BY updated_at DESC
    LIMIT ${safeLimit}
  `;

  const blueprints = rows.map((row) => mapBlueprint(row));
  if (!normalizedQuery) return blueprints;

  return blueprints.filter((blueprint) =>
    [blueprint.title, blueprint.category, blueprint.author, blueprint.description, blueprint.tags.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

export async function listRecentBlueprints(limit = 3) {
  await ensureBlueprintSchema();
  const sql = getSql();
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 12);
  const rows = await sql<BlueprintRow[]>`
    SELECT * FROM blueprints
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;

  return rows.map((row) => mapBlueprint(row));
}

export async function getBlueprint(id: string) {
  await ensureBlueprintSchema();
  const sql = getSql();
  const rows = await sql<BlueprintRow[]>`SELECT * FROM blueprints WHERE id = ${id.trim()} LIMIT 1`;
  const row = rows[0];
  if (!row) return null;

  const updateRows = await sql<UpdateRow[]>`
    SELECT * FROM blueprint_updates
    WHERE blueprint_id = ${row.id}
    ORDER BY created_at DESC
  `;

  return mapBlueprint(row, updateRows.map(mapUpdate));
}

export async function createBlueprint(blueprint: StoredBlueprint, authorUserId: string) {
  await ensureBlueprintSchema();
  const sql = getSql();
  const normalized = normalizeStoredBlueprint(blueprint);
  if (!normalized) throw new Error("Invalid blueprint.");

  const rows = await sql<BlueprintRow[]>`
    INSERT INTO blueprints (
      id, title, description, category, game_version, tags, blueprint_string, author, author_user_id, created_at, updated_at
    ) VALUES (
      ${normalized.id}, ${normalized.title}, ${normalized.description}, ${normalized.category}, ${normalized.gameVersion},
      ${JSON.stringify(normalized.tags)}::jsonb, ${normalized.blueprintString}, ${normalized.author}, ${authorUserId},
      ${normalized.createdAt}, ${normalized.updatedAt}
    )
    RETURNING *
  `;

  return mapBlueprint(rows[0]);
}

export async function postBlueprintUpdate({
  blueprintId,
  changes,
  blueprintString,
  actorUserId,
  isAdmin,
}: {
  blueprintId: string;
  changes: string;
  blueprintString: string;
  actorUserId: string;
  isAdmin: boolean;
}) {
  await ensureBlueprintSchema();
  const sql = getSql();
  const existing = await sql<Pick<BlueprintRow, "id" | "author_user_id">[]>`
    SELECT id, author_user_id FROM blueprints WHERE id = ${blueprintId.trim()} LIMIT 1
  `;
  const row = existing[0];
  if (!row) throw new Error("Blueprint not found.");
  if (!isAdmin && row.author_user_id && row.author_user_id !== actorUserId) throw new Error("Only the author can post updates.");

  const updateId = makeRecordId("update");
  await sql`
    INSERT INTO blueprint_updates (id, blueprint_id, changes, blueprint_string)
    VALUES (${updateId}, ${row.id}, ${changes.trim()}, ${blueprintString.trim()})
  `;
  await sql`
    UPDATE blueprints
    SET blueprint_string = ${blueprintString.trim()}, updated_at = NOW()
    WHERE id = ${row.id}
  `;

  const updated = await getBlueprint(row.id);
  if (!updated) throw new Error("Blueprint not found after update.");
  return updated;
}

export async function listReports() {
  await ensureBlueprintSchema();
  const sql = getSql();
  const rows = await sql<ReportRow[]>`
    SELECT * FROM blueprint_reports
    ORDER BY created_at DESC
    LIMIT 200
  `;

  return rows.map(mapReport);
}

export async function createReport(report: Omit<StoredBlueprintReport, "id" | "createdAt">) {
  await ensureBlueprintSchema();
  const sql = getSql();
  const normalized = normalizeStoredBlueprintReport({
    ...report,
    id: makeRecordId("report"),
    createdAt: new Date().toISOString(),
  });
  if (!normalized) throw new Error("Invalid report.");

  const rows = await sql<ReportRow[]>`
    INSERT INTO blueprint_reports (id, blueprint_id, blueprint_title, blueprint_author, reason, details, reporter, created_at)
    VALUES (
      ${normalized.id}, ${normalized.blueprintId}, ${normalized.blueprintTitle}, ${normalized.blueprintAuthor},
      ${normalized.reason}, ${normalized.details}, ${normalized.reporter}, ${normalized.createdAt}
    )
    RETURNING *
  `;

  return mapReport(rows[0]);
}

export async function dismissReport(id: string) {
  await ensureBlueprintSchema();
  const sql = getSql();
  await sql`DELETE FROM blueprint_reports WHERE id = ${id.trim()}`;
}

export async function clearReports() {
  await ensureBlueprintSchema();
  const sql = getSql();
  await sql`DELETE FROM blueprint_reports`;
}

export async function getArchiveStats(): Promise<ArchiveStats> {
  await ensureBlueprintSchema();
  const sql = getSql();
  const rows = await sql<{ blueprints: string | number; copies: string | number | null; categories: string | number }[]>`
    SELECT
      COUNT(*) AS blueprints,
      COALESCE(SUM(copies), 0) AS copies,
      COUNT(DISTINCT NULLIF(category, '')) AS categories
    FROM blueprints
  `;
  const row = rows[0];

  return {
    blueprints: normalizePositiveInteger(row?.blueprints),
    copies: normalizePositiveInteger(row?.copies),
    categories: normalizePositiveInteger(row?.categories),
  };
}

export async function incrementBlueprintViews(id: string): Promise<BlueprintStats | null> {
  await ensureBlueprintSchema();
  const sql = getSql();
  const rows = await sql<Pick<BlueprintRow, "views" | "copies" | "likes">[]>`
    UPDATE blueprints
    SET views = views + 1
    WHERE id = ${id.trim()}
    RETURNING views, copies, likes
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    views: normalizePositiveInteger(row.views),
    copies: normalizePositiveInteger(row.copies),
    likes: normalizePositiveInteger(row.likes),
  };
}

export async function incrementBlueprintCopies(id: string): Promise<BlueprintStats | null> {
  await ensureBlueprintSchema();
  const sql = getSql();
  const rows = await sql<Pick<BlueprintRow, "views" | "copies" | "likes">[]>`
    UPDATE blueprints
    SET copies = copies + 1
    WHERE id = ${id.trim()}
    RETURNING views, copies, likes
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    views: normalizePositiveInteger(row.views),
    copies: normalizePositiveInteger(row.copies),
    likes: normalizePositiveInteger(row.likes),
  };
}

export async function getBlueprintLikeState(blueprintId: string, userKey: string, initialCount = 0) {
  await ensureBlueprintSchema();
  const sql = getSql();
  const id = blueprintId.trim();
  const rows = await sql<Pick<BlueprintRow, "likes">[]>`SELECT likes FROM blueprints WHERE id = ${id} LIMIT 1`;
  const blueprint = rows[0];
  if (!blueprint) return { count: normalizePositiveInteger(initialCount), liked: false };

  const likes = await sql<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1 FROM blueprint_likes WHERE blueprint_id = ${id} AND user_key = ${userKey}
    ) AS exists
  `;

  return { count: normalizePositiveInteger(blueprint.likes), liked: Boolean(likes[0]?.exists) };
}

export async function toggleBlueprintLikeInDb(blueprintId: string, userKey: string, initialCount = 0) {
  await ensureBlueprintSchema();
  const sql = getSql();
  const id = blueprintId.trim();
  const current = await getBlueprintLikeState(id, userKey, initialCount);

  if (current.liked) {
    await sql`DELETE FROM blueprint_likes WHERE blueprint_id = ${id} AND user_key = ${userKey}`;
    const rows = await sql<Pick<BlueprintRow, "likes">[]>`
      UPDATE blueprints
      SET likes = GREATEST(likes - 1, 0)
      WHERE id = ${id}
      RETURNING likes
    `;
    return { count: normalizePositiveInteger(rows[0]?.likes), liked: false };
  }

  const inserted = await sql<{ blueprint_id: string }[]>`
    INSERT INTO blueprint_likes (blueprint_id, user_key)
    VALUES (${id}, ${userKey})
    ON CONFLICT DO NOTHING
    RETURNING blueprint_id
  `;

  if (inserted.length) {
    const rows = await sql<Pick<BlueprintRow, "likes">[]>`
      UPDATE blueprints
      SET likes = likes + 1
      WHERE id = ${id}
      RETURNING likes
    `;
    return { count: normalizePositiveInteger(rows[0]?.likes), liked: true };
  }

  return getBlueprintLikeState(id, userKey, initialCount);
}

export async function deleteBlueprints(ids: string[]) {
  await ensureBlueprintSchema();
  const sql = getSql();
  for (const id of ids.map((item) => item.trim()).filter(Boolean)) {
    await sql`DELETE FROM blueprints WHERE id = ${id}`;
  }
}

export async function clearBlueprints() {
  await ensureBlueprintSchema();
  const sql = getSql();
  await sql`DELETE FROM blueprints`;
}

export async function importBlueprintRecords(blueprints: StoredBlueprint[], mode: "merge" | "replace", authorUserId: string) {
  await ensureBlueprintSchema();
  const sql = getSql();
  if (mode === "replace") await clearBlueprints();

  let imported = 0;
  for (const item of blueprints) {
    const normalized = normalizeStoredBlueprint(item);
    if (!normalized) continue;

    await sql`
      INSERT INTO blueprints (
        id, title, description, category, game_version, tags, blueprint_string, author, author_user_id, created_at, updated_at
      ) VALUES (
        ${normalized.id}, ${normalized.title}, ${normalized.description}, ${normalized.category}, ${normalized.gameVersion},
        ${JSON.stringify(normalized.tags)}::jsonb, ${normalized.blueprintString}, ${normalized.author}, ${authorUserId},
        ${normalized.createdAt}, ${normalized.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        game_version = EXCLUDED.game_version,
        tags = EXCLUDED.tags,
        blueprint_string = EXCLUDED.blueprint_string,
        author = EXCLUDED.author,
        updated_at = EXCLUDED.updated_at
    `;

    await sql`DELETE FROM blueprint_updates WHERE blueprint_id = ${normalized.id}`;
    for (const update of normalized.updates.map(normalizeStoredBlueprintUpdate).filter((update): update is StoredBlueprintUpdate => Boolean(update))) {
      await sql`
        INSERT INTO blueprint_updates (id, blueprint_id, changes, blueprint_string, created_at)
        VALUES (${update.id}, ${normalized.id}, ${update.changes}, ${update.blueprintString}, ${update.createdAt})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    imported += 1;
  }

  return imported;
}
