"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { isAdminUser } from "@/lib/admin";
import {
  asRecord,
  asTrimmedString,
  blueprintCategories,
  gameVersions,
  makeBlueprintId,
  normalizeStoredBlueprint,
  parseTags,
  validateBlueprintString,
  type GameVersion,
  type StoredBlueprint,
} from "@/lib/blueprints";
import {
  clearBlueprints,
  clearReports,
  createBlueprint,
  createReport,
  deleteBlueprints,
  dismissReport,
  getBlueprintLikeState,
  importBlueprintRecords,
  incrementBlueprintCopies,
  incrementBlueprintViews,
  postBlueprintUpdate,
  toggleBlueprintLikeInDb,
} from "@/lib/blueprint-db";
import { getUserHandle } from "@/lib/users";

const VISITOR_COOKIE = "factorio_library_visitor";

export type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("Sign in required.");
  return user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminUser(user)) throw new Error("Admin access required.");
  return user;
}

async function getActorKey() {
  const user = await currentUser();
  if (user) return `clerk:${user.id}`;

  const cookieStore = await cookies();
  let visitorId = cookieStore.get(VISITOR_COOKIE)?.value;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    cookieStore.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return `visitor:${visitorId}`;
}

function revalidateBlueprintPaths(id?: string) {
  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/admin");
  if (id) revalidatePath(`/blueprints/${id}`);
}

export async function createBlueprintAction(payload: {
  title: string;
  description: string;
  category: string;
  gameVersion: GameVersion;
  tags: string;
  blueprintString: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const handle = getUserHandle(user);
    if (!handle) throw new Error("Your account needs a public username before uploading.");

    const cleanTitle = payload.title.trim();
    if (cleanTitle.length < 3) throw new Error("Give your blueprint a title of at least 3 characters.");

    const validationError = validateBlueprintString(payload.blueprintString);
    if (validationError) throw new Error(validationError);

    const now = new Date().toISOString();
    const blueprint: StoredBlueprint = {
      id: makeBlueprintId(cleanTitle),
      title: cleanTitle,
      description: payload.description.trim().slice(0, 700),
      category: blueprintCategories.includes(payload.category) ? payload.category : "Other",
      gameVersion: gameVersions.includes(payload.gameVersion) ? payload.gameVersion : "2.0.0",
      tags: parseTags(payload.tags),
      blueprintString: payload.blueprintString.trim(),
      author: handle,
      createdAt: now,
      updatedAt: now,
      updates: [],
    };

    const created = await createBlueprint(blueprint, user.id);
    revalidateBlueprintPaths(created.id);
    return { ok: true, id: created.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save this blueprint." };
  }
}

export async function postBlueprintUpdateAction(payload: {
  blueprintId: string;
  changes: string;
  blueprintString: string;
}): Promise<ActionResult<{ blueprint: StoredBlueprint }>> {
  try {
    const user = await requireUser();
    const changes = payload.changes.trim();
    if (!changes) throw new Error("Describe what changed in this update.");

    const validationError = validateBlueprintString(payload.blueprintString);
    if (validationError) throw new Error(validationError);

    const updated = await postBlueprintUpdate({
      blueprintId: payload.blueprintId,
      changes,
      blueprintString: payload.blueprintString,
      actorUserId: user.id,
      isAdmin: isAdminUser(user),
    });
    revalidateBlueprintPaths(updated.id);
    return { ok: true, blueprint: updated };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not post this update." };
  }
}

export async function submitBlueprintReportAction(payload: {
  blueprintId: string;
  blueprintTitle: string;
  blueprintAuthor: string;
  reason: string;
  details: string;
  reporter: string;
}): Promise<ActionResult> {
  try {
    const reason = payload.reason.trim();
    if (!reason) throw new Error("Choose a report reason.");

    await createReport({
      blueprintId: payload.blueprintId,
      blueprintTitle: payload.blueprintTitle,
      blueprintAuthor: payload.blueprintAuthor,
      reason,
      details: payload.details.trim(),
      reporter: payload.reporter.trim() || "anonymous",
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save this report." };
  }
}

export async function getBlueprintLikeStateAction(blueprintId: string, initialCount = 0) {
  const userKey = await getActorKey();
  return getBlueprintLikeState(blueprintId, userKey, initialCount);
}

export async function toggleBlueprintLikeAction(blueprintId: string, initialCount = 0) {
  const userKey = await getActorKey();
  const state = await toggleBlueprintLikeInDb(blueprintId, userKey, initialCount);
  revalidateBlueprintPaths(blueprintId);
  return state;
}

export async function incrementBlueprintViewAction(blueprintId: string, fallback: { views: number; copies: number; likes: number }) {
  const stats = await incrementBlueprintViews(blueprintId);
  return stats ?? fallback;
}

export async function incrementBlueprintCopyAction(blueprintId: string | undefined, fallback: { views: number; copies: number; likes: number }) {
  if (!blueprintId) return fallback;
  const stats = await incrementBlueprintCopies(blueprintId);
  revalidateBlueprintPaths(blueprintId);
  return stats ?? fallback;
}

export async function deleteBlueprintsAction(ids: string[]): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteBlueprints(ids);
    revalidateBlueprintPaths();
    for (const id of ids) revalidatePath(`/blueprints/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete blueprints." };
  }
}

export async function clearBlueprintsAction(): Promise<ActionResult> {
  try {
    await requireAdmin();
    await clearBlueprints();
    revalidateBlueprintPaths();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not clear the library." };
  }
}

export async function dismissReportAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await dismissReport(id);
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not dismiss this report." };
  }
}

export async function clearReportsAction(): Promise<ActionResult> {
  try {
    await requireAdmin();
    await clearReports();
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not clear reports." };
  }
}

export async function importBlueprintsAction(records: unknown, mode: "merge" | "replace"): Promise<ActionResult<{ imported: number }>> {
  try {
    const user = await requireAdmin();
    const incoming = Array.isArray(records) ? records : [];
    const blueprints = incoming
      .map((item) => normalizeStoredBlueprint(item))
      .filter((blueprint): blueprint is StoredBlueprint => Boolean(blueprint));

    const imported = await importBlueprintRecords(blueprints, mode, user.id);
    revalidateBlueprintPaths();
    return { ok: true, imported };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Import failed." };
  }
}

export async function importReportsAction(records: unknown): Promise<ActionResult<{ imported: number }>> {
  try {
    await requireAdmin();
    const incoming = Array.isArray(records) ? records : [];
    let imported = 0;
    for (const item of incoming) {
      const record = asRecord(item);
      if (!record) continue;
      const result = await submitBlueprintReportAction({
        blueprintId: asTrimmedString(record.blueprintId, 120),
        blueprintTitle: asTrimmedString(record.blueprintTitle, 90),
        blueprintAuthor: asTrimmedString(record.blueprintAuthor, 80),
        reason: asTrimmedString(record.reason, 80),
        details: asTrimmedString(record.details, 1000),
        reporter: asTrimmedString(record.reporter, 120) || "anonymous",
      });
      if (result.ok) imported += 1;
    }
    revalidatePath("/admin");
    return { ok: true, imported };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Report import failed." };
  }
}
