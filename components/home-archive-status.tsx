"use client";

import { useSyncExternalStore } from "react";
import { readBlueprintCopyCount, readStoredBlueprints } from "@/lib/blueprints";

function StatusIcon({ type }: { type: "cube" | "copy" | "layers" }) {
  if (type === "copy") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1" />
      </svg>
    );
  }

  if (type === "layers") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
        <path d="m3 12 9 4.5 9-4.5M3 16.5l9 4.5 9-4.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" />
      <path d="m4 6.5 8 4.5 8-4.5M12 11v9" />
    </svg>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

type ArchiveStats = {
  blueprints: number;
  copies: number;
  categories: number;
};

const emptyStats: ArchiveStats = {
  blueprints: 0,
  copies: 0,
  categories: 0,
};

function readArchiveStats(): ArchiveStats {
  const blueprints = readStoredBlueprints();
  const categoryCount = new Set(blueprints.map((blueprint) => blueprint.category).filter(Boolean)).size;

  return {
    blueprints: blueprints.length,
    copies: readBlueprintCopyCount(),
    categories: categoryCount,
  };
}

function getStatsSnapshot() {
  return JSON.stringify(readArchiveStats());
}

function getServerStatsSnapshot() {
  return JSON.stringify(emptyStats);
}

function subscribeToStatsUpdates(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("factorio-library:blueprints-updated", onStoreChange);
  window.addEventListener("factorio-library:blueprint-copies-updated", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("factorio-library:blueprints-updated", onStoreChange);
    window.removeEventListener("factorio-library:blueprint-copies-updated", onStoreChange);
  };
}

export function HomeArchiveStatus() {
  const stats = JSON.parse(
    useSyncExternalStore(subscribeToStatsUpdates, getStatsSnapshot, getServerStatsSnapshot),
  ) as ArchiveStats;

  return (
    <aside className="archive-status" aria-label="Archive status">
      <div className="status-header">
        <span className="status-title"><b aria-hidden="true">ϟ</b> Archive status</span>
        <span className="status-online"><i /> Online</span>
      </div>
      <dl>
        <div>
          <dt><StatusIcon type="cube" /> Blueprints</dt>
          <dd>{formatNumber(stats.blueprints)}</dd>
        </div>
        <div>
          <dt><StatusIcon type="copy" /> Total copies</dt>
          <dd>{formatNumber(stats.copies)}</dd>
        </div>
        <div>
          <dt><StatusIcon type="layers" /> Categories</dt>
          <dd>{formatNumber(stats.categories)}</dd>
        </div>
      </dl>
    </aside>
  );
}
