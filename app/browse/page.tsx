import { BlueprintList } from "@/components/blueprint-list";

export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const query = (await searchParams).q;
  const initialQuery = Array.isArray(query) ? query[0] ?? "" : query ?? "";
  return (
    <main className="browse-page">
      <header className="browse-heading">
        <p>All blueprints</p>
        <h1>Browse blueprints</h1>
        <span>Shared blueprints stored in Neon</span>
      </header>

      <BlueprintList key={initialQuery} initialQuery={initialQuery} />
    </main>
  );
}
