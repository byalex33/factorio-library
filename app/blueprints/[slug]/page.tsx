import Link from "next/link";
import { BlueprintDetailView, DatabaseBlueprintDetail } from "@/components/blueprint-detail";
import { getBlueprint } from "@/lib/blueprint-db";

export const dynamic = "force-dynamic";

const demoBlueprintString = "0eJyN0MEKwjAMBuBXkZxbcJuK64N4EZFOgwbWdKSdc4y+ux0DEXbxEsgf8gUyQdP22AlxBDMBRXRgfjIFrW2wzdmJcEDZ3NH5nL5QAnkGsz+U9a6u97uqOh6LgwLkSJEwgDlPSzNeuXcNCphCAVuHWYtiOXReos76fKbzIa/N4gRvMFsFY65JwZ0Eb8ukTGpFln+Txb9k9SVtCOialvihnb09iVGXa7j6wpmlbl4k8awfaEUPT8zvS5eUPsYyePY=";

export default async function BlueprintDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "demo") {
    return (
      <BlueprintDetailView
        blueprint={{
          id: "demo",
          title: "Direct-Insertion Smelting Block",
          description: "",
          category: "Smelting",
          gameVersion: "2.0.0",
          tags: ["Smelting", "Direct Insertion", "Tileable", "Beaconed", "45/min", "Megabase"],
          blueprintString: demoBlueprintString,
          author: "GearGrinder",
          createdAt: "2024-11-12T00:00:00.000Z",
          updatedAt: "2026-05-08T00:00:00.000Z",
          updates: [],
        }}
        views="88.4k"
        copies="21.0k"
        entityCount="312"
        footprint="18 × 12"
      />
    );
  }

  const blueprint = await getBlueprint(slug);
  if (!blueprint) {
    return (
      <main className="detail-page">
        <section className="empty-library-panel">
          <strong>Blueprint not found</strong>
          <p>This blueprint does not exist in the Neon database.</p>
          <Link href="/browse">Back to browse</Link>
        </section>
      </main>
    );
  }

  return <DatabaseBlueprintDetail blueprint={blueprint} />;
}
