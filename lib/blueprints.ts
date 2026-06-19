export type GameVersion = (typeof gameVersions)[number];

export type StoredBlueprintUpdate = {
  id: string;
  changes: string;
  blueprintString: string;
  createdAt: string;
};

export type StoredBlueprint = {
  id: string;
  title: string;
  description: string;
  category: string;
  gameVersion: GameVersion;
  tags: string[];
  blueprintString: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  updates: StoredBlueprintUpdate[];
};

export type StoredBlueprintReport = {
  id: string;
  blueprintId: string;
  blueprintTitle: string;
  blueprintAuthor: string;
  reason: string;
  details: string;
  reporter: string;
  createdAt: string;
};

export type BlueprintStats = {
  views: number;
  copies: number;
  likes: number;
};

export type BlueprintWithStats = StoredBlueprint & BlueprintStats;

export type ArchiveStats = {
  blueprints: number;
  copies: number;
  categories: number;
};

export const MAX_BLUEPRINT_STRING_LENGTH = 2_000_000;
export const MAX_STORED_BLUEPRINTS = 100;

export const blueprintCategories = [
  "Smelting",
  "Trains",
  "Circuits",
  "Science",
  "Power",
  "Belt Balancers",
  "Mining",
  "Oil",
  "Mall / Hub",
  "Defense",
  "Space Age",
  "Other",
];

export const gameVersions = ["1.0.0", "2.0.0"] as const;
const DEFAULT_GAME_VERSION: GameVersion = "2.0.0";

export function makeBlueprintId(title: string) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "blueprint";

  return `${slug}-${Date.now().toString(36)}`;
}

export function makeRecordId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function formatUsername(value: string) {
  return value.trim().replace(/^@+/, "") || "factory-builder";
}

export function validateBlueprintString(value: string) {
  const blueprint = value.trim();

  if (!blueprint) return "Paste a Factorio blueprint string.";
  if (!blueprint.startsWith("0")) return "Factorio blueprint strings should start with 0.";
  if (blueprint.length < 20) return "That blueprint string looks too short.";
  if (blueprint.length > MAX_BLUEPRINT_STRING_LENGTH) return "That blueprint string is too large to store.";
  if (/\s/.test(blueprint)) return "Blueprint strings cannot contain spaces or line breaks.";

  return null;
}

export function normalizePositiveInteger(value: unknown) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

export function normalizeGameVersion(value: unknown): GameVersion {
  const gameVersion = asTrimmedString(value, 30);
  return gameVersions.includes(gameVersion as GameVersion) ? (gameVersion as GameVersion) : DEFAULT_GAME_VERSION;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function asTrimmedString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function normalizeStoredBlueprintUpdate(value: unknown): StoredBlueprintUpdate | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = asTrimmedString(record.id, 120);
  const changes = asTrimmedString(record.changes, 1_000);
  const blueprintString = asTrimmedString(record.blueprintString, MAX_BLUEPRINT_STRING_LENGTH);
  const createdAt = asTrimmedString(record.createdAt, 40);
  const normalizedCreatedAt = Number.isNaN(Date.parse(createdAt)) ? new Date().toISOString() : createdAt;

  if (!id || !changes || validateBlueprintString(blueprintString)) return null;

  return { id, changes, blueprintString, createdAt: normalizedCreatedAt };
}

export function normalizeStoredBlueprintReport(value: unknown): StoredBlueprintReport | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = asTrimmedString(record.id, 120);
  const blueprintId = asTrimmedString(record.blueprintId, 120);
  const blueprintTitle = asTrimmedString(record.blueprintTitle, 90);
  const blueprintAuthor = formatUsername(asTrimmedString(record.blueprintAuthor, 80) || "unknown");
  const reason = asTrimmedString(record.reason, 80);
  const details = asTrimmedString(record.details, 1_000);
  const reporter = asTrimmedString(record.reporter, 120) || "anonymous";
  const createdAt = asTrimmedString(record.createdAt, 40);
  const normalizedCreatedAt = Number.isNaN(Date.parse(createdAt)) ? new Date().toISOString() : createdAt;

  if (!id || !blueprintId || !blueprintTitle || !reason) return null;

  return { id, blueprintId, blueprintTitle, blueprintAuthor, reason, details, reporter, createdAt: normalizedCreatedAt };
}

export function normalizeStoredBlueprint(value: unknown): StoredBlueprint | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = asTrimmedString(record.id, 120);
  const title = asTrimmedString(record.title, 90);
  const blueprintString = asTrimmedString(record.blueprintString, MAX_BLUEPRINT_STRING_LENGTH);
  const createdAt = asTrimmedString(record.createdAt, 40);
  const updatedAt = asTrimmedString(record.updatedAt, 40) || createdAt;

  if (!id || !title || validateBlueprintString(blueprintString)) return null;

  const normalizedCreatedAt = Number.isNaN(Date.parse(createdAt)) ? new Date().toISOString() : createdAt;
  const normalizedUpdatedAt = Number.isNaN(Date.parse(updatedAt)) ? normalizedCreatedAt : updatedAt;
  const normalizedCategory = asTrimmedString(record.category, 80);

  return {
    id,
    title,
    description: asTrimmedString(record.description, 700),
    category: blueprintCategories.includes(normalizedCategory) ? normalizedCategory : "Other",
    gameVersion: normalizeGameVersion(record.gameVersion),
    tags: Array.isArray(record.tags)
      ? record.tags
          .map((tag) => asTrimmedString(tag, 40))
          .filter(Boolean)
          .slice(0, 12)
      : [],
    blueprintString,
    author: formatUsername(asTrimmedString(record.author, 80) || "factory-builder"),
    createdAt: normalizedCreatedAt,
    updatedAt: normalizedUpdatedAt,
    updates: Array.isArray(record.updates)
      ? record.updates
          .map(normalizeStoredBlueprintUpdate)
          .filter((update): update is StoredBlueprintUpdate => Boolean(update))
          .slice(0, 50)
      : [],
  };
}
