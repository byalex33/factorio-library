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

export const BLUEPRINT_STORAGE_KEY = "factorio-library.blueprints.v1";
export const BLUEPRINT_REPORT_STORAGE_KEY = "factorio-library.blueprint-reports.v1";
export const BLUEPRINT_COPY_COUNT_STORAGE_KEY = "factorio-library.blueprint-copy-count.v1";
export const BLUEPRINT_LIKE_STORAGE_KEY = "factorio-library.blueprint-likes.v1";
export const BLUEPRINT_ENGAGEMENT_STORAGE_KEY = "factorio-library.blueprint-engagement.v1";
const MAX_STORED_BLUEPRINTS = 100;
const MAX_BLUEPRINT_STRING_LENGTH = 2_000_000;

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
  if (/\s/.test(blueprint)) return "Blueprint strings cannot contain spaces or line breaks.";

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asTrimmedString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeGameVersion(value: unknown): GameVersion {
  const gameVersion = asTrimmedString(value, 30);
  return gameVersions.includes(gameVersion as GameVersion) ? (gameVersion as GameVersion) : DEFAULT_GAME_VERSION;
}

function normalizeStoredBlueprintUpdate(value: unknown): StoredBlueprintUpdate | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = asTrimmedString(record.id, 80);
  const changes = asTrimmedString(record.changes, 1_000);
  const blueprintString = asTrimmedString(record.blueprintString, MAX_BLUEPRINT_STRING_LENGTH);
  const createdAt = asTrimmedString(record.createdAt, 40);
  const normalizedCreatedAt = Number.isNaN(Date.parse(createdAt)) ? new Date().toISOString() : createdAt;

  if (!id || !changes || validateBlueprintString(blueprintString)) return null;

  return { id, changes, blueprintString, createdAt: normalizedCreatedAt };
}

function normalizeStoredBlueprintReport(value: unknown): StoredBlueprintReport | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = asTrimmedString(record.id, 80);
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

type BlueprintLikeStore = {
  counts: Record<string, number>;
  likedIds: string[];
};

type BlueprintEngagementStore = {
  views: Record<string, number>;
  copies: Record<string, number>;
};

function normalizePositiveInteger(value: unknown) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function normalizeCountRecord(value: unknown) {
  const record = asRecord(value);
  const counts: Record<string, number> = {};

  if (!record) return counts;

  for (const [id, count] of Object.entries(record)) {
    const normalizedId = asTrimmedString(id, 120);
    const normalizedCount = normalizePositiveInteger(count);
    if (normalizedId && normalizedCount > 0) counts[normalizedId] = normalizedCount;
  }

  return counts;
}

function normalizeBlueprintLikeStore(value: unknown): BlueprintLikeStore {
  const record = asRecord(value);
  const counts = normalizeCountRecord(record?.counts);

  const likedIdsValue = record?.likedIds;
  const likedIds = Array.isArray(likedIdsValue)
    ? Array.from(new Set(likedIdsValue.map((id) => asTrimmedString(id, 120)).filter(Boolean)))
    : [];

  return { counts, likedIds };
}

function readBlueprintLikeStore(): BlueprintLikeStore {
  if (typeof window === "undefined") return { counts: {}, likedIds: [] };

  try {
    const raw = window.localStorage.getItem(BLUEPRINT_LIKE_STORAGE_KEY);
    if (!raw) return { counts: {}, likedIds: [] };
    return normalizeBlueprintLikeStore(JSON.parse(raw));
  } catch {
    return { counts: {}, likedIds: [] };
  }
}

function writeBlueprintLikeStore(store: BlueprintLikeStore) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(BLUEPRINT_LIKE_STORAGE_KEY, JSON.stringify(normalizeBlueprintLikeStore(store)));
  window.dispatchEvent(new Event("factorio-library:blueprint-likes-updated"));
}

