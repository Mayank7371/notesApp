import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

export type NoteMeta = {
  id: string;
  title: string;
  updatedAt: number;
};

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

export type LayoutMode = "split" | "notes" | "canvas";
