import Link from "next/link";
import { BlueprintLikeCount } from "@/components/blueprint-like-count";
import { UserIcon } from "@/components/blueprint-visuals";
import { BlueprintViewer } from "@/src/components/blueprints/BlueprintViewer";
import { formatUsername } from "@/lib/blueprints";
import { listBlueprints } from "@/lib/blueprint-db";

export async function BlueprintList({ initialQuery = "" }: { initialQuery?: string }) {
  const blueprints = await listBlueprints({ query: initialQuery });

  return (
    <>
      <form action="/browse" className="browse-search-row">
        <input name="q" defaultValue={initialQuery} placeholder="Search community blueprints" />
        <button type="submit">Search</button>
        <Link href="/upload">Add blueprint</Link>
      </form>

      {blueprints.length === 0 ? (
        <section className="empty-library-panel">
          <strong>{initialQuery ? "No matching blueprints" : "No blueprints added yet"}</strong>
          <p>{initialQuery ? "Try a different title, category, author, or tag." : "Add the first single Factorio blueprint string to seed the shared library."}</p>
          <Link href="/upload">Add blueprint</Link>
        </section>
      ) : (
        <section className="blueprint-grid-list" aria-label="Blueprint results">
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
                    <BlueprintLikeCount initialCount={blueprint.likes} />
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
