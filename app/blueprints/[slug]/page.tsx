import { BlueprintDetailView, LocalBlueprintDetail } from "@/components/local-blueprint-detail";

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
        likes={648}
        entityCount="312"
        footprint="18 × 12"
      />
    );
  }

  return <LocalBlueprintDetail id={slug} />;
}
