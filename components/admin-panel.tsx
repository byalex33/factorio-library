"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  blueprintCategories,
  formatUsername,
  gameVersions,
  normalizeStoredBlueprint,
  type StoredBlueprint,
  type StoredBlueprintReport,
} from "@/lib/blueprints";
import {
  clearBlueprintsAction,
  clearReportsAction,
  deleteBlueprintsAction,
  dismissReportAction,
  importBlueprintsAction,
} from "@/lib/blueprint-actions";

type ImportMode = "merge" | "replace";

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function uniqueCount(values: string[]) {
  return new Set(values.filter(Boolean).map((value) => value.toLowerCase())).size;
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminPanel({
  adminName,
  blueprints,
  reports,
}: {
  adminName: string;
  blueprints: StoredBlueprint[];
  reports: StoredBlueprintReport[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [version, setVersion] = useState("All");
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSelectedIds = useMemo(
    () => selectedIds.filter((id) => blueprints.some((blueprint) => blueprint.id === id)),
    [blueprints, selectedIds],
  );

  const filteredBlueprints = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return blueprints.filter((blueprint) => {
      const matchesQuery = normalizedQuery
        ? [blueprint.id, blueprint.title, blueprint.description, blueprint.category, blueprint.author, blueprint.tags.join(" ")]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      const matchesCategory = category === "All" || blueprint.category === category;
      const matchesVersion = version === "All" || blueprint.gameVersion === version;

      return matchesQuery && matchesCategory && matchesVersion;
    });
  }, [blueprints, category, query, version]);

  const stats = useMemo(() => {
    const raw = JSON.stringify(blueprints);
    const newest = blueprints
      .map((blueprint) => Date.parse(blueprint.updatedAt || blueprint.createdAt))
      .filter((time) => !Number.isNaN(time))
      .sort((a, b) => b - a)[0];

    return {
      total: blueprints.length,
      categories: uniqueCount(blueprints.map((blueprint) => blueprint.category)),
      authors: uniqueCount(blueprints.map((blueprint) => blueprint.author)),
      bytes: new Blob([raw]).size,
      newest,
    };
  }, [blueprints]);

  const allFilteredSelected = filteredBlueprints.length > 0 && filteredBlueprints.every((blueprint) => activeSelectedIds.includes(blueprint.id));

  function runAction(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await action();
      setNotice(result.ok ? success : result.error ?? "Action failed.");
      if (result.ok) {
        router.refresh();
      }
    });
  }

  function toggleSelected(id: string) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }

  function toggleAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds((ids) => ids.filter((id) => !filteredBlueprints.some((blueprint) => blueprint.id === id)));
      return;
    }

    setSelectedIds((ids) => Array.from(new Set([...ids, ...filteredBlueprints.map((blueprint) => blueprint.id)])));
  }

  function deleteSelected() {
    if (activeSelectedIds.length === 0) return;
    const count = activeSelectedIds.length;
    runAction(async () => deleteBlueprintsAction(activeSelectedIds), `Deleted ${count} blueprint${count === 1 ? "" : "s"}.`);
    setSelectedIds([]);
  }

  function clearLibrary() {
    if (!window.confirm("Delete every blueprint in Neon? This cannot be undone.")) return;
    runAction(clearBlueprintsAction, "Library cleared.");
    setSelectedIds([]);
  }

  function dismissReport(id: string) {
    runAction(async () => dismissReportAction(id), "Report dismissed.");
  }

  function clearAllReports() {
    if (!window.confirm("Dismiss every stored report?")) return;
    runAction(clearReportsAction, "Report queue cleared.");
  }

  async function importBlueprints(file: File | undefined) {
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const incoming = Array.isArray(parsed) ? parsed : [];
      const normalized = incoming.map(normalizeStoredBlueprint).filter(Boolean);
      startTransition(async () => {
        const result = await importBlueprintsAction(normalized, importMode);
        setNotice(result.ok ? `Imported ${result.imported.toLocaleString()} item${result.imported === 1 ? "" : "s"}.` : result.error);
        if (result.ok) router.refresh();
      });
    } catch {
      setNotice("Import failed. Upload a JSON export from this admin panel.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="mt-10 space-y-8" aria-busy={isPending}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Blueprints", stats.total.toLocaleString(), "Neon records"],
          ["Reports", reports.length.toLocaleString(), "Pending moderation items"],
          ["Categories", stats.categories.toLocaleString(), "Active taxonomy groups"],
          ["Payload", formatBytes(stats.bytes), "Current JSON export size"],
          ["Latest update", stats.newest ? new Date(stats.newest).toLocaleDateString() : "None", `Signed in as ${adminName}`],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-stone-500">{label}</p>
            <strong className="mt-3 block font-display text-3xl uppercase text-stone-100">{value}</strong>
            <span className="mt-2 block truncate text-sm text-stone-500">{detail}</span>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-factory-amber">Moderation queue</p>
              <h2 className="mt-2 font-display text-3xl font-semibold uppercase text-stone-100">Blueprint inventory</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/upload" className="rounded-lg bg-factory-amber px-4 py-2 text-sm font-bold text-[#1a1402]">Add blueprint</Link>
              <button onClick={() => downloadJson(`factorio-library-${Date.now()}.json`, blueprints)} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-stone-200">Export JSON</button>
              <button onClick={deleteSelected} disabled={activeSelectedIds.length === 0 || isPending} className="rounded-lg border border-red-400/30 px-4 py-2 text-sm font-bold text-red-200 disabled:cursor-not-allowed disabled:opacity-40">Delete selected</button>
            </div>
          </div>

          <div className="grid gap-3 py-5 md:grid-cols-[1fr_180px_150px]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, id, author, tags" className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-stone-100 outline-none focus:border-factory-amber/70" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-white/10 bg-[#10110b] px-4 py-3 text-stone-100 outline-none focus:border-factory-amber/70">
              <option>All</option>
              {blueprintCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={version} onChange={(event) => setVersion(event.target.value)} className="rounded-lg border border-white/10 bg-[#10110b] px-4 py-3 text-stone-100 outline-none focus:border-factory-amber/70">
              <option>All</option>
              {gameVersions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-y border-white/10 text-xs uppercase tracking-[0.18em] text-stone-500">
                <tr>
                  <th className="w-12 py-3"><input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} aria-label="Select all visible blueprints" /></th>
                  <th>Blueprint</th>
                  <th>Category</th>
                  <th>Version</th>
                  <th>Author</th>
                  <th>Updated</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredBlueprints.map((blueprint) => (
                  <tr key={blueprint.id} className="align-top text-stone-300">
                    <td className="py-4"><input type="checkbox" checked={activeSelectedIds.includes(blueprint.id)} onChange={() => toggleSelected(blueprint.id)} aria-label={`Select ${blueprint.title}`} /></td>
                    <td className="py-4 pr-6">
                      <Link href={`/blueprints/${blueprint.id}`} className="font-semibold text-stone-100 hover:text-factory-amber">{blueprint.title}</Link>
                      <p className="mt-1 max-w-md truncate font-mono text-xs text-stone-600">{blueprint.id}</p>
                      <p className="mt-2 line-clamp-2 max-w-xl text-stone-500">{blueprint.description || "No description"}</p>
                    </td>
                    <td className="py-4 pr-4">{blueprint.category}</td>
                    <td className="py-4 pr-4">{blueprint.gameVersion}</td>
                    <td className="py-4 pr-4">{formatUsername(blueprint.author)}</td>
                    <td className="py-4 pr-4">{new Date(blueprint.updatedAt).toLocaleDateString()}</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/blueprints/${blueprint.id}`} className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-bold text-stone-200">View</Link>
                        <button onClick={() => navigator.clipboard?.writeText(blueprint.id)} className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-bold text-stone-200">Copy ID</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBlueprints.length === 0 ? (
            <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-white/10 text-center text-stone-500">No blueprints match the current admin filters.</div>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-factory-amber">Reports</p>
                <h2 className="mt-2 font-display text-2xl font-semibold uppercase text-stone-100">Moderation queue</h2>
              </div>
              <button onClick={clearAllReports} disabled={reports.length === 0 || isPending} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-stone-200 disabled:cursor-not-allowed disabled:opacity-40">Clear</button>
            </div>
            {reports.length ? (
              <div className="mt-5 space-y-3">
                {reports.map((report) => (
                  <article key={report.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/blueprints/${report.blueprintId}`} className="font-semibold text-stone-100 hover:text-factory-amber">{report.blueprintTitle}</Link>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-factory-amber">{report.reason}</p>
                      </div>
                      <button onClick={() => dismissReport(report.id)} disabled={isPending} className="rounded-md border border-white/10 px-2 py-1 text-xs font-bold text-stone-300 disabled:opacity-40">Dismiss</button>
                    </div>
                    {report.details ? <p className="mt-3 text-sm leading-6 text-stone-400">{report.details}</p> : null}
                    <p className="mt-3 text-xs text-stone-600">By {report.reporter} · {new Date(report.createdAt).toLocaleString()}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-stone-400">No reports stored in Neon.</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-factory-amber">Data tools</p>
            <h2 className="mt-2 font-display text-2xl font-semibold uppercase text-stone-100">Import / export</h2>
            <p className="mt-3 text-sm leading-6 text-stone-400">Move blueprint records into Neon or export a database snapshot.</p>
            <div className="mt-5 grid gap-3">
              <select value={importMode} onChange={(event) => setImportMode(event.target.value as ImportMode)} className="rounded-lg border border-white/10 bg-[#10110b] px-4 py-3 text-stone-100">
                <option value="merge">Merge with existing</option>
                <option value="replace">Replace library</option>
              </select>
              <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={(event) => importBlueprints(event.target.files?.[0])} className="text-sm text-stone-400 file:mr-3 file:rounded-lg file:border-0 file:bg-factory-amber file:px-4 file:py-2 file:font-bold file:text-[#1a1402]" />
              <button onClick={clearLibrary} disabled={isPending} className="rounded-lg border border-red-400/30 px-4 py-2 text-sm font-bold text-red-200 disabled:opacity-40">Clear Neon library</button>
            </div>
            {notice ? <p className="mt-4 rounded-lg border border-factory-amber/25 bg-factory-amber/10 px-3 py-2 text-sm text-factory-amber">{notice}</p> : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-factory-amber">Ops checklist</p>
            <ul className="mt-4 space-y-3 text-sm text-stone-400">
              <li>✓ Review uploads for title quality and useful descriptions.</li>
              <li>✓ Export JSON before bulk deletes or replacement imports.</li>
              <li>✓ Keep categories consistent with Factorio discovery pages.</li>
              <li>✓ Set DATABASE_URL in both local env and Vercel.</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
