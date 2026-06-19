"use client";

import { useEffect, useRef, useState } from "react";

type BlueprintViewerProps = {
  blueprintString: string;
  className?: string;
};

export function BlueprintViewer({ blueprintString, className }: BlueprintViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [hasLocalSprites, setHasLocalSprites] = useState<boolean | null>(null);
  const [spriteError, setSpriteError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let destroyPreview: (() => void) | undefined;

    async function renderPreview() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setStatus("loading");
      setError(null);
      setSpriteError(false);

      try {
        const manifestResponse = await fetch("/data/factorio-sprites-manifest.json", {
          cache: "no-store",
        }).catch(() => null);
        const spritesAvailable = manifestResponse?.ok === true;
        if (!cancelled) setHasLocalSprites(spritesAvailable);

        const { renderBlueprintPreview } = await import("@/src/lib/blueprints/viewer");
        if (cancelled) return;
        const preview = await renderBlueprintPreview(canvas, blueprintString, {
          useSprites: spritesAvailable,
        });
        if (cancelled) {
          preview.destroy();
          return;
        }

        destroyPreview = preview.destroy;
        setSpriteError(Boolean(preview.spriteError));
        setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          console.error("Blueprint preview failed", err);
          setStatus("error");
          setError("We couldn't render this blueprint preview. The string may be invalid or use unsupported/modded entities.");
        }
      }
    }

    renderPreview();

    return () => {
      cancelled = true;
      destroyPreview?.();
    };
  }, [blueprintString]);

  return (
    <div className={["blueprint-viewer", className].filter(Boolean).join(" ")}>
      {status === "loading" ? (
        <div className="blueprint-viewer-overlay" role="status">Loading blueprint preview…</div>
      ) : null}

      {status === "error" ? (
        <div className="blueprint-viewer-overlay blueprint-viewer-error" role="alert">
          <strong>Preview unavailable</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {hasLocalSprites === false || spriteError ? (
        <div className="blueprint-viewer-notice" role="note">
          {spriteError
            ? "The local Factorio sprites could not be loaded, so this preview is using the schematic fallback. Check the browser console for the failed asset."
            : <>Real Factorio sprites are not installed locally, so this preview uses a schematic fallback. Run <code>npm run sprites:local -- &lt;path&gt;</code> to generate local-only sprite assets.</>}
        </div>
      ) : null}

      <canvas ref={canvasRef} aria-label="Blueprint preview" tabIndex={-1} />
    </div>
  );
}
