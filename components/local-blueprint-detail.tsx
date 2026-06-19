"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopiesIcon, EyeIcon } from "@/components/blueprint-visuals";
import { CopyBlueprintButton } from "@/components/copy-blueprint-button";
import { BlueprintViewer } from "@/src/components/blueprints/BlueprintViewer";
import { getStoredBlueprint, type StoredBlueprint } from "@/lib/blueprints";

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

  const details = [
    ["♙", "Author", blueprint.author],
    ["⌘", "Game version", blueprint.gameVersion],
    ["□", "Published", new Date(blueprint.createdAt).toLocaleDateString()],
    ["◴", "Updated", new Date(blueprint.updatedAt).toLocaleDateString()],
    ["◇", "String length", blueprint.blueprintString.length.toLocaleString()],
    ["▦", "Category", blueprint.category],
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
            <dt>Local</dt>
            <dd><EyeIcon /> saved</dd>
          </div>
          <div>
            <dt>Ready</dt>
            <dd><CopiesIcon /> copy</dd>
          </div>
        </dl>
      </header>

      <div className="detail-layout">
        <section className="detail-main">
          <div className="detail-tabs">
            <button className="active">▧ <span>Blueprint</span></button>
          </div>

          <div className="detail-preview">
            <BlueprintViewer blueprintString={blueprint.blueprintString} />
            <footer>
              <span>▦ Viewer-only blueprint preview</span>
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
              {details.map(([icon, label, value]) => (
                <div key={label}>
                  <dt><span aria-hidden="true">{icon}</span>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </main>
  );
}
