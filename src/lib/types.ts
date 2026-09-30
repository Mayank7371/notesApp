import type { JSONContent } from "@tiptap/react";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";

export type NoteMeta = {
  id: string;
  title: string;
  updatedAt: number;
};

/** The parts of the Excalidraw state we keep per note. */
export type Scene = {
  elements: readonly ExcalidrawElement[];
  appState: {
    viewBackgroundColor?: string;
    gridModeEnabled?: boolean;
    scrollX?: number;
    scrollY?: number;
    zoom?: { value: number };
  };
};

export type SeedNote = NoteMeta & {
  doc: JSONContent;
  skeleton?: ExcalidrawElementSkeleton[];
};

export type LayoutMode = "split" | "notes" | "canvas";
