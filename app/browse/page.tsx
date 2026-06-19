import { LocalBlueprintList } from "@/components/local-blueprint-list";

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
        <span>Your locally added blueprint strings</span>
      </header>

      <LocalBlueprintList key={initialQuery} initialQuery={initialQuery} />
    </main>
  );
}
