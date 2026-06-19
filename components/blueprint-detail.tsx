"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { inflate } from "pako";
import { BlueprintLikeButton } from "@/components/blueprint-like-button";
import { CopiesIcon, EyeIcon, formatBlueprintStatCount } from "@/components/blueprint-visuals";
import { CopyBlueprintButton } from "@/components/copy-blueprint-button";
import { BlueprintViewer } from "@/src/components/blueprints/BlueprintViewer";
import { normalizePositiveInteger, validateBlueprintString, type BlueprintStats, type StoredBlueprint } from "@/lib/blueprints";
import { incrementBlueprintViewAction, postBlueprintUpdateAction, submitBlueprintReportAction } from "@/lib/blueprint-actions";

type DetailIconName = "image" | "versions" | "changelog" | "author" | "game" | "calendar" | "history" | "cube" | "grid" | "flag";
type DetailTab = "blueprint" | "versions" | "changelog";

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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function parseStatCount(value: string | number) {
  if (typeof value === "number") return normalizePositiveInteger(value);
  const normalized = value.trim().toLowerCase().replace(/,/g, "");
  const match = normalized.match(/^(\d+(?:\.\d+)?)([km])?$/);
  if (!match) return 0;

  const multiplier = match[2] === "m" ? 1_000_000 : match[2] === "k" ? 1_000 : 1;
  return Math.max(0, Math.floor(Number(match[1]) * multiplier));
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

function BlueprintReportForm({
  blueprint,
  onReported,
}: {
  blueprint: StoredBlueprint;
  onReported: () => void;
}) {
  const [reason, setReason] = useState("Broken or invalid blueprint");
  const [details, setDetails] = useState("");
  const [reporter, setReporter] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError("Choose a report reason.");
      return;
    }

    try {
      const result = await submitBlueprintReportAction({
        blueprintId: blueprint.id,
        blueprintTitle: blueprint.title,
        blueprintAuthor: blueprint.author,
        reason: reason.trim(),
        details: details.trim(),
        reporter: reporter.trim() || "anonymous",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onReported();
    } catch (err) {
      console.error(err);
      setError("Could not save this report in Neon.");
    }
  }

  return (
    <form className="report-form" onSubmit={submit}>
      <h2 id="report-blueprint-heading">Report blueprint</h2>
      <p>Tell moderators what needs review for <strong>{blueprint.title}</strong>.</p>
      <label>
        <span>Reason</span>
        <select value={reason} onChange={(event) => setReason(event.target.value)} required>
          <option>Broken or invalid blueprint</option>
          <option>Misleading title or category</option>
          <option>Spam or duplicate</option>
          <option>Offensive or unsafe content</option>
          <option>Copyright or attribution issue</option>
          <option>Other</option>
        </select>
      </label>
      <label>
        <span>Details</span>
        <textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Add context for moderators..." rows={4} maxLength={1000} />
      </label>
      <label>
        <span>Your contact (optional)</span>
        <input value={reporter} onChange={(event) => setReporter(event.target.value)} placeholder="Name or email" maxLength={120} />
      </label>
      <div className="report-form-actions">
        <button type="submit">Submit report</button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}

function BlueprintUpdateForm({
  blueprint,
  onBlueprintUpdated,
}: {
  blueprint: StoredBlueprint;
  onBlueprintUpdated: (blueprint: StoredBlueprint) => void;
}) {
  const [changes, setChanges] = useState("");
  const [blueprintString, setBlueprintString] = useState(blueprint.blueprintString);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stringError = useMemo(() => validateBlueprintString(blueprintString), [blueprintString]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!changes.trim()) {
      setError("Describe what changed in this update.");
      return;
    }

    const validationError = validateBlueprintString(blueprintString);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const result = await postBlueprintUpdateAction({ blueprintId: blueprint.id, changes, blueprintString });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onBlueprintUpdated(result.blueprint);
      setChanges("");
      setBlueprintString(result.blueprint.blueprintString);
    } catch (err) {
      console.error(err);
      setError("Could not post this update in Neon.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form id="post-update-form" className="post-update-form" onSubmit={submit}>
      <h2 id="post-update-heading">Post Update</h2>
      <label>
        <span>Changes</span>
        <textarea value={changes} onChange={(event) => setChanges(event.target.value)} placeholder="What changed in this version?" rows={3} maxLength={1000} required />
      </label>
      <label>
        <span>New blueprint string</span>
        <textarea className="blueprint-string-input" value={blueprintString} onChange={(event) => setBlueprintString(event.target.value)} placeholder="0eNq..." rows={6} spellCheck={false} required />
      </label>
      <div className="upload-form-footer">
        <p className={stringError && blueprintString ? "form-warning" : "form-note"}>
          {blueprintString ? stringError ?? `${blueprintString.trim().length.toLocaleString()} characters ready` : "Paste the updated Factorio blueprint string."}
        </p>
        <button type="submit" disabled={saving}>{saving ? "Posting..." : "Post Update"}</button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}

export function DatabaseBlueprintDetail({ blueprint }: { blueprint: StoredBlueprint & Partial<BlueprintStats> }) {
  const [currentBlueprint, setCurrentBlueprint] = useState<StoredBlueprint>(blueprint);
  return (
    <LoadedBlueprintDetail
      blueprint={currentBlueprint}
      views={blueprint.views ?? 0}
      copies={blueprint.copies ?? 0}
      likes={blueprint.likes ?? 0}
      onBlueprintUpdated={setCurrentBlueprint}
    />
  );
}

function LoadedBlueprintDetail({
  blueprint,
  views,
  copies,
  likes,
  onBlueprintUpdated,
}: {
  blueprint: StoredBlueprint;
  views?: number | string;
  copies?: number | string;
  likes?: number;
  onBlueprintUpdated?: (blueprint: StoredBlueprint) => void;
}) {
  const metrics = useMemo(() => getBlueprintMetrics(blueprint.blueprintString), [blueprint.blueprintString]);
  return <BlueprintDetailView blueprint={blueprint} views={views} copies={copies} likes={likes} entityCount={metrics.entityCount} footprint={metrics.footprint} onBlueprintUpdated={onBlueprintUpdated} />;
}

export function BlueprintDetailView({
  blueprint,
  views = "0",
  copies = "0",
  likes = 0,
  entityCount = "—",
  footprint = "—",
  onBlueprintUpdated,
}: {
  blueprint: StoredBlueprint;
  views?: string | number;
  copies?: string | number;
  likes?: number;
  entityCount?: string;
  footprint?: string;
  onBlueprintUpdated?: (blueprint: StoredBlueprint) => void;
}) {
  const initialViewCount = parseStatCount(views);
  const initialCopyCount = parseStatCount(copies);
  const initialLikeCount = normalizePositiveInteger(likes);
  const [engagementStats, setEngagementStats] = useState(() => ({ views: initialViewCount, copies: initialCopyCount, likes: initialLikeCount }));
  const viewCountedBlueprintIdRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("blueprint");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    if (viewCountedBlueprintIdRef.current !== blueprint.id) {
      viewCountedBlueprintIdRef.current = blueprint.id;
      incrementBlueprintViewAction(blueprint.id, {
        views: initialViewCount,
        copies: initialCopyCount,
        likes: initialLikeCount,
      }).then((stats) => {
        if (active) setEngagementStats(stats);
      }).catch((error) => {
        console.error("Could not record blueprint view", error);
      });
    }

    return () => {
      active = false;
    };
  }, [blueprint.id, initialViewCount, initialCopyCount, initialLikeCount]);

  useEffect(() => {
    if (!isUpdateModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsUpdateModalOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isUpdateModalOpen]);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    if (!isReportModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsReportModalOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isReportModalOpen]);
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const versionCount = blueprint.updates.length + 1;
  const versionLabel = `${versionCount} ${versionCount === 1 ? "Version" : "Versions"}`;
  const versions = useMemo(() => {
    const total = blueprint.updates.length + 1;
    const updateVersions = blueprint.updates.map((update, index) => ({
      id: update.id,
      label: `Version ${total - index}`,
      status: index === 0 ? "Current" : "Previous",
      createdAt: update.createdAt,
      changes: update.changes,
      blueprintString: update.blueprintString as string | null,
    }));

    return [
      ...updateVersions,
      {
        id: `${blueprint.id}-original`,
        label: "Version 1",
        status: blueprint.updates.length ? "Original" : "Current",
        createdAt: blueprint.createdAt,
        changes: "Initial published version.",
        blueprintString: blueprint.updates.length ? null : blueprint.blueprintString,
      },
    ];
  }, [blueprint]);

  const details: { icon: DetailIconName; label: string; value: string }[] = [
    { icon: "author", label: "Author", value: blueprint.author },
    { icon: "game", label: "Game version", value: blueprint.gameVersion },
    { icon: "calendar", label: "Published", value: formatMonthYear(blueprint.createdAt) },
    { icon: "history", label: "Updated", value: formatMonthYear(blueprint.updatedAt) },
    { icon: "cube", label: "Entities", value: entityCount },
    { icon: "grid", label: "Footprint", value: footprint },
  ];

  const detailTabs: DetailTab[] = ["blueprint", "versions", "changelog"];

  function handleTabKeyDown(event: React.KeyboardEvent) {
    const currentIndex = detailTabs.indexOf(activeTab);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveTab(detailTabs[(currentIndex + 1) % detailTabs.length]);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveTab(detailTabs[(currentIndex - 1 + detailTabs.length) % detailTabs.length]);
    }
  }

  function handleBlueprintUpdated(updatedBlueprint: StoredBlueprint) {
    onBlueprintUpdated?.(updatedBlueprint);
    setIsUpdateModalOpen(false);
  }

  function handleReported() {
    setIsReportModalOpen(false);
    setReportNotice("Thanks — this blueprint has been reported for moderator review.");
  }

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
            <dt>{formatBlueprintStatCount(engagementStats.views)}</dt>
            <dd><EyeIcon /> views</dd>
          </div>
          <div>
            <dt>{formatBlueprintStatCount(engagementStats.copies)}</dt>
            <dd><CopiesIcon /> copies</dd>
          </div>
          <div className="detail-like-stat">
            <dt><BlueprintLikeButton blueprintId={blueprint.id} blueprintTitle={blueprint.title} initialCount={likes} variant="detail-stat" /></dt>
            <dd>likes</dd>
          </div>
        </dl>
      </header>

      <div className="detail-layout">
        <section className="detail-main">
          <div className="detail-tabs" role="tablist" aria-label="Blueprint detail sections" onKeyDown={handleTabKeyDown}>
            <button type="button" role="tab" aria-selected={activeTab === "blueprint"} className={activeTab === "blueprint" ? "active" : undefined} onClick={() => setActiveTab("blueprint")}><DetailIcon name="image" /><span>Blueprint</span></button>
            <button type="button" role="tab" aria-selected={activeTab === "versions"} className={activeTab === "versions" ? "active" : undefined} onClick={() => setActiveTab("versions")}><DetailIcon name="versions" /><span>{versionLabel}</span></button>
            <button type="button" role="tab" aria-selected={activeTab === "changelog"} className={activeTab === "changelog" ? "active" : undefined} onClick={() => setActiveTab("changelog")}><DetailIcon name="changelog" /><span>Changelog</span></button>
          </div>

          {activeTab === "blueprint" ? (
            <>
              <div className="detail-preview" role="tabpanel">
                <BlueprintViewer blueprintString={blueprint.blueprintString} />
                <footer>
                  <span><DetailIcon name="grid" /> {footprint} tiles</span>
                  <div aria-hidden="true">
                    <button type="button" tabIndex={-1}>⊕</button>
                    <button type="button" tabIndex={-1}>⌗</button>
                  </div>
                </footer>
              </div>

            </>
          ) : null}

          {activeTab === "versions" ? (
            <section className="versions-panel" role="tabpanel">
              <h2>{versionLabel}</h2>
              <ol>
                {versions.map((version) => (
                  <li key={version.id}>
                    <div>
                      <strong>{version.label}</strong>
                      <span>{version.status}</span>
                    </div>
                    <time dateTime={version.createdAt}>{formatDateTime(version.createdAt)}</time>
                    <p>{version.changes}</p>
                    {version.blueprintString ? <CopyBlueprintButton blueprintString={version.blueprintString} blueprintId={blueprint.id} initialBlueprintViews={engagementStats.views} initialBlueprintCopies={engagementStats.copies} initialBlueprintLikes={engagementStats.likes} /> : <em>Original blueprint string is not available for older database updates.</em>}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {activeTab === "changelog" ? (
            <section className="changelog-panel" role="tabpanel">
              <h2>Changelog</h2>
              {blueprint.updates.length ? (
                <ol>
                  {blueprint.updates.map((update) => (
                    <li key={update.id}>
                      <time dateTime={update.createdAt}>{formatDateTime(update.createdAt)}</time>
                      <p>{update.changes}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No updates posted yet.</p>
              )}
            </section>
          ) : null}
        </section>

        <aside className="detail-sidebar">
          <section className="copy-panel">
            <CopyBlueprintButton blueprintString={blueprint.blueprintString} blueprintId={blueprint.id} initialBlueprintViews={engagementStats.views} initialBlueprintCopies={engagementStats.copies} initialBlueprintLikes={engagementStats.likes} />
            <code>{blueprint.blueprintString}</code>
          </section>

          {onBlueprintUpdated ? (
            <button type="button" className="post-update-sidebar-button" onClick={() => setIsUpdateModalOpen(true)}>Post an update</button>
          ) : null}

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

          <button type="button" className="report-button" onClick={() => setIsReportModalOpen(true)}><DetailIcon name="flag" /> Report blueprint</button>
          {reportNotice ? <p className="report-notice" role="status">{reportNotice}</p> : null}
        </aside>
      </div>

      {isUpdateModalOpen && onBlueprintUpdated ? createPortal(
        <div className="post-update-modal-backdrop" role="presentation" onClick={() => setIsUpdateModalOpen(false)}>
          <div className="post-update-modal" role="dialog" aria-modal="true" aria-labelledby="post-update-heading" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="post-update-modal-close" aria-label="Close post update" onClick={() => setIsUpdateModalOpen(false)}>×</button>
            <BlueprintUpdateForm blueprint={blueprint} onBlueprintUpdated={handleBlueprintUpdated} />
          </div>
        </div>,
        document.body,
      ) : null}

      {isReportModalOpen ? createPortal(
        <div className="post-update-modal-backdrop" role="presentation" onClick={() => setIsReportModalOpen(false)}>
          <div className="post-update-modal" role="dialog" aria-modal="true" aria-labelledby="report-blueprint-heading" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="post-update-modal-close" aria-label="Close report blueprint" onClick={() => setIsReportModalOpen(false)}>×</button>
            <BlueprintReportForm blueprint={blueprint} onReported={handleReported} />
          </div>
        </div>,
        document.body,
      ) : null}
    </main>
  );
}