export function readBlueprintLikeState(blueprintId: string, initialCount = 0) {
  const id = blueprintId.trim();
  const store = readBlueprintLikeStore();
  const count = store.counts[id] ?? normalizePositiveInteger(initialCount);

  return {
    count,
    liked: store.likedIds.includes(id),
  };
}

export function toggleBlueprintLike(blueprintId: string, initialCount = 0) {
  const id = blueprintId.trim();
  if (!id) return { count: 0, liked: false };

  const store = readBlueprintLikeStore();
  const liked = store.likedIds.includes(id);
  const currentCount = store.counts[id] ?? normalizePositiveInteger(initialCount);
  const nextState = liked
    ? { count: Math.max(0, currentCount - 1), liked: false }
    : { count: currentCount + 1, liked: true };

  writeBlueprintLikeStore({
    counts: { ...store.counts, [id]: nextState.count },
    likedIds: nextState.liked
      ? Array.from(new Set([...store.likedIds, id]))
      : store.likedIds.filter((likedId) => likedId !== id),
  });

  return nextState;
}

function normalizeBlueprintEngagementStore(value: unknown): BlueprintEngagementStore {
  const record = asRecord(value);

  return {
    views: normalizeCountRecord(record?.views),
    copies: normalizeCountRecord(record?.copies),
  };
}

function readBlueprintEngagementStore(): BlueprintEngagementStore {
  if (typeof window === "undefined") return { views: {}, copies: {} };

  try {
    const raw = window.localStorage.getItem(BLUEPRINT_ENGAGEMENT_STORAGE_KEY);
    if (!raw) return { views: {}, copies: {} };
    return normalizeBlueprintEngagementStore(JSON.parse(raw));
  } catch {
    return { views: {}, copies: {} };
  }
}

function writeBlueprintEngagementStore(store: BlueprintEngagementStore) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(BLUEPRINT_ENGAGEMENT_STORAGE_KEY, JSON.stringify(normalizeBlueprintEngagementStore(store)));
  window.dispatchEvent(new Event("factorio-library:blueprint-engagement-updated"));
}

export function readBlueprintEngagementState(blueprintId: string, initialViews = 0, initialCopies = 0) {
  const id = blueprintId.trim();
  const store = readBlueprintEngagementStore();

  return {
    views: store.views[id] ?? normalizePositiveInteger(initialViews),
    copies: store.copies[id] ?? normalizePositiveInteger(initialCopies),
  };
}

export function incrementBlueprintViewCount(blueprintId: string, initialViews = 0, initialCopies = 0) {
  const id = blueprintId.trim();
  if (!id) return { views: 0, copies: 0 };

  const store = readBlueprintEngagementStore();
  const nextStore = {
    views: { ...store.views, [id]: (store.views[id] ?? normalizePositiveInteger(initialViews)) + 1 },
    copies: { ...store.copies },
  };

  if (nextStore.copies[id] === undefined && normalizePositiveInteger(initialCopies) > 0) {
    nextStore.copies[id] = normalizePositiveInteger(initialCopies);
  }

  writeBlueprintEngagementStore(nextStore);
  return readBlueprintEngagementState(id, initialViews, initialCopies);
}

function incrementBlueprintSpecificCopyCount(blueprintId: string, initialCopies = 0) {
  const id = blueprintId.trim();
  if (!id) return;

  const store = readBlueprintEngagementStore();
  writeBlueprintEngagementStore({
    views: { ...store.views },
    copies: { ...store.copies, [id]: (store.copies[id] ?? normalizePositiveInteger(initialCopies)) + 1 },
  });
}

function normalizeStoredBlueprint(value: unknown): StoredBlueprint | null {
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

export function readStoredBlueprints(): StoredBlueprint[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BLUEPRINT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(normalizeStoredBlueprint).filter((blueprint): blueprint is StoredBlueprint => Boolean(blueprint))
      : [];
  } catch {
    return [];
  }
}

