"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Extension, type Editor, type Range } from "@tiptap/react";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import {
  Code,
  Globe,
  Heading1,
  Heading2,
  Image as ImageIcon,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  type LucideIcon,
} from "lucide-react";

export interface SlashItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  keywords?: string[];
  command: (params: { editor: Editor; range: Range }) => void;
}

export interface SlashMenuState {
  isOpen: boolean;
  items: SlashItem[];
  selectedIndex: number;
  position: { top: number; left: number };
  command: (item: SlashItem) => void;
}

type SlashExtensionOptions = {
  onImageRequest?: (editor: Editor, range: Range) => void;
  onImageUrlRequest?: (editor: Editor, range: Range) => void;
  onStateChange: (state: SlashMenuState | null) => void;
};

export function getSlashItems(options?: {
  onImageRequest?: (editor: Editor, range: Range) => void;
  onImageUrlRequest?: (editor: Editor, range: Range) => void;
}): SlashItem[] {
  return [
    {
      id: "image",
      title: "Paste / Upload Image",
      description: "Insert an image from your device or clipboard",
      icon: ImageIcon,
      badge: "Media",
      keywords: ["image", "picture", "photo", "paste", "upload", "img", "file"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        if (options?.onImageRequest) {
          options.onImageRequest(editor, range);
        } else {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                const src = ev.target?.result as string;
                if (src) editor.chain().focus().setImage({ src }).run();
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }
      },
    },
    {
      id: "code-block",
      title: "Coding Block",
      description: "Syntax-highlighted code editor block",
      icon: Code,
      badge: "Code",
      keywords: ["code", "coding", "block", "syntax", "snippet", "programming", "js", "ts", "python"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setCodeBlock().run();
      },
    },
    {
      id: "image-url",
      title: "Image from URL",
      description: "Embed an image using a web link",
      icon: Globe,
      badge: "Embed",
      keywords: ["url", "image", "link", "web", "http"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        if (options?.onImageUrlRequest) {
          options.onImageUrlRequest(editor, range);
        } else {
          const url = window.prompt("Image URL (https://...)");
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }
      },
    },
    {
      id: "heading-1",
      title: "Heading 1",
      description: "Large section heading",
      icon: Heading1,
      badge: "Text",
      keywords: ["h1", "title", "heading", "title", "large"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
      },
    },
    {
      id: "heading-2",
      title: "Heading 2",
      description: "Medium section heading",
      icon: Heading2,
      badge: "Text",
      keywords: ["h2", "heading", "subtitle", "medium"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
      },
    },
    {
      id: "bullet-list",
      title: "Bullet List",
      description: "Create an unordered bulleted list",
      icon: List,
      badge: "List",
      keywords: ["bullet", "list", "unordered", "points"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      id: "ordered-list",
      title: "Numbered List",
      description: "Create a numbered sequence list",
      icon: ListOrdered,
      badge: "List",
      keywords: ["number", "numbered", "list", "ordered", "123"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      id: "task-list",
      title: "Checklist",
      description: "Todo checklist with interactive checkboxes",
      icon: ListChecks,
      badge: "List",
      keywords: ["task", "todo", "check", "checklist", "checkbox"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      id: "quote",
      title: "Quote",
      description: "Blockquote callout section",
      icon: Quote,
      badge: "Format",
      keywords: ["quote", "blockquote", "cite", "callout"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
  ];
}

function calculatePosition(rect: DOMRect | null | undefined): { top: number; left: number } {
  if (!rect || typeof window === "undefined") {
    return { top: 0, left: 0 };
  }

  const menuWidth = 300;
  const menuHeight = 320;
  const padding = 12;

  let left = rect.left;
  if (left + menuWidth > window.innerWidth - padding) {
    left = Math.max(padding, window.innerWidth - menuWidth - padding);
  }
  if (left < padding) left = padding;

  let top = rect.bottom + 6;
  if (top + menuHeight > window.innerHeight - padding && rect.top - menuHeight - 6 > padding) {
    top = rect.top - menuHeight - 6;
  }

  return { top, left };
}

export function createSlashExtension(options: SlashExtensionOptions) {
  const allItems = getSlashItems(options);

  return Extension.create({
    name: "slashCommand",

    addProseMirrorPlugins() {
      let activeIndex = 0;
      let currentItems: SlashItem[] = allItems;
      let currentCommand: ((item: SlashItem) => void) | null = null;
      let isVisible = false;
      let currentPos = { top: 0, left: 0 };

      const syncState = () => {
        if (!isVisible) {
          options.onStateChange(null);
          return;
        }
        options.onStateChange({
          isOpen: true,
          items: currentItems,
          selectedIndex: activeIndex,
          position: currentPos,
          command: (item) => {
            currentCommand?.(item);
            isVisible = false;
            options.onStateChange(null);
          },
        });
      };

      const suggestionOptions: Omit<SuggestionOptions<SlashItem>, "editor"> = {
        char: "/",
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }) => {
          const q = query.toLowerCase().trim();
          if (!q) return allItems;
          return allItems.filter(
            (item) =>
              item.title.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q) ||
              item.keywords?.some((k) => k.includes(q))
          );
        },
        render: () => ({
          onStart: (props) => {
            isVisible = true;
            activeIndex = 0;
            currentItems = props.items;
            currentCommand = props.command;
            currentPos = calculatePosition(props.clientRect?.());
            syncState();
          },
          onUpdate: (props) => {
            currentItems = props.items;
            if (activeIndex >= currentItems.length) activeIndex = 0;
            currentCommand = props.command;
            currentPos = calculatePosition(props.clientRect?.());
            syncState();
          },
          onKeyDown: ({ event }) => {
            if (!isVisible || currentItems.length === 0) return false;

            if (event.key === "ArrowUp") {
              activeIndex = (activeIndex + currentItems.length - 1) % currentItems.length;
              syncState();
              return true;
            }

            if (event.key === "ArrowDown") {
              activeIndex = (activeIndex + 1) % currentItems.length;
              syncState();
              return true;
            }

            if (event.key === "Enter") {
              const item = currentItems[activeIndex];
              if (item && currentCommand) {
                currentCommand(item);
                isVisible = false;
                options.onStateChange(null);
                return true;
              }
              return false;
            }

            if (event.key === "Escape") {
              isVisible = false;
              options.onStateChange(null);
              return true;
            }

            return false;
          },
          onExit: () => {
            isVisible = false;
            options.onStateChange(null);
          },
        }),
      };

      return [
        Suggestion({
          editor: this.editor,
          ...suggestionOptions,
        }),
      ];
    },
  });
}

export function SlashMenu({
  state,
  onClose,
}: {
  state: SlashMenuState;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto scroll active item into view
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [state.selectedIndex]);

  // Click outside to dismiss
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!mounted || !state.isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: `${state.position.top}px`,
        left: `${state.position.left}px`,
      }}
      className="z-50 w-76 overflow-hidden rounded-xl border border-line bg-panel p-1.5 shadow-2xl backdrop-blur-md transition-all duration-100 animate-in fade-in zoom-in-95"
      role="menu"
      aria-orientation="vertical"
    >
      <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
        <span>Insert Block</span>
        <span className="text-[10px] text-muted/80">↑↓ to navigate · ↵ to insert</span>
      </div>

      <div className="max-h-72 overflow-y-auto overscroll-contain py-0.5 scrollbar-thin">
        {state.items.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted">
            No matching blocks found
          </div>
        ) : (
          state.items.map((item, index) => {
            const isSelected = index === state.selectedIndex;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                ref={isSelected ? activeItemRef : null}
                type="button"
                role="menuitem"
                onMouseDown={(e) => {
                  e.preventDefault();
                  state.command(item);
                }}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  isSelected
                    ? "bg-accent/15 text-ink dark:bg-accent/25"
                    : "text-muted hover:bg-hover hover:text-ink"
                }`}
              >
                <div
                  className={`grid size-7 shrink-0 place-items-center rounded-md border transition-colors ${
                    isSelected
                      ? "border-accent/40 bg-accent text-white shadow-xs"
                      : "border-line/70 bg-surface text-muted group-hover:border-line group-hover:text-ink"
                  }`}
                >
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate text-xs font-medium text-ink">
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted/90 bg-surface border border-line/60">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-muted">{item.description}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>,
    document.body
  );
}
