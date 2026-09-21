"use client";

import { Extension, type Editor, type Range } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import type { LucideIcon } from "lucide-react";

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
