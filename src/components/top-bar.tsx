"use client";

import { useTheme } from "next-themes";
import { Columns2, Moon, PanelLeft, PanelLeftClose, Sun, PencilRuler, FileText } from "lucide-react";
import type { LayoutMode } from "@/lib/types";

type Props = {
  title: string | null;
  onTitle: (t: string) => void;
  libOpen: boolean;
  onToggleLib: () => void;
  layout: LayoutMode;
  onLayout: (l: LayoutMode) => void;
};

const btn = "grid size-9 place-items-center rounded text-muted transition-colors hover:bg-hover hover:text-ink";

export function TopBar({ title, onTitle, libOpen, onToggleLib, layout, onLayout }: Props) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-panel px-2">
      <button type="button" className={btn} onClick={onToggleLib} title="Toggle notes library" aria-label="Toggle notes library">
        {libOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
      </button>
      <span className="hidden text-sm font-semibold tracking-tight sm:block">Notes + Canvas</span>
      <div className="mx-2 h-4 w-px bg-line" />
      {title !== null ? (
        <input
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="Untitled"
          aria-label="Note title"
          className="h-8 min-w-0 flex-1 rounded bg-transparent px-2 text-sm font-medium outline-none hover:bg-hover focus:bg-hover"
        />
      ) : (
        <span className="flex-1 px-2 text-sm text-muted">No note open</span>
      )}
      <div className="hidden md:flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted" title="Changes auto-saved locally in your browser workspace">
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-normal text-[11.5px]">Local storage</span>
      </div>
      <div className="hidden items-center md:flex" role="group" aria-label="Layout">
        <button type="button" className={btn} onClick={() => onLayout("notes")} aria-pressed={layout === "notes"} title="Focus notes" aria-label="Focus notes"><FileText size={15} /></button>
        <button type="button" className={btn} onClick={() => onLayout("split")} aria-pressed={layout === "split"} title="Split view" aria-label="Split view"><Columns2 size={15} /></button>
        <button type="button" className={btn} onClick={() => onLayout("canvas")} aria-pressed={layout === "canvas"} title="Focus canvas" aria-label="Focus canvas"><PencilRuler size={15} /></button>
      </div>
      <button
        type="button"
        className={btn}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        title="Toggle theme"
        aria-label="Toggle theme"
      >
        <Sun size={16} className="hidden dark:block" />
        <Moon size={16} className="dark:hidden" />
      </button>
    </header>
  );
}
