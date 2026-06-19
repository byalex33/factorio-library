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

  useEffect(() => {
    let cancelled = false;

    async function renderPreview() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setStatus("loading");
      setError(null);

      try {
        const { renderBlueprintPreview } = await import("@/src/lib/blueprints/viewer");
        if (cancelled) return;
        await renderBlueprintPreview(canvas, blueprintString);
        if (!cancelled) setStatus("ready");
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

      <canvas ref={canvasRef} aria-label="Blueprint preview" tabIndex={-1} />
    </div>
  );
}
