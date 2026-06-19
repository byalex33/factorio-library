"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BlueprintLikeCount } from "@/components/blueprint-like-count";
import { UserIcon } from "@/components/blueprint-visuals";
import { BlueprintViewer } from "@/src/components/blueprints/BlueprintViewer";
import { formatUsername, readStoredBlueprints, type StoredBlueprint } from "@/lib/blueprints";

function readRecentBlueprints() {
  return [...readStoredBlueprints()]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 3);
}

export function HomeRecentBlueprints() {
  const [blueprints, setBlueprints] = useState<StoredBlueprint[]>([]);

  useEffect(() => {
    function refresh() {
      setBlueprints(readRecentBlueprints());
    }

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("factorio-library:blueprints-updated", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("factorio-library:blueprints-updated", refresh);
    };
  }, []);

  return (
    <section className="category-section home-recent-section" aria-labelledby="recent-blueprints-heading">
      <div className="category-heading-row">
        <h2 id="recent-blueprints-heading">
          Recent blueprints <span>{blueprints.length || "new"}</span>
        </h2>
        <Link href="/browse">Browse all →</Link>
      </div>

      {blueprints.length === 0 ? (
        <div className="empty-library-panel compact-empty-panel">
          <strong>No recent blueprints yet</strong>
          <p>Upload a blueprint string to start building your local community archive.</p>
          <Link href="/upload">Upload blueprint</Link>
        </div>
      ) : (
        <div className="blueprint-grid-list" aria-label="Recent blueprint results">
          {blueprints.map((blueprint) => (
            <article className="blueprint-card" key={blueprint.id}>
              <Link href={`/blueprints/${blueprint.id}`} className="blueprint-card-link">
                <div className="blueprint-card-preview">
                  <BlueprintViewer blueprintString={blueprint.blueprintString} className="blueprint-card-viewer" />
                  <span className="compatibility-badge">✓ {blueprint.gameVersion}</span>
                </div>
                <div className="blueprint-card-body">
                  <p>{blueprint.category}</p>
                  <h2>{blueprint.title}</h2>
                  <div className="blueprint-card-meta">
                    <span>{new Date(blueprint.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="blueprint-card-stats">
                    <span><UserIcon /> {formatUsername(blueprint.author)}</span>
                    <BlueprintLikeCount blueprintId={blueprint.id} />
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
