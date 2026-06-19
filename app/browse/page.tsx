import { LocalBlueprintList } from "@/components/local-blueprint-list";

export default function BrowsePage() {
  return (
    <main className="browse-page">
      <header className="browse-heading">
        <p>All blueprints</p>
        <h1>Browse blueprints</h1>
        <span>Your locally added blueprint strings</span>
      </header>

      <LocalBlueprintList />
    </main>
  );
}
