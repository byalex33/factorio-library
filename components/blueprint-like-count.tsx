import { HeartIcon, formatBlueprintStatCount } from "@/components/blueprint-visuals";

export function BlueprintLikeCount({ initialCount = 0 }: { blueprintId?: string; initialCount?: number }) {
  const count = Math.max(0, Math.floor(initialCount));

  return (
    <span className="blueprint-like-count" title={`${formatBlueprintStatCount(count)} likes`}>
      <HeartIcon /> {formatBlueprintStatCount(count)}
    </span>
  );
}
