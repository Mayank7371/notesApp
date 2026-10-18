"use client";

import { useMemo, useRef } from "react";
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

export default function CanvasInner({
  noteId,
  theme,
  getScene,
  getSkeleton,
  onSceneChange,
}: CanvasProps) {
  // Computed once per mount; the parent remounts this component per note.
  const initialData = useMemo(() => {
    const saved = getScene(noteId);
    if (saved && saved.elements && saved.elements.length > 0) {
      return {
        elements: saved.elements,
        appState: saved.appState ?? {},
      } as ExcalidrawInitialDataState;
    }
    const skeleton = getSkeleton(noteId);
    if (skeleton && skeleton.length > 0) {
      return {
        elements: convertToExcalidrawElements(skeleton),
        appState: saved?.appState ?? {},
      } as ExcalidrawInitialDataState;
    }
    return {
      elements: saved?.elements ?? [],
      appState: saved?.appState ?? {},
    } as ExcalidrawInitialDataState;
  }, [noteId, getScene, getSkeleton]);

  // Keep track of the initial elements signature to prevent Excalidraw's
  // immediate mount-time onChange from triggering a false auto-save.
  const isFirstEvent = useRef(true);
  const lastElementsSig = useRef<string>(
    JSON.stringify(
      (initialData.elements || []).map((el) => ({
        id: el.id,
        version: el.version,
        isDeleted: el.isDeleted,
      }))
    )
  );

  return (
    <Excalidraw
      initialData={initialData}
      theme={theme}
      onChange={(elements, appState) => {
        // Excalidraw always fires onChange upon initial mount. Ignore it.
        if (isFirstEvent.current) {
          isFirstEvent.current = false;
          return;
        }

        // Compare lightweight signature (id, version, isDeleted) to see if elements were modified
        const currentSig = JSON.stringify(
          (elements || []).map((el) => ({
            id: el.id,
            version: el.version,
            isDeleted: el.isDeleted,
          }))
        );

        if (currentSig === lastElementsSig.current) {
          // No drawing changes made (pure viewport pan/zoom or mouse move)
          return;
        }

        lastElementsSig.current = currentSig;

        onSceneChange(noteId, {
          elements,
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            gridModeEnabled: appState.gridModeEnabled,
            scrollX: appState.scrollX,
            scrollY: appState.scrollY,
            zoom: { value: appState.zoom.value },
          },
        });
      }}
    />
  );
}