export function writeStoredBlueprints(blueprints: StoredBlueprint[]) {
  if (typeof window === "undefined") return;

  const normalized = blueprints
    .map(normalizeStoredBlueprint)
    .filter((blueprint): blueprint is StoredBlueprint => Boolean(blueprint))
    .slice(0, MAX_STORED_BLUEPRINTS);

  try {
    window.localStorage.setItem(BLUEPRINT_STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      throw new Error("Browser storage is full. Delete some blueprints to free space.");
    }
    throw err;
  }
  window.dispatchEvent(new Event("factorio-library:blueprints-updated"));
}

export function readStoredBlueprintReports(): StoredBlueprintReport[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BLUEPRINT_REPORT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(normalizeStoredBlueprintReport).filter((report): report is StoredBlueprintReport => Boolean(report))
      : [];
  } catch {
    return [];
  }
}

export function writeStoredBlueprintReports(reports: StoredBlueprintReport[]) {
  if (typeof window === "undefined") return;

  const normalized = reports
    .map(normalizeStoredBlueprintReport)
    .filter((report): report is StoredBlueprintReport => Boolean(report))
    .slice(0, 200);

  try {
    window.localStorage.setItem(BLUEPRINT_REPORT_STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      throw new Error("Browser storage is full. Cannot save this report.");
    }
    throw err;
  }
  window.dispatchEvent(new Event("factorio-library:blueprint-reports-updated"));
}

export function saveStoredBlueprintReport(report: Omit<StoredBlueprintReport, "id" | "createdAt">) {
  const storedReport: StoredBlueprintReport = {
    ...report,
    id: `report-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };

  writeStoredBlueprintReports([storedReport, ...readStoredBlueprintReports()]);
  return storedReport;
}

export function deleteStoredBlueprintReport(id: string) {
  writeStoredBlueprintReports(readStoredBlueprintReports().filter((report) => report.id !== id));
}

export function getStoredBlueprint(id: string) {
  return readStoredBlueprints().find((blueprint) => blueprint.id === id) ?? null;
}

export function saveStoredBlueprint(blueprint: StoredBlueprint) {
  const blueprints = readStoredBlueprints().filter((stored) => stored.id !== blueprint.id);
  writeStoredBlueprints([blueprint, ...blueprints]);
}

export function readBlueprintCopyCount() {
  if (typeof window === "undefined") return 0;

  const count = Number(window.localStorage.getItem(BLUEPRINT_COPY_COUNT_STORAGE_KEY));
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

export function incrementBlueprintCopyCount(blueprintId?: string, initialBlueprintCopies = 0) {
  if (typeof window === "undefined") return 0;

  const nextCount = readBlueprintCopyCount() + 1;
  window.localStorage.setItem(BLUEPRINT_COPY_COUNT_STORAGE_KEY, String(nextCount));
  if (blueprintId) incrementBlueprintSpecificCopyCount(blueprintId, initialBlueprintCopies);
  window.dispatchEvent(new Event("factorio-library:blueprint-copies-updated"));
  return nextCount;
}

export function postStoredBlueprintUpdate(id: string, changes: string, blueprintString: string) {
  const blueprint = getStoredBlueprint(id);
  if (!blueprint) throw new Error("Blueprint not found");

  if (!changes.trim()) throw new Error("Describe what changed in this update.");

  const validationError = validateBlueprintString(blueprintString);
  if (validationError) throw new Error(validationError);

  const now = new Date().toISOString();
  const updatedBlueprint: StoredBlueprint = {
    ...blueprint,
    blueprintString: blueprintString.trim(),
    updatedAt: now,
    updates: [
      {
        id: `update-${Date.now().toString(36)}`,
        changes: changes.trim(),
        blueprintString: blueprintString.trim(),
        createdAt: now,
      },
      ...blueprint.updates,
    ].slice(0, 50),
  };

  saveStoredBlueprint(updatedBlueprint);
  return updatedBlueprint;
}
