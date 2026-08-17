"use client";

import { FileText, Plus, Search, Trash2 } from "lucide-react";
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

function ago(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

export function NotesLibrary({ notes, activeId, query, onQuery, onSelect, onCreate, onDelete }: Props) {
  const shown = notes
    .filter((n) => n.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <nav aria-label="Notes" className="flex h-full w-64 shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-2 p-2">
        <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded border border-line px-2 text-muted focus-within:border-accent">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search notes"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </label>
        <button type="button" onClick={onCreate} title="New note"
          className="grid size-8 place-items-center rounded border border-line text-muted hover:bg-hover hover:text-ink">
          <Plus size={16} />
        </button>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {shown.map((n) => (
          <li key={n.id} className="group relative">
            <button
              type="button"
              onClick={() => onSelect(n.id)}
              className={`flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                n.id === activeId ? "bg-hover" : "hover:bg-hover"
              }`}
            >
              <FileText size={15} className="mt-0.5 shrink-0 text-muted" />
              <span className="min-w-0">
                <span className="block truncate pr-6 text-sm">{n.title || "Untitled"}</span>
                <span className="block text-xs text-muted">{ago(n.updatedAt)}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(n.id)}
              title="Delete note"
              className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded text-muted opacity-0 hover:text-ink group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
      {shown.length === 0 && (
        <p className="px-4 pb-6 text-sm text-muted">
          {notes.length === 0 ? "No notes yet. Select + to create one." : "No notes match that search."}
        </p>
      )}
    </nav>
  );
}
