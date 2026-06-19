"use client";

import { useEffect, useState } from "react";
import { HeartIcon, formatBlueprintStatCount } from "@/components/blueprint-visuals";
import { readBlueprintLikeState, toggleBlueprintLike } from "@/lib/blueprints";

type BlueprintLikeButtonVariant = "card" | "detail-stat";

type BlueprintLikeButtonProps = {
  blueprintId: string;
  blueprintTitle?: string;
  initialCount?: number;
  variant?: BlueprintLikeButtonVariant;
};

export function BlueprintLikeButton({
  blueprintId,
  blueprintTitle = "blueprint",
  initialCount = 0,
  variant = "card",
}: BlueprintLikeButtonProps) {
  const safeInitialCount = Math.max(0, Math.floor(initialCount));
  const [likeState, setLikeState] = useState({ count: safeInitialCount, liked: false });

  useEffect(() => {
    function refresh() {
      setLikeState(readBlueprintLikeState(blueprintId, safeInitialCount));
    }

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("factorio-library:blueprint-likes-updated", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("factorio-library:blueprint-likes-updated", refresh);
    };
  }, [blueprintId, safeInitialCount]);

  function handleClick() {
    setLikeState(toggleBlueprintLike(blueprintId, safeInitialCount));
  }

  const label = likeState.liked ? `Unlike ${blueprintTitle}` : `Like ${blueprintTitle}`;

  return (
    <button
      type="button"
      className={`blueprint-like-button blueprint-like-button-${variant} ${likeState.liked ? "liked" : ""}`}
      aria-label={label}
      aria-pressed={likeState.liked}
      title={label}
      onClick={handleClick}
    >
      <HeartIcon filled={likeState.liked} />
      <span>{formatBlueprintStatCount(likeState.count)}</span>
    </button>
  );
}
