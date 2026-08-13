"use client";

import { FileText } from "lucide-react";
import type { NoteMeta } from "@/lib/types";

type Props = {
  notes: NoteMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export function NotesLibrary({ notes, activeId, onSelect }: Props) {
  return (
    <nav className="flex h-full w-64 shrink-0 flex-col border-r border-line bg-panel">
      <div className="p-2 text-xs font-semibold uppercase text-muted">Notes</div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {notes.map((n) => (
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
