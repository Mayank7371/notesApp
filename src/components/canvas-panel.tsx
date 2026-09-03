"use client";

import dynamic from "next/dynamic";
import type { CanvasProps } from "./canvas-inner";

const CanvasInner = dynamic(() => import("./canvas-inner"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading canvas…</div>,
});

export function CanvasPanel(props: CanvasProps) {
  return (
    <div className="h-full w-full">
      <CanvasInner {...props} />
    </div>
  );
}
