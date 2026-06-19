import { getArchiveStats } from "@/lib/blueprint-db";

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

export async function HomeArchiveStatus() {
  const stats = await getArchiveStats();

  return (
    <aside className="archive-status" aria-label="Archive status">
      <div className="status-header">
        <span className="status-title"><b aria-hidden="true">ϟ</b> Archive status</span>
        <span className="status-online"><i /> Neon online</span>
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
