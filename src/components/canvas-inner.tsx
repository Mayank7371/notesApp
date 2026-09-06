"use client";

import { useMemo } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import type { Scene } from "@/lib/types";

export type CanvasProps = {
  noteId: string;
  theme: "light" | "dark";
  getScene: (id: string) => Scene | undefined;
  onSceneChange: (id: string, scene: Scene) => void;
};

export default function CanvasInner({ noteId, theme, getScene, onSceneChange }: CanvasProps) {
  const initialData = useMemo(() => {
    const saved = getScene(noteId);
    if (saved) return { elements: saved.elements, appState: saved.appState } as ExcalidrawInitialDataState;
    return { elements: [] } as ExcalidrawInitialDataState;
  }, [noteId]);

  return (
    <Excalidraw
      initialData={initialData}
      theme={theme}
      onChange={(elements, appState) =>
        onSceneChange(noteId, {
          elements,
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            gridModeEnabled: appState.gridModeEnabled,
            scrollX: appState.scrollX,
            scrollY: appState.scrollY,
            zoom: { value: appState.zoom.value },
          },
        })
      }
    />
  );
}
