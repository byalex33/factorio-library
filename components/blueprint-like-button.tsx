"use client";

import { useEffect, useState, useTransition } from "react";
import { HeartIcon, formatBlueprintStatCount } from "@/components/blueprint-visuals";
import { getBlueprintLikeStateAction, toggleBlueprintLikeAction } from "@/lib/blueprint-actions";

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
  const [isPending, startTransition] = useTransition();
  const [likeState, setLikeState] = useState({ count: safeInitialCount, liked: false });

  useEffect(() => {
    let active = true;

    startTransition(async () => {
      const state = await getBlueprintLikeStateAction(blueprintId, safeInitialCount);
      if (active) setLikeState(state);
    });

    return () => {
      active = false;
    };
  }, [blueprintId, safeInitialCount]);

  function handleClick() {
    startTransition(async () => {
      const nextState = await toggleBlueprintLikeAction(blueprintId, likeState.count);
      setLikeState(nextState);
    });
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
      disabled={isPending}
    >
      <HeartIcon filled={likeState.liked} />
      <span>{formatBlueprintStatCount(likeState.count)}</span>
    </button>
  );
}
