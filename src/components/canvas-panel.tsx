"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import type { CanvasProps } from "./canvas-inner";

// Excalidraw touches `window`, so it must only load in the browser.
const CanvasInner = dynamic(() => import("./canvas-inner"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading canvas…</div>,
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
