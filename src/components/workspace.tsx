"use client";

import { useState } from "react";
import { MOCK_NOTES } from "@/lib/mock-notes";
import type { LayoutMode, NoteMeta } from "@/lib/types";
import { NotesLibrary } from "./notes-library";
import { TopBar } from "./top-bar";

export function Workspace() {
  const [notes, setNotes] = useState<NoteMeta[]>(() => MOCK_NOTES.map(({ id, title, updatedAt }) => ({ id, title, updatedAt })));
  const [activeId, setActiveId] = useState<string | null>(MOCK_NOTES[0].id);
  const [query, setQuery] = useState("");
  const [libOpen, setLibOpen] = useState(true);
  const [layout, setLayout] = useState<LayoutMode>("split");
  const [split, setSplit] = useState(50);

  const createNote = () => {
    const id = crypto.randomUUID();
    setNotes((all) => [{ id, title: "", updatedAt: Date.now() }, ...all]);
    setActiveId(id);
  };

  const deleteNote = (id: string) => {
    setNotes((all) => all.filter((n) => n.id !== id));
    if (id === activeId) setActiveId(notes.find((n) => n.id !== id)?.id ?? null);
  };

  const rename = (title: string) =>
    setNotes((all) => all.map((n) => (n.id === activeId ? { ...n, title } : n)));

  const active = notes.find((n) => n.id === activeId) ?? null;
  const notesWidth = layout === "split" ? `${split}%` : layout === "notes" ? "100%" : "0%";

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
          <div className="relative flex min-h-0 flex-1" style={{ ["--notes-w" as string]: notesWidth }}>
            <section className="h-full bg-panel md:w-(--notes-w) md:shrink-0 p-6 overflow-y-auto">
              <h2 className="text-xl font-bold">{active.title || "Untitled"}</h2>
            </section>
            <section className="hidden md:flex flex-1 items-center justify-center bg-surface border-l border-line text-muted text-sm">
              Canvas panel placeholder
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
