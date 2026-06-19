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

export function readStoredBlueprints(): StoredBlueprint[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BLUEPRINT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStoredBlueprints(blueprints: StoredBlueprint[]) {
  window.localStorage.setItem(BLUEPRINT_STORAGE_KEY, JSON.stringify(blueprints));
  window.dispatchEvent(new Event("factorio-library:blueprints-updated"));
}

export function getStoredBlueprint(id: string) {
  return readStoredBlueprints().find((blueprint) => blueprint.id === id) ?? null;
}

export function saveStoredBlueprint(blueprint: StoredBlueprint) {
  const blueprints = readStoredBlueprints();
  writeStoredBlueprints([blueprint, ...blueprints]);
}
