"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Columns2, FileText, PencilRuler, Plus, Sparkles, Command } from "lucide-react";
import type { JSONContent } from "@tiptap/react";
import { EMPTY_DOC, MOCK_NOTES } from "@/lib/mock-notes";
import type { LayoutMode, NoteMeta, Scene } from "@/lib/types";
import { CanvasPanel } from "./canvas-panel";
import { NoteEditor } from "./note-editor";
import { NotesLibrary } from "./notes-library";
import { TopBar } from "./top-bar";

export function Workspace() {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  // Light metadata lives in state (drives the UI). Heavy content lives in refs
  // so typing and drawing never re-render the whole workspace.
  const [notes, setNotes] = useState<NoteMeta[]>(() =>
    MOCK_NOTES.map(({ id, title, updatedAt }) => ({ id, title, updatedAt }))
  );
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

  const createNote = useCallback(() => {
    const id = crypto.randomUUID();
    docs.current.set(id, EMPTY_DOC);
    setNotes((all) => [{ id, title: "", updatedAt: Date.now() }, ...all]);
    setActiveId(id);
    setMobileTab("notes");
  }, []);

  const deleteNote = useCallback((id: string) => {
    docs.current.delete(id);
    scenes.current.delete(id);
    setNotes((all) => all.filter((n) => n.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  const rename = useCallback((title: string) => {
    setNotes((all) => all.map((n) => (n.id === activeId ? { ...n, title } : n)));
  }, [activeId]);

  // Global Keyboard Shortcuts with fast early check
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar: Ctrl+\ or Cmd+\
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        setLibOpen((o) => !o);
      }
      // Create new note: Ctrl+Alt+N or Alt+N
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n" && !e.shiftKey) {
        // If not typing in input or editor
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea" && !(e.target as HTMLElement)?.isContentEditable) {
          e.preventDefault();
          createNote();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createNote]);

  const moveDivider = (clientX: number) => {
    const box = area.current?.getBoundingClientRect();
    if (!box) return;
    setSplit(Math.min(80, Math.max(20, ((clientX - box.left) / box.width) * 100)));
  };

  const active = notes.find((n) => n.id === activeId) ?? null;
  const notesWidth = layout === "split" ? `${split}%` : layout === "notes" ? "100%" : "0%";
  const slide = dragging ? "will-change-[width]" : "md:transition-[width] md:duration-150";

  return (
    <div className="flex h-dvh flex-col bg-surface text-ink">
      <TopBar
        title={active ? active.title : null}
        onTitle={rename}
        libOpen={libOpen}
        onToggleLib={() => setLibOpen((o) => !o)}
        layout={layout}
        onLayout={setLayout}
      />

      <div className="relative flex min-h-0 flex-1">
        {/* Sidebar Overlay on mobile / Static on desktop */}
        {libOpen && (
          <div className="absolute inset-y-0 left-0 z-30 shadow-xl md:static md:shadow-none animate-in fade-in slide-in-from-left-4 duration-200">
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
            {/* Mobile Tab Switcher */}
            <div
              role="tablist"
              aria-label="Panels view"
              className="flex border-b border-line bg-panel md:hidden"
            >
              <button
                role="tab"
                aria-selected={mobileTab === "notes"}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  mobileTab === "notes"
                    ? "border-b-2 border-accent text-accent font-semibold"
                    : "text-muted hover:text-ink"
                }`}
                onClick={() => setMobileTab("notes")}
              >
                Notes Document
              </button>
              <button
                role="tab"
                aria-selected={mobileTab === "canvas"}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  mobileTab === "canvas"
                    ? "border-b-2 border-accent text-accent font-semibold"
                    : "text-muted hover:text-ink"
                }`}
                onClick={() => setMobileTab("canvas")}
              >
                Infinite Canvas
              </button>
            </div>

            {/* Split View Content Area */}
            <div
              ref={area}
              className="relative flex min-h-0 flex-1"
              style={{ ["--notes-w" as string]: notesWidth }}
            >
              {/* Left Panel: Note Editor */}
              <section
                aria-label="Notes editor panel"
                className={`absolute inset-0 overflow-hidden bg-panel md:static md:w-(--notes-w) md:shrink-0 ${slide} ${
                  mobileTab === "notes" ? "" : "invisible md:visible"
                }`}
              >
                <NoteEditor
                  key={active.id}
                  noteId={active.id}
                  getDoc={getDoc}
                  onChange={onDocChange}
                />
              </section>

              {/* Draggable Divider with Visual Grip Handle */}
              {layout === "split" && (
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize panels (Drag or use Left/Right arrow keys)"
                  aria-valuenow={Math.round(split)}
                  aria-valuemin={20}
                  aria-valuemax={80}
                  tabIndex={0}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDragging(true);
                  }}
                  onPointerMove={(e) => dragging && moveDivider(e.clientX)}
                  onPointerUp={() => setDragging(false)}
                  onDoubleClick={() => setSplit(50)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") setSplit((s) => Math.max(20, s - 2));
                    if (e.key === "ArrowRight") setSplit((s) => Math.min(80, s + 2));
                  }}
                  className={`hidden w-2 shrink-0 cursor-col-resize items-center justify-center bg-transparent transition-colors md:flex group relative -mx-1 z-10 select-none ${
                    dragging ? "bg-accent/20" : "hover:bg-accent/15"
                  }`}
                >
                  <div
                    className={`w-px h-full ${
                      dragging ? "bg-accent" : "bg-line group-hover:bg-accent/70"
                    } transition-colors`}
                  />
                  {/* Grip pill affordance */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-0.5 w-3.5 h-8 rounded-full border border-line bg-panel shadow-xs transition-all duration-150 ${
                      dragging
                        ? "border-accent bg-accent text-white scale-110 shadow-sm"
                        : "group-hover:border-accent group-hover:scale-105"
                    }`}
                  >
                    <div className="w-1 h-1 rounded-full bg-muted/60" />
                    <div className="w-1 h-1 rounded-full bg-muted/60" />
                    <div className="w-1 h-1 rounded-full bg-muted/60" />
                  </div>
                </div>
              )}

              {/* Right Panel: Infinite Canvas */}
              <section
                aria-label="Drawing canvas panel"
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
          /* High-Craft Empty State */
          <div className="grid flex-1 place-items-center p-8 text-center select-none bg-surface">
            <div className="max-w-md flex flex-col items-center">
              <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl border border-line bg-panel shadow-md">
                <FileText size={26} className="text-accent -translate-x-1" />
                <PencilRuler size={22} className="text-muted/70 translate-x-1" />
                <div className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-accent text-white shadow-xs">
                  <Sparkles size={11} />
                </div>
              </div>

              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Visual Thinking &amp; Knowledge Space
              </h2>
              <p className="mt-2 text-xs text-muted leading-relaxed max-w-sm">
                Create structured markdown documents on the left and sketch system diagrams on the infinite canvas.
              </p>

              <button
                type="button"
                onClick={createNote}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-accent/90 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <Plus size={15} />
                <span>Create New Note</span>
              </button>

              <div className="mt-8 flex items-center gap-4 text-[11px] text-muted border-t border-line/60 pt-4">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px]">
                    /
                  </kbd>{" "}
                  Slash commands
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px]">
                    Ctrl+\
                  </kbd>{" "}
                  Sidebar
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
