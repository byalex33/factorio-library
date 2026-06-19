"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { inflate } from "pako";
import { CopiesIcon, EyeIcon } from "@/components/blueprint-visuals";
import { CopyBlueprintButton } from "@/components/copy-blueprint-button";
import { BlueprintViewer } from "@/src/components/blueprints/BlueprintViewer";
import { getStoredBlueprint, type StoredBlueprint } from "@/lib/blueprints";

type DetailIconName = "image" | "versions" | "changelog" | "author" | "game" | "calendar" | "history" | "cube" | "grid" | "flag";

function DetailIcon({ name }: { name: DetailIconName }) {
  const paths: Record<DetailIconName, ReactNode> = {
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
    versions: <><circle cx="7" cy="18" r="2" /><circle cx="17" cy="6" r="2" /><path d="M8.5 16.5 15.5 7.5M7 16V6" /></>,
    changelog: <><path d="M7 3h10l3 3v15H7z" /><path d="M17 3v4h4M10 11h7M10 15h7M10 19h5" /><path d="M4 7H2v12h2" /></>,
    author: <><circle cx="12" cy="7" r="3" /><path d="M6 21v-2a6 6 0 0 1 12 0v2" /></>,
    game: <><path d="M7 9h10a4 4 0 0 1 3.8 5.2l-1.1 3.4a2 2 0 0 1-3.2.9L14 16h-4l-2.5 2.5a2 2 0 0 1-3.2-.9l-1.1-3.4A4 4 0 0 1 7 9Z" /><path d="M7 12v4M5 14h4M16 13h.01M18 15h.01" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    cube: <><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" /><path d="m4 6.5 8 4.5 8-4.5M12 11v9" /></>,
    grid: <><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></>,
    flag: <><path d="M5 21V4M5 5c5-4 9 4 14 0v10c-5 4-9-4-14 0" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="detail-icon" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function formatMonthYear(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(value));
}

function getBlueprintMetrics(blueprintString: string) {
  try {
    const binary = atob(blueprintString.trim().slice(1));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const decoded = JSON.parse(inflate(bytes, { to: "string" })) as {
      blueprint?: { entities?: { position: { x: number; y: number } }[] };
      blueprint_book?: { blueprints?: { blueprint?: { entities?: { position: { x: number; y: number } }[] } }[] };
    };
    const entities = decoded.blueprint?.entities
      ?? decoded.blueprint_book?.blueprints?.find((entry) => entry.blueprint)?.blueprint?.entities
      ?? [];

    if (!entities.length) return { entityCount: "0", footprint: "—" };

    const xs = entities.map((entity) => entity.position.x);
    const ys = entities.map((entity) => entity.position.y);
    const width = Math.max(1, Math.ceil(Math.max(...xs) - Math.min(...xs) + 1));
    const height = Math.max(1, Math.ceil(Math.max(...ys) - Math.min(...ys) + 1));
    return { entityCount: entities.length.toLocaleString(), footprint: `${width} × ${height}` };
  } catch {
    return { entityCount: "—", footprint: "—" };
  }
}

export function LocalBlueprintDetail({ id }: { id: string }) {
  const [blueprint, setBlueprint] = useState<StoredBlueprint | null | undefined>(undefined);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setBlueprint(getStoredBlueprint(id));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [id]);

  if (blueprint === undefined) {
    return <main className="detail-page"><section className="empty-library-panel"><strong>Loading blueprint...</strong></section></main>;
  }

  if (!blueprint) {
    return (
      <main className="detail-page">
        <section className="empty-library-panel">
          <strong>Blueprint not found</strong>
          <p>This blueprint is not saved in this browser.</p>
          <Link href="/browse">Back to browse</Link>
        </section>
      </main>
    );
  }

  return <LoadedBlueprintDetail blueprint={blueprint} />;
}

function LoadedBlueprintDetail({ blueprint }: { blueprint: StoredBlueprint }) {
  const metrics = useMemo(() => getBlueprintMetrics(blueprint.blueprintString), [blueprint.blueprintString]);
  return <BlueprintDetailView blueprint={blueprint} entityCount={metrics.entityCount} footprint={metrics.footprint} />;
}

export function BlueprintDetailView({
  blueprint,
  views = "0",
  copies = "0",
  entityCount = "—",
  footprint = "—",
}: {
  blueprint: StoredBlueprint;
  views?: string;
  copies?: string;
  entityCount?: string;
  footprint?: string;
}) {
  const details: { icon: DetailIconName; label: string; value: string }[] = [
    { icon: "author", label: "Author", value: blueprint.author },
    { icon: "game", label: "Game version", value: blueprint.gameVersion === "Base game" ? "2.0.x" : blueprint.gameVersion },
    { icon: "calendar", label: "Published", value: formatMonthYear(blueprint.createdAt) },
    { icon: "history", label: "Updated", value: formatMonthYear(blueprint.updatedAt) },
    { icon: "cube", label: "Entities", value: entityCount },
    { icon: "grid", label: "Footprint", value: footprint },
  ];

  return (
    <main className="detail-page">
      <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/browse">Browse</Link><span>›</span>
        <Link href="/browse">{blueprint.category}</Link><span>›</span>
        <strong>{blueprint.title}</strong>
      </nav>

      <header className="detail-heading">
        <div>
          <div className="detail-kickers">
            <span>{blueprint.category}</span>
            <span className="compatibility-badge">✓ {blueprint.gameVersion}</span>
          </div>
          <h1>{blueprint.title}</h1>
          {blueprint.description ? <p className="detail-description">{blueprint.description}</p> : null}
          {blueprint.tags.length ? (
            <div className="detail-tags">
              {blueprint.tags.map((tag) => <span key={tag}>#{tag}</span>)}
            </div>
          ) : null}
        </div>

        <dl className="detail-stats">
          <div>
            <dt>{views}</dt>
            <dd><EyeIcon /> views</dd>
          </div>
          <div>
            <dt>{copies}</dt>
            <dd><CopiesIcon /> copies</dd>
          </div>
        </dl>
      </header>

      <div className="detail-layout">
        <section className="detail-main">
          <div className="detail-tabs">
            <button className="active"><DetailIcon name="image" /><span>Blueprint</span></button>
            <button><DetailIcon name="versions" /><span>Versions</span></button>
            <button><DetailIcon name="changelog" /><span>Changelog</span></button>
          </div>

          <div className="detail-preview">
            <BlueprintViewer blueprintString={blueprint.blueprintString} />
            <footer>
              <span><DetailIcon name="grid" /> Blueprint preview · {footprint} tiles</span>
              <div aria-hidden="true">
                <button type="button" tabIndex={-1}>⊕</button>
                <button type="button" tabIndex={-1}>⌗</button>
              </div>
            </footer>
          </div>
        </section>

        <aside className="detail-sidebar">
          <section className="copy-panel">
            <CopyBlueprintButton blueprintString={blueprint.blueprintString} />
            <code>{blueprint.blueprintString}</code>
          </section>

          <section className="metadata-panel">
            <dl>
              {details.map((detail) => (
                <div key={detail.label}>
                  <dt><DetailIcon name={detail.icon} />{detail.label}</dt>
                  <dd>{detail.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <button type="button" className="report-button"><DetailIcon name="flag" /> Report blueprint</button>
        </aside>
      </div>
    </main>
  );
}
