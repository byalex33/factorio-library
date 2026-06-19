import { LocalBlueprintDetail } from "@/components/local-blueprint-detail";
import { BlueprintViewer } from "@/src/components/blueprints/BlueprintViewer";

const demoBlueprintString = "0eJyN0MEKwjAMBuBXkZxbcJuK64N4EZFOgwbWdKSdc4y+ux0DEXbxEsgf8gUyQdP22AlxBDMBRXRgfjIFrW2wzdmJcEDZ3NH5nL5QAnkGsz+U9a6u97uqOh6LgwLkSJEwgDlPSzNeuXcNCphCAVuHWYtiOXReos76fKbzIa/N4gRvMFsFY65JwZ0Eb8ukTGpFln+Txb9k9SVtCOialvihnb09iVGXa7j6wpmlbl4k8awfaEUPT8zvS5eUPsYyePY=";

export default async function BlueprintDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "demo") {
    return (
      <main className="detail-page">
        <header className="detail-heading">
          <div>
            <div className="detail-kickers">
              <span>Demo</span>
              <span className="compatibility-badge">viewer-only</span>
            </div>
            <h1>Blueprint viewer demo</h1>
            <p className="detail-description">
              A placeholder blueprint string rendered with the isolated viewer component.
            </p>
          </div>
        </header>

        <section className="detail-preview">
          <BlueprintViewer blueprintString={demoBlueprintString} />
          <footer>
            <span>▦ Viewer-only blueprint preview demo</span>
          </footer>
        </section>
      </main>
    );
  }

  return <LocalBlueprintDetail id={slug} />;
}
