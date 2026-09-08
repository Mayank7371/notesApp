"use client";

import { useMemo } from "react";
import { Excalidraw, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";
import "@excalidraw/excalidraw/index.css";
import type { Scene } from "@/lib/types";

export type CanvasProps = {
  noteId: string;
  theme: "light" | "dark";
  getScene: (id: string) => Scene | undefined;
  getSkeleton: (id: string) => ExcalidrawElementSkeleton[] | undefined;
  onSceneChange: (id: string, scene: Scene) => void;
};

export default function CanvasInner({ noteId, theme, getScene, getSkeleton, onSceneChange }: CanvasProps) {
  // Computed once per mount; the parent remounts this component per note.
  const initialData = useMemo(() => {
    const saved = getScene(noteId);
    if (saved) return { elements: saved.elements, appState: saved.appState } as ExcalidrawInitialDataState;
    const skeleton = getSkeleton(noteId);
    return { elements: skeleton ? convertToExcalidrawElements(skeleton) : [] } as ExcalidrawInitialDataState;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
