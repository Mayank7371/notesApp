"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import type { JSONContent } from "@tiptap/react";
import { EMPTY_DOC, MOCK_NOTES } from "@/lib/mock-notes";
import type { LayoutMode, NoteMeta, Scene } from "@/lib/types";
import { CanvasPanel } from "./canvas-panel";
import { NoteEditor } from "./note-editor";
import { NotesLibrary } from "./notes-library";
import { TopBar } from "./top-bar";

export function Workspace() {
  // Theme synchronized with CanvasPanel
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  // Light metadata lives in state (drives the UI). Heavy content lives in refs
  // so typing and drawing never re-render the whole workspace.
  const [notes, setNotes] = useState<NoteMeta[]>(() => MOCK_NOTES.map(({ id, title, updatedAt }) => ({ id, title, updatedAt })));
  const docs = useRef(new Map<string, JSONContent>(MOCK_NOTES.map((n) => [n.id, n.doc])));
  const scenes = useRef(new Map<string, Scene>());
  const skeletons = useRef(new Map(MOCK_NOTES.map((n) => [n.id, n.skeleton])));

  const [activeId, setActiveId] = useState<string | null>(MOCK_NOTES[0].id);
  const [query, setQuery] = useState("");
  const [libOpen, setLibOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutMode>("split");
  const [mobileTab, setMobileTab] = useState<"notes" | "canvas">("notes");
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) setLibOpen(true);
  }, []);

  const getDoc = useCallback((id: string) => docs.current.get(id) ?? EMPTY_DOC, []);
  const getScene = useCallback((id: string) => scenes.current.get(id), []);
  const getSkeleton = useCallback((id: string) => skeletons.current.get(id), []);
  const onSceneChange = useCallback((id: string, s: Scene) => void scenes.current.set(id, s), []);
  const onDocChange = useCallback((id: string, doc: JSONContent) => {
    docs.current.set(id, doc);
    setNotes((all) => all.map((n) => (n.id === id ? { ...n, updatedAt: Date.now() } : n)));
  }, []);

  const createNote = () => {
    const id = crypto.randomUUID();
    docs.current.set(id, EMPTY_DOC);
    setNotes((all) => [{ id, title: "", updatedAt: Date.now() }, ...all]);
    setActiveId(id);
    setMobileTab("notes");
  };

  const deleteNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!window.confirm(`Delete "${note?.title || "Untitled"}"? This removes its text and drawing.`)) return;
    docs.current.delete(id);
    scenes.current.delete(id);
    setNotes((all) => all.filter((n) => n.id !== id));
    if (id === activeId) setActiveId(notes.find((n) => n.id !== id)?.id ?? null);
  };

  const rename = (title: string) =>
    setNotes((all) => all.map((n) => (n.id === activeId ? { ...n, title } : n)));

  const moveDivider = (clientX: number) => {
    const box = area.current?.getBoundingClientRect();
    if (!box) return;
    setSplit(Math.min(80, Math.max(20, ((clientX - box.left) / box.width) * 100)));
  };

  const active = notes.find((n) => n.id === activeId) ?? null;
  const notesWidth = layout === "split" ? `${split}%` : layout === "notes" ? "100%" : "0%";
  const slide = dragging ? "" : "md:transition-[width] md:duration-150";
  const tabLabel = (t: "notes" | "canvas") =>
    `flex-1 py-2 text-sm ${mobileTab === t ? "border-b-2 border-accent text-ink" : "text-muted"}`;

  return (
    <div className="flex h-dvh flex-col">
      <TopBar
        title={active ? active.title : null}
        onTitle={rename}
        libOpen={libOpen}
        onToggleLib={() => setLibOpen((o) => !o)}
        layout={layout}
        onLayout={setLayout}
      />
      <div className="relative flex min-h-0 flex-1">
        {libOpen && (
          <div className="absolute inset-y-0 left-0 z-20 shadow-lg md:static md:shadow-none">
            <NotesLibrary
              notes={notes}
              activeId={activeId}
              query={query}
              onQuery={setQuery}
              onSelect={(id) => {
                setActiveId(id);
                if (!window.matchMedia("(min-width: 768px)").matches) setLibOpen(false);
              }}
              onCreate={createNote}
              onDelete={deleteNote}
            />
          </div>
        )}

        {active ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <div role="tablist" className="flex border-b border-line md:hidden">
              <button role="tab" aria-selected={mobileTab === "notes"} className={tabLabel("notes")} onClick={() => setMobileTab("notes")}>Notes</button>
              <button role="tab" aria-selected={mobileTab === "canvas"} className={tabLabel("canvas")} onClick={() => setMobileTab("canvas")}>Canvas</button>
            </div>
            <div ref={area} className="relative flex min-h-0 flex-1" style={{ ["--notes-w" as string]: notesWidth }}>
              <section
                aria-label="Notes"
                className={`absolute inset-0 overflow-hidden bg-panel md:static md:w-(--notes-w) md:shrink-0 ${slide} ${
                  mobileTab === "notes" ? "" : "invisible md:visible"
                }`}
              >
                <NoteEditor key={active.id} noteId={active.id} getDoc={getDoc} onChange={onDocChange} />
              </section>

              {layout === "split" && (
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize panels"
                  aria-valuenow={Math.round(split)}
                  tabIndex={0}
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); }}
                  onPointerMove={(e) => dragging && moveDivider(e.clientX)}
                  onPointerUp={() => setDragging(false)}
                  onDoubleClick={() => setSplit(50)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") setSplit((s) => Math.max(20, s - 2));
                    if (e.key === "ArrowRight") setSplit((s) => Math.min(80, s + 2));
                  }}
                  className={`hidden w-px shrink-0 cursor-col-resize bg-line transition-colors md:block ${
                    dragging ? "bg-accent" : "hover:bg-accent"
                  } relative after:absolute after:inset-y-0 after:-left-1.5 after:-right-1.5 after:content-['']`}
                />
              )}

              <section
                aria-label="Canvas"
                className={`absolute inset-0 overflow-hidden md:static md:min-w-0 md:flex-1 ${
                  mobileTab === "canvas" ? "" : "invisible md:visible"
                } ${dragging ? "pointer-events-none" : ""}`}
              >
                <CanvasPanel
                  key={active.id}
                  noteId={active.id}
                  theme={theme}
                  getScene={getScene}
                  getSkeleton={getSkeleton}
                  onSceneChange={onSceneChange}
                />
              </section>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 place-items-center p-6 text-center">
            <div>
              <p className="text-sm font-medium">No note open</p>
              <p className="mt-1 text-sm text-muted">Create a note to start writing and drawing side by side.</p>
              <button type="button" onClick={createNote} className="mt-4 h-8 rounded border border-line px-3 text-sm hover:bg-hover">
                New note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
