"use client";

import { useState, memo, useMemo } from "react";
import { FileText, Plus, Search, Trash2, X, AlertCircle } from "lucide-react";
import type { NoteMeta } from "@/lib/types";

type Props = {
  notes: NoteMeta[];
  activeId: string | null;
  query: string;
  onQuery: (q: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

function formatRelativeTime(ts: number) {
  const diffMinutes = Math.round((Date.now() - ts) / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function NotesLibraryBase({
  notes,
  activeId,
  query,
  onQuery,
  onSelect,
  onCreate,
  onDelete,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const shown = useMemo(
    () =>
      notes
        .filter((n) => n.title.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [notes, query]
  );

  const handleConfirmDelete = (id: string) => {
    onDelete(id);
    setDeletingId(null);
  };

  return (
    <nav
      aria-label="Notes library"
      className="flex h-full w-72 shrink-0 flex-col border-r border-line bg-panel select-none"
    >
      {/* Top Header & New Note Action */}
      <div className="flex flex-col gap-2 p-3 border-b border-line/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Notes
            </span>
            <span
              className="rounded-full bg-surface px-1.5 py-0.2 text-[10.5px] font-medium text-muted border border-line"
              aria-live="polite"
            >
              {query.trim() ? `${shown.length} found` : notes.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onCreate}
            title="Create new note (Ctrl+N)"
            aria-label="Create new note"
            className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white shadow-xs transition-all duration-150 hover:bg-accent/90 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          >
            <Plus size={14} />
            <span>New Note</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <label className="flex h-8.5 w-full items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-muted transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
            <Search size={14} className="shrink-0 text-muted/70" />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search all notes..."
              aria-label="Search notes"
              className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-muted/70"
            />
            {query.trim() && (
              <button
                type="button"
                onClick={() => onQuery("")}
                aria-label="Clear search"
                className="grid size-4 place-items-center rounded-full text-muted hover:text-ink"
              >
                <X size={12} />
              </button>
            )}
          </label>
        </div>
      </div>

      {/* Notes List */}
      <ul className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1">
        {shown.map((n) => {
          const isActive = n.id === activeId;
          const isDeleting = deletingId === n.id;

          return (
            <li key={n.id} className="group relative">
              {isDeleting ? (
                /* Inline Delete Confirmation Card */
                <div className="flex flex-col gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                    <AlertCircle size={14} className="shrink-0" />
                    <span className="truncate">Delete &quot;{n.title || "Untitled"}&quot;?</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      className="rounded px-2 py-0.5 text-muted hover:bg-hover hover:text-ink transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmDelete(n.id)}
                      className="rounded bg-red-600 px-2 py-0.5 font-medium text-white shadow-xs hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                /* Note Item Button */
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onSelect(n.id)}
                    aria-current={isActive}
                    className={`flex flex-1 items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150 ${
                      isActive
                        ? "bg-accent-muted text-accent font-medium shadow-2xs border-l-3 border-accent"
                        : "text-ink hover:bg-hover hover:text-ink border-l-3 border-transparent"
                    }`}
                  >
                    <FileText
                      size={16}
                      className={`mt-0.5 shrink-0 ${
                        isActive ? "text-accent" : "text-muted/80 group-hover:text-muted"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-xs ${
                          isActive ? "font-semibold text-ink" : "text-ink"
                        }`}
                      >
                        {n.title || "Untitled note"}
                      </span>
                      <span className="block text-[11px] text-muted">
                        {formatRelativeTime(n.updatedAt)}
                      </span>
                    </div>
                  </button>

                  {/* Delete Trigger Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(n.id);
                    }}
                    title={`Delete "${n.title || "Untitled"}"`}
                    aria-label={`Delete ${n.title || "Untitled"}`}
                    className="absolute right-1.5 top-2.5 grid size-7 place-items-center rounded-md text-muted/60 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 size={13.5} />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Empty States */}
      {shown.length === 0 && (
        <div className="flex flex-col items-center justify-center p-6 text-center text-muted">
          <FileText size={28} className="mb-2 text-muted/50" />
          <p className="text-xs font-medium text-ink">
            {notes.length === 0 ? "No notes yet" : "No matching notes found"}
          </p>
          <p className="mt-1 text-[11px] text-muted max-w-[180px]">
            {notes.length === 0
              ? "Start by creating your first note."
              : `No notes match "${query.trim()}".`}
          </p>
          {notes.length === 0 ? (
            <button
              type="button"
              onClick={onCreate}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-accent/90"
            >
              <Plus size={14} />
              Create Note
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onQuery("")}
              className="mt-3 text-xs text-accent underline underline-offset-2 hover:opacity-80"
            >
              Clear search query
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

export const NotesLibrary = memo(NotesLibraryBase);
