"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

export type CanvasProps = {
  noteId: string;
  theme: "light" | "dark";
};

export default function CanvasInner({ theme }: CanvasProps) {
  return (
    <Excalidraw
      theme={theme}
    />
  );
}
