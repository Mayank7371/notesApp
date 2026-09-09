"use client";

import { useCallback, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { EMPTY_DOC, MOCK_NOTES } from "@/lib/mock-notes";
import type { LayoutMode, NoteMeta, Scene } from "@/lib/types";
import { CanvasPanel } from "./canvas-panel";
import { NoteEditor } from "./note-editor";
import { NotesLibrary } from "./notes-library";
import { TopBar } from "./top-bar";

export function Workspace() {
  const [notes, setNotes] = useState<NoteMeta[]>(() => MOCK_NOTES.map(({ id, title, updatedAt }) => ({ id, title, updatedAt })));
  const docs = useRef(new Map<string, JSONContent>(MOCK_NOTES.map((n) => [n.id, n.doc])));
  const scenes = useRef(new Map<string, Scene>());
  const skeletons = useRef(new Map(MOCK_NOTES.map((n) => [n.id, n.skeleton])));

  const [activeId, setActiveId] = useState<string | null>(MOCK_NOTES[0].id);
  const [query, setQuery] = useState("");
  const [libOpen, setLibOpen] = useState(true);
  const [layout, setLayout] = useState<LayoutMode>("split");
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  const area = useRef<HTMLDivElement>(null);

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
  };

  const deleteNote = (id: string) => {
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
          <NotesLibrary
            notes={notes}
            activeId={activeId}
            query={query}
            onQuery={setQuery}
            onSelect={setActiveId}
            onCreate={createNote}
            onDelete={deleteNote}
          />
        )}
        {active && (
          <div ref={area} className="relative flex min-h-0 flex-1" style={{ ["--notes-w" as string]: notesWidth }}>
            <section className={`absolute inset-0 overflow-hidden bg-panel md:static md:w-(--notes-w) md:shrink-0 ${slide}`}>
              <NoteEditor key={active.id} noteId={active.id} getDoc={getDoc} onChange={onDocChange} />
            </section>
            {layout === "split" && (
              <div
                role="separator"
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); }}
                onPointerMove={(e) => dragging && moveDivider(e.clientX)}
                onPointerUp={() => setDragging(false)}
                className={`hidden w-px shrink-0 cursor-col-resize bg-line transition-colors md:block ${
                  dragging ? "bg-accent" : "hover:bg-accent"
                }`}
              />
            )}
            <section className="absolute inset-0 overflow-hidden md:static md:min-w-0 md:flex-1">
              <CanvasPanel
                key={active.id}
                noteId={active.id}
                theme="light"
                getScene={getScene}
                getSkeleton={getSkeleton}
                onSceneChange={onSceneChange}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
