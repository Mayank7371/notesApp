"use client";

import { FileText, Search } from "lucide-react";
import type { NoteMeta } from "@/lib/types";

type Props = {
  notes: NoteMeta[];
  activeId: string | null;
  query: string;
  onQuery: (q: string) => void;
  onSelect: (id: string) => void;
};

export function NotesLibrary({ notes, activeId, query, onQuery, onSelect }: Props) {
  const shown = notes.filter((n) => n.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <nav className="flex h-full w-64 shrink-0 flex-col border-r border-line bg-panel">
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
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {shown.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onSelect(n.id)}
              className={`flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                n.id === activeId ? "bg-hover" : "hover:bg-hover"
              }`}
            >
              <FileText size={15} className="mt-0.5 shrink-0 text-muted" />
              <span className="truncate text-sm">{n.title || "Untitled"}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
