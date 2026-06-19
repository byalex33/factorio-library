"use client";

import { useEffect, useState } from "react";
import { readBlueprintLikeState } from "@/lib/blueprints";

type BlueprintLikeCountProps = {
  blueprintId: string;
  initialCount?: number;
};

function HeartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="heart-icon">
      <path d="M12 21s-7.2-4.35-9.45-8.55C.72 9.03 2.46 5 6.25 5c2.15 0 3.6 1.15 4.45 2.45C11.1 8.06 11.9 8.06 12.3 7.45 13.15 6.15 14.6 5 16.75 5c3.79 0 5.53 4.03 3.7 7.45C19.2 16.65 12 21 12 21Z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  );
}

function formatLikeCount(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

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
    <span className="blueprint-like-count" title={`${formatLikeCount(count)} likes`}>
      <HeartIcon /> {formatLikeCount(count)}
    </span>
  );
}
