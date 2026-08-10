"use client";

import { useTheme } from "next-themes";
import { Moon, PanelLeft, Sun } from "lucide-react";

type Props = {
  title: string | null;
  onTitle: (t: string) => void;
  libOpen: boolean;
  onToggleLib: () => void;
};

const btn = "grid size-8 place-items-center rounded text-muted transition-colors hover:bg-hover hover:text-ink";

export function TopBar({ title, onTitle, libOpen, onToggleLib }: Props) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-panel px-2">
      <button type="button" className={btn} onClick={onToggleLib} title="Toggle notes library">
        <PanelLeft size={16} />
      </button>
      <span className="hidden text-sm font-semibold tracking-tight sm:block">Notes + Canvas</span>
      <div className="mx-2 h-4 w-px bg-line" />
      {title !== null ? (
        <input
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="Untitled"
          className="h-8 min-w-0 flex-1 rounded bg-transparent px-2 text-sm font-medium outline-none hover:bg-hover focus:bg-hover"
        />
      ) : (
        <span className="flex-1 px-2 text-sm text-muted">No note open</span>
      )}
      <button
        type="button"
        className={btn}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        title="Toggle theme"
      >
        <Sun size={16} className="hidden dark:block" />
        <Moon size={16} className="dark:hidden" />
      </button>
    </header>
  );
}
