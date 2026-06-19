import { LocalBlueprintDetail } from "@/components/local-blueprint-detail";

export default async function BlueprintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LocalBlueprintDetail id={id} />;
}
