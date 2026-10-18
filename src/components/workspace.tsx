"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { FileText, PencilRuler, Plus, Sparkles, Loader2 } from "lucide-react";
import type { JSONContent } from "@tiptap/react";
import { EMPTY_DOC, MOCK_NOTES } from "@/lib/mock-notes";
import type { LayoutMode, NoteDetail, NoteMeta, PaginatedResponse, Scene, SyncStatus } from "@/lib/types";
import { CanvasPanel } from "./canvas-panel";
import { NoteEditor } from "./note-editor";
import { NotesLibrary } from "./notes-library";
import { TopBar } from "./top-bar";

export function Workspace() {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  // List of all notes (metadata)
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Content store refs (zero typing/drawing lag)
  const docs = useRef(new Map<string, JSONContent>());
  const scenes = useRef(new Map<string, Scene>());
  const skeletons = useRef(new Map<string, any>());
  const versions = useRef(new Map<string, number>());

  // Active note selection & detail load state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeContentReady, setActiveContentReady] = useState(false);

  const [query, setQuery] = useState("");
  const [libOpen, setLibOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutMode>("split");
  const [mobileTab, setMobileTab] = useState<"notes" | "canvas">("notes");
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");
  const area = useRef<HTMLDivElement>(null);

  // Auto-save mutation queue and execution locks
  const pendingMutations = useRef(
    new Map<string, { title?: string; doc?: JSONContent; scene?: Scene }>()
  );
  const isSavingRef = useRef(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  // Initial Responsive layout
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) setLibOpen(true);
  }, []);

  // Flush pending auto-save mutations
  const flushSaves = useCallback(async () => {
    if (pendingMutations.current.size === 0 || isSavingRef.current) return;
    isSavingRef.current = true;

    while (pendingMutations.current.size > 0) {
      // Pick first mutation entry
      const [id, mutation] = pendingMutations.current.entries().next().value as [
        string,
        { title?: string; doc?: JSONContent; scene?: Scene }
      ];
      pendingMutations.current.delete(id);

      const expectedVersion = versions.current.get(id);

      try {
        const res = await fetch(`/api/notes/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...mutation,
            expectedVersion,
          }),
        });

        if (res.ok) {
          const updated: NoteDetail = await res.json();
          versions.current.set(id, updated.version ?? (expectedVersion ?? 1) + 1);
        } else if (res.status === 409) {
          setSyncStatus("conflict");
          const errorData = await res.json();
          const serverVersion = errorData?.error?.details?.currentNote?.version;
          if (serverVersion) versions.current.set(id, serverVersion);

          // Re-queue latest user changes in memory to retry cleanly
          const currentDoc = docs.current.get(id);
          const currentScene = scenes.current.get(id);
          pendingMutations.current.set(id, {
            ...mutation,
            ...(currentDoc ? { doc: currentDoc } : {}),
            ...(currentScene ? { scene: currentScene } : {}),
          });
        } else {
          // Re-queue on failure so changes are never lost
          pendingMutations.current.set(id, mutation);
          setSyncStatus("offline");
          break;
        }
      } catch {
        pendingMutations.current.set(id, mutation);
        setSyncStatus("offline");
        break;
      }
    }

    isSavingRef.current = false;

    if (pendingMutations.current.size === 0) {
      setSyncStatus("saved");
    } else {
      // More mutations arrived while we were saving; trigger next cycle
      saveTimer.current = setTimeout(() => {
        void flushSaves();
      }, 400);
    }
  }, []);

  const scheduleSave = useCallback(
    (id: string, mutation: { title?: string; doc?: JSONContent; scene?: Scene }) => {
      setSyncStatus("saving");
      const current = pendingMutations.current.get(id) || {};
      pendingMutations.current.set(id, { ...current, ...mutation });

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void flushSaves();
      }, 600);
    },
    [flushSaves]
  );

  // Before unload / page refresh: save any pending mutations immediately
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingMutations.current.size > 0) {
        for (const [id, mutation] of pendingMutations.current.entries()) {
          const expectedVersion = versions.current.get(id);
          try {
            fetch(`/api/notes/${encodeURIComponent(id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...mutation, expectedVersion }),
              keepalive: true,
            });
          } catch {}
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushSaves();
      }
    };
    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flushSaves]);

  // Load a note's complete document and scene from API if not already in memory
  const loadNoteDetail = useCallback(async (id: string) => {
    if (docs.current.has(id) && scenes.current.has(id)) {
      setActiveContentReady(true);
      return;
    }

    setActiveContentReady(false);
    try {
      const res = await fetch(`/api/notes/${encodeURIComponent(id)}`);
      if (res.ok) {
        const detail: NoteDetail = await res.json();
        docs.current.set(id, detail.doc ?? EMPTY_DOC);
        scenes.current.set(id, detail.scene ?? { elements: [], appState: {} });
        versions.current.set(id, detail.version ?? 1);
        setActiveContentReady(true);
      } else {
        // Fallback for missing note
        if (!docs.current.has(id)) docs.current.set(id, EMPTY_DOC);
        if (!scenes.current.has(id)) scenes.current.set(id, { elements: [], appState: {} });
        setActiveContentReady(true);
      }
    } catch {
      if (!docs.current.has(id)) docs.current.set(id, EMPTY_DOC);
      if (!scenes.current.has(id)) scenes.current.set(id, { elements: [], appState: {} });
      setActiveContentReady(true);
    }
  }, []);

  // Initial Load from API
  useEffect(() => {
    let cancelled = false;

    async function initializeWorkspace() {
      try {
        const res = await fetch("/api/notes?limit=100");
        if (cancelled) return;

        if (res.ok) {
          const data: PaginatedResponse<NoteMeta> = await res.json();
          const items = data.items || [];
          setNotes(items);

          if (items.length > 0) {
            // Check if there was an active note previously selected in localStorage
            const savedActiveId = typeof window !== "undefined" ? localStorage.getItem("notesapp_active_id") : null;
            const target = items.find((n) => n.id === savedActiveId) ?? items[0];
            const targetId = target.id;

            setActiveId(targetId);
            // Fetch detail BEFORE marking content as ready
            await loadNoteDetail(targetId);
          } else {
            setActiveContentReady(true);
          }
          setSyncStatus("saved");
        } else {
          // Offline fallback
          fallbackToMock();
        }
      } catch {
        fallbackToMock();
      } finally {
        if (!cancelled) setInitialLoaded(true);
      }
    }

    function fallbackToMock() {
      setNotes(MOCK_NOTES.map(({ id, title, updatedAt }) => ({ id, title, updatedAt })));
      MOCK_NOTES.forEach((n) => {
        docs.current.set(n.id, n.doc);
        skeletons.current.set(n.id, n.skeleton);
        versions.current.set(n.id, 1);
      });
      const firstId = MOCK_NOTES[0].id;
      setActiveId(firstId);
      setActiveContentReady(true);
      setSyncStatus("offline");
    }

    void initializeWorkspace();
    return () => {
      cancelled = true;
    };
  }, [loadNoteDetail]);

  // Handle note selection from library
  const handleSelectNote = useCallback(
    async (id: string) => {
      setActiveId(id);
      if (typeof window !== "undefined") {
        localStorage.setItem("notesapp_active_id", id);
      }
      if (!window.matchMedia("(min-width: 768px)").matches) setLibOpen(false);
      await loadNoteDetail(id);
    },
    [loadNoteDetail]
  );

  const getDoc = useCallback((id: string) => docs.current.get(id) ?? EMPTY_DOC, []);
  const getScene = useCallback((id: string) => scenes.current.get(id), []);
  const getSkeleton = useCallback((id: string) => skeletons.current.get(id), []);

  const onSceneChange = useCallback(
    (id: string, s: Scene) => {
      scenes.current.set(id, s);
      scheduleSave(id, { scene: s });
    },
    [scheduleSave]
  );

  const onDocChange = useCallback(
    (id: string, doc: JSONContent) => {
      docs.current.set(id, doc);
      setNotes((all) => all.map((n) => (n.id === id ? { ...n, updatedAt: Date.now() } : n)));
      scheduleSave(id, { doc });
    },
    [scheduleSave]
  );

  const createNote = useCallback(async () => {
    setSyncStatus("saving");
    const localId = crypto.randomUUID();
    docs.current.set(localId, EMPTY_DOC);
    scenes.current.set(localId, { elements: [], appState: {} });
    versions.current.set(localId, 1);

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "",
          doc: EMPTY_DOC,
          scene: { elements: [], appState: {} },
        }),
      });

      if (res.ok) {
        const created: NoteDetail = await res.json();
        docs.current.set(created.id, created.doc ?? EMPTY_DOC);
        scenes.current.set(created.id, created.scene ?? { elements: [], appState: {} });
        versions.current.set(created.id, created.version ?? 1);

        setNotes((all) => [
          { id: created.id, title: created.title, updatedAt: created.updatedAt, version: created.version },
          ...all.filter((n) => n.id !== localId),
        ]);

        setActiveId(created.id);
        setActiveContentReady(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("notesapp_active_id", created.id);
        }
        setSyncStatus("saved");
      } else {
        // Fallback to local
        setNotes((all) => [{ id: localId, title: "", updatedAt: Date.now() }, ...all]);
        setActiveId(localId);
        setActiveContentReady(true);
        setSyncStatus("offline");
      }
    } catch {
      setNotes((all) => [{ id: localId, title: "", updatedAt: Date.now() }, ...all]);
      setActiveId(localId);
      setActiveContentReady(true);
      setSyncStatus("offline");
    }

    setMobileTab("notes");
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    docs.current.delete(id);
    scenes.current.delete(id);
    versions.current.delete(id);
    pendingMutations.current.delete(id);

    setNotes((all) => {
      const remaining = all.filter((n) => n.id !== id);
      return remaining;
    });

    setActiveId((prev) => {
      if (prev === id) {
        return null;
      }
      return prev;
    });

    try {
      await fetch(`/api/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      // Deletion silently handled locally
    }
  }, []);

  const rename = useCallback(
    (title: string) => {
      if (!activeId) return;
      setNotes((all) => all.map((n) => (n.id === activeId ? { ...n, title } : n)));
      scheduleSave(activeId, { title });
    },
    [activeId, scheduleSave]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar: Ctrl+\ or Cmd+\
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        setLibOpen((o) => !o);
      }
      // Create new note: Ctrl+Alt+N or Alt+N
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n" && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea" && !(e.target as HTMLElement)?.isContentEditable) {
          e.preventDefault();
          void createNote();
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
  const slide = dragging ? "" : "md:transition-[width] md:duration-150";

  return (
    <div className="flex h-dvh flex-col bg-surface text-ink">
      <TopBar
        title={active ? active.title : null}
        onTitle={rename}
        libOpen={libOpen}
        onToggleLib={() => setLibOpen((o) => !o)}
        layout={layout}
        onLayout={setLayout}
        syncStatus={syncStatus}
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
              onSelect={(id) => void handleSelectNote(id)}
              onCreate={() => void createNote()}
              onDelete={(id) => void deleteNote(id)}
            />
          </div>
        )}

        {!initialLoaded ? (
          <div className="grid flex-1 place-items-center bg-surface">
            <div className="flex flex-col items-center gap-2.5 text-muted">
              <Loader2 size={24} className="animate-spin text-accent" />
              <p className="text-xs font-medium">Loading your notes workspace...</p>
            </div>
          </div>
        ) : active ? (
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
              {activeContentReady ? (
                <>
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
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center bg-surface text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={20} className="animate-spin text-accent" />
                    <p className="text-xs">Loading note contents...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
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
                onClick={() => void createNote()}
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
