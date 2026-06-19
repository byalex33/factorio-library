"use client";

import { useState } from "react";

export function CopyBlueprintButton({ blueprintString }: { blueprintString: string }) {
  const [copied, setCopied] = useState(false);

  async function copyBlueprint() {
    await navigator.clipboard.writeText(blueprintString);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" className="copy-blueprint-button" onClick={copyBlueprint}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="2">
        <path d="M15 5h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3" />
        <path d="M9 5V3h6v4H9V5Zm9 7h-7m0 0 3-3m-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {copied ? "Copied!" : "Copy blueprint"}
    </button>
  );
}
