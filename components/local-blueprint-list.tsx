"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BlueprintDiagram, CopiesIcon, EyeIcon } from "@/components/blueprint-visuals";
import { readStoredBlueprints, type StoredBlueprint } from "@/lib/blueprints";

function useLocalBlueprints() {
  const [blueprints, setBlueprints] = useState<StoredBlueprint[]>([]);

  useEffect(() => {
    function refresh() {
      setBlueprints(readStoredBlueprints());
    }

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("factorio-library:blueprints-updated", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("factorio-library:blueprints-updated", refresh);
    };
  }, []);

  return blueprints;
}

export function LocalBlueprintList() {
  const blueprints = useLocalBlueprints();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return blueprints;

    return blueprints.filter((blueprint) =>
      [blueprint.title, blueprint.category, blueprint.author, blueprint.description, blueprint.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [blueprints, query]);

  return (
    <>
      <div className="browse-search-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your added blueprints" />
        <Link href="/upload">Add blueprint</Link>
      </div>

      {blueprints.length === 0 ? (
        <section className="empty-library-panel">
          <strong>No blueprints added yet</strong>
          <p>Add your first single Factorio blueprint string to see it here.</p>
          <Link href="/upload">Add blueprint</Link>
        </section>
      ) : filtered.length === 0 ? (
        <section className="empty-library-panel">
          <strong>No matching blueprints</strong>
          <p>Try a different title, category, author, or tag.</p>
        </section>
      ) : (
        <section className="blueprint-grid-list" aria-label="Blueprint results">
          {filtered.map((blueprint) => (
            <Link href={`/blueprints/${blueprint.id}`} className="blueprint-card" key={blueprint.id}>
              <div className="blueprint-card-preview">
                <BlueprintDiagram />
                <span className="compatibility-badge">✓ {blueprint.gameVersion}</span>
              </div>
              <div className="blueprint-card-body">
                <p>{blueprint.category}</p>
                <h2>{blueprint.title}</h2>
                <div className="blueprint-card-meta">
                  <span>{blueprint.author}</span>
                  <span>{new Date(blueprint.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="blueprint-card-stats">
                  <span><EyeIcon /> local</span>
                  <span><CopiesIcon /> ready</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
