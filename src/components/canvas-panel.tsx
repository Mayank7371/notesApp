"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import { PencilRuler } from "lucide-react";
import type { CanvasProps } from "./canvas-inner";

// Excalidraw touches `window`, so it must only load in the browser.
const CanvasInner = dynamic(() => import("./canvas-inner"), {
  ssr: false,
  loading: () => (
    <div role="status" aria-busy="true" aria-label="Loading canvas" className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface p-6 text-muted select-none">
      <div className="grid size-12 place-items-center rounded-2xl border border-line bg-panel shadow-xs animate-pulse">
        <PencilRuler size={22} className="text-accent" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs font-semibold text-ink">Loading Infinite Canvas</p>
        <p className="text-[11px] text-muted">Mounting Excalidraw drawing tools...</p>
      </div>
    </div>
  ),
});

function CanvasPanelBase(props: CanvasProps) {
  // Excalidraw needs a parent with an explicit height.
  return (
    <div className="h-full w-full">
      <CanvasInner {...props} />
    </div>
  );
}

export const CanvasPanel = memo(CanvasPanelBase);
