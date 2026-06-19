export type StoredBlueprint = {
  id: string;
  title: string;
  description: string;
  category: string;
  gameVersion: string;
  tags: string[];
  blueprintString: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};

export const BLUEPRINT_STORAGE_KEY = "factorio-library.blueprints.v1";
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
    gameVersion: asTrimmedString(record.gameVersion, 30) || "Unknown",
    tags: Array.isArray(record.tags)
      ? record.tags
          .map((tag) => asTrimmedString(tag, 40))
          .filter(Boolean)
          .slice(0, 12)
      : [],
    blueprintString,
    author: asTrimmedString(record.author, 80) || "@factory-builder",
    createdAt: normalizedCreatedAt,
    updatedAt: normalizedUpdatedAt,
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

  window.localStorage.setItem(BLUEPRINT_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event("factorio-library:blueprints-updated"));
}

export function getStoredBlueprint(id: string) {
  return readStoredBlueprints().find((blueprint) => blueprint.id === id) ?? null;
}

export function saveStoredBlueprint(blueprint: StoredBlueprint) {
  const blueprints = readStoredBlueprints().filter((stored) => stored.id !== blueprint.id);
  writeStoredBlueprints([blueprint, ...blueprints]);
}
