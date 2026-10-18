"use client";

import { useTheme } from "next-themes";
import { Columns2, Moon, PanelLeft, PanelLeftClose, Sun, PencilRuler, FileText, CheckCircle2 } from "lucide-react";
import type { LayoutMode } from "@/lib/types";

type Props = {
  title: string | null;
  onTitle: (t: string) => void;
  libOpen: boolean;
  onToggleLib: () => void;
  layout: LayoutMode;
  onLayout: (l: LayoutMode) => void;
};

const iconBtn = "grid size-9 place-items-center rounded-lg text-muted transition-all duration-150 hover:bg-hover hover:text-ink active:scale-95 focus-visible:ring-2 focus-visible:ring-accent";

export function TopBar({ title, onTitle, libOpen, onToggleLib, layout, onLayout }: Props) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="flex h-13 shrink-0 items-center gap-2.5 border-b border-line bg-panel px-3 select-none">
      <button
        type="button"
        className={iconBtn}
        onClick={onToggleLib}
        title={libOpen ? "Collapse sidebar (Ctrl+\\)" : "Expand sidebar (Ctrl+\\)"}
        aria-label={libOpen ? "Collapse notes sidebar" : "Expand notes sidebar"}
      >
        {libOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
      </button>

      <div className="hidden sm:flex items-center gap-2">
        <span className="text-sm font-semibold tracking-tight text-ink">Notes <span className="text-muted font-normal">+</span> Canvas</span>
      </div>

      <div className="mx-1 h-4 w-px bg-line/80 hidden sm:block" />

      {title !== null ? (
        <div className="flex-1 min-w-0 max-w-xl">
          <input
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Untitled note"
            aria-label="Note title"
            className="h-8.5 w-full rounded-lg bg-transparent px-2.5 text-sm font-medium text-ink transition-colors placeholder:text-muted/60 hover:bg-hover/80 focus:bg-hover focus:outline-none"
          />
        </div>
      ) : (
        <span className="flex-1 px-2.5 text-sm text-muted">No note selected</span>
      )}

      {/* Sync Status Badge */}
      <div
        className="hidden md:flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted"
        title="Changes auto-saved locally in your browser workspace"
      >
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-normal text-[11.5px]">Local storage</span>
      </div>

      {/* Segmented Layout Mode Switcher */}
      <div
        className="hidden md:flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5"
        role="group"
        aria-label="Layout view mode"
      >
        <button
          type="button"
          onClick={() => onLayout("notes")}
          aria-pressed={layout === "notes"}
          title="Focus notes only"
          aria-label="Focus notes only"
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all duration-150 ${
            layout === "notes"
              ? "bg-panel text-ink shadow-xs font-semibold"
              : "text-muted hover:text-ink"
          }`}
        >
          <FileText size={13.5} />
          <span>Notes</span>
        </button>

        <button
          type="button"
          onClick={() => onLayout("split")}
          aria-pressed={layout === "split"}
          title="Split view (Notes + Canvas)"
          aria-label="Split view (Notes + Canvas)"
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all duration-150 ${
            layout === "split"
              ? "bg-panel text-ink shadow-xs font-semibold"
              : "text-muted hover:text-ink"
          }`}
        >
          <Columns2 size={13.5} />
          <span>Split</span>
        </button>

        <button
          type="button"
          onClick={() => onLayout("canvas")}
          aria-pressed={layout === "canvas"}
          title="Focus canvas only"
          aria-label="Focus canvas only"
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all duration-150 ${
            layout === "canvas"
              ? "bg-panel text-ink shadow-xs font-semibold"
              : "text-muted hover:text-ink"
          }`}
        >
          <PencilRuler size={13.5} />
          <span>Canvas</span>
        </button>
      </div>

      {/* Light / Dark Mode Toggle */}
      <button
        type="button"
        className={iconBtn}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      >
        <Sun size={17} className="hidden dark:block text-amber-400" />
        <Moon size={17} className="dark:hidden text-muted hover:text-ink" />
      </button>
    </header>
  );
}
