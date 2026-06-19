"use client";

import { useEffect, useState } from "react";
import { HeartIcon, formatBlueprintStatCount } from "@/components/blueprint-visuals";
import { readBlueprintLikeState } from "@/lib/blueprints";

type BlueprintLikeCountProps = {
  blueprintId: string;
  initialCount?: number;
};

export function BlueprintLikeCount({ blueprintId, initialCount = 0 }: BlueprintLikeCountProps) {
  const safeInitialCount = Math.max(0, Math.floor(initialCount));
  const [count, setCount] = useState(safeInitialCount);

  useEffect(() => {
    function refresh() {
      setCount(readBlueprintLikeState(blueprintId, safeInitialCount).count);
    }

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("factorio-library:blueprint-likes-updated", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("factorio-library:blueprint-likes-updated", refresh);
    };
  }, [blueprintId, safeInitialCount]);

  return (
    <span className="blueprint-like-count" title={`${formatBlueprintStatCount(count)} likes`}>
      <HeartIcon /> {formatBlueprintStatCount(count)}
    </span>
  );
}
