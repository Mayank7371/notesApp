"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline,
  UploadCloud,
} from "lucide-react";
import { SlashMenu, createSlashExtension, type SlashMenuState } from "./slash-command";

const lowlight = createLowlight(common);

type Props = {
  noteId: string;
  getDoc: (id: string) => JSONContent;
  onChange: (id: string, doc: JSONContent) => void;
};

function NoteEditorBase({ noteId, getDoc, onChange }: Props) {
  const [slashState, setSlashState] = useState<SlashMenuState | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertImageFile = useCallback((file: File, ed: Editor) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) {
        ed.chain().focus().setImage({ src }).run();
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const triggerImageUpload = useCallback(async (ed: Editor) => {
    // Check if user has an image in clipboard to paste instantly
    if (typeof navigator !== "undefined" && navigator.clipboard?.read) {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith("image/"));
          if (imageType) {
            const blob = await item.getType(imageType);
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              if (src) ed.chain().focus().setImage({ src }).run();
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      } catch {
        // Clipboard read permission denied or no image; proceed to file picker
      }
    }
    fileInputRef.current?.click();
  }, []);

  const triggerImageUrl = useCallback((ed: Editor) => {
    const url = window.prompt("Enter image URL (https://...)");
    if (url?.trim()) {
      ed.chain().focus().setImage({ src: url.trim() }).run();
    }
  }, []);

  const slashExtension = useMemo(() => {
    return createSlashExtension({
      onStateChange: setSlashState,
      onImageRequest: (ed) => triggerImageUpload(ed),
      onImageUrlRequest: (ed) => triggerImageUrl(ed),
    });
  }, [triggerImageUpload, triggerImageUrl]);

  const editor = useEditor({
    immediatelyRender: false,
    content: getDoc(noteId),
    extensions: [
      StarterKit.configure({ codeBlock: false, link: { openOnClick: false, autolink: true } }),
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({
        placeholder: "Press '/' for commands or start typing your thoughts...",
      }),
      slashExtension,
    ],
    editorProps: {
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith("image/"));
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              if (src) {
                const node = view.state.schema.nodes.image?.create({ src });
                if (node) {
                  const tr = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(tr);
                }
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        setIsDraggingFile(false);
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFile = files.find((file) => file.type.startsWith("image/"));
        if (imageFile) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src) {
              const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (coords) {
                const node = view.state.schema.nodes.image?.create({ src });
                if (node) {
                  const tr = view.state.tr.insert(coords.pos, node);
                  view.dispatch(tr);
                }
              }
            }
          };
          reader.readAsDataURL(imageFile);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(noteId, editor.getJSON());
      const text = editor.getText().trim();
      setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0);
    },
  });

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      insertImageFile(file, editor);
    }
    e.target.value = "";
  };

// Word count is statefully updated during editor onUpdate to prevent document AST traversals

  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div
      className="relative flex h-full min-h-0 flex-col bg-panel"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDraggingFile(false);
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Floating Drag Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-panel/90 backdrop-blur-xs border-2 border-dashed border-accent animate-in fade-in duration-150 pointer-events-none">
          <div className="flex flex-col items-center gap-2 rounded-xl bg-surface p-6 shadow-lg border border-line">
            <UploadCloud size={32} className="text-accent animate-bounce" />
            <p className="text-sm font-semibold text-ink">Drop image to insert</p>
            <p className="text-xs text-muted">Supports PNG, JPEG, GIF, and WebP</p>
          </div>
        </div>
      )}

      {/* Structured Formatting Toolbar */}
      <Toolbar
        editor={editor}
        onInsertImage={() => editor && triggerImageUpload(editor)}
      />

      {/* Scrollable Note Content Canvas */}
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        onClick={() => editor?.commands.focus()}
      >
        <div className="mx-auto max-w-[70ch] px-8 py-10 pb-20">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Editor Stats Footer Bar */}
      <div className="flex h-7 shrink-0 items-center justify-between border-t border-line/60 bg-panel/80 px-4 text-[11px] text-muted select-none">
        <div className="flex items-center gap-3">
          <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
          <span className="text-line">•</span>
          <span>{readTimeMin} min read</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Type <kbd className="rounded border border-line bg-surface px-1 py-0.2 font-mono text-[10px]">/{""}</kbd> for block options</span>
        </div>
      </div>

      {slashState && (
        <SlashMenu state={slashState} onClose={() => setSlashState(null)} />
      )}
    </div>
  );
}

export const NoteEditor = memo(NoteEditorBase);

function Toolbar({
  editor,
  onInsertImage,
}: {
  editor: Editor | null;
  onInsertImage: () => void;
}) {
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      h1: editor?.isActive("heading", { level: 1 }) ?? false,
      h2: editor?.isActive("heading", { level: 2 }) ?? false,
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      underline: editor?.isActive("underline") ?? false,
      strike: editor?.isActive("strike") ?? false,
      bullet: editor?.isActive("bulletList") ?? false,
      ordered: editor?.isActive("orderedList") ?? false,
      task: editor?.isActive("taskList") ?? false,
      quote: editor?.isActive("blockquote") ?? false,
      code: editor?.isActive("codeBlock") ?? false,
      link: editor?.isActive("link") ?? false,
    }),
  });

  if (!editor || !active) {
    return <div className="h-11 border-b border-line" />;
  }

  const run = () => editor.chain().focus();

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Enter hyperlink URL (https://...):", previousUrl);
    if (url === null) return;
    if (url.trim() === "") {
      run().unsetLink().run();
    } else {
      run().setLink({ href: url.trim() }).run();
    }
  };

  const toolBtn = (isActive: boolean) =>
    `grid size-7.5 place-items-center rounded-md transition-all duration-150 active:scale-95 ${
      isActive
        ? "bg-accent/15 text-accent font-semibold"
        : "text-muted hover:bg-hover hover:text-ink"
    }`;

  return (
    <div
      role="toolbar"
      aria-label="Formatting controls"
      className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-line px-3 select-none"
    >
      {/* Headings */}
      <button
        type="button"
        title="Heading 1"
        aria-label="Heading 1"
        aria-pressed={active.h1}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run().toggleHeading({ level: 1 }).run()}
        className={toolBtn(active.h1)}
      >
        <Heading1 size={15} />
      </button>

      <button
        type="button"
        title="Heading 2"
        aria-label="Heading 2"
        aria-pressed={active.h2}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run().toggleHeading({ level: 2 }).run()}
        className={toolBtn(active.h2)}
      >
        <Heading2 size={15} />
      </button>

      <div className="mx-1 h-4 w-px bg-line" aria-hidden="true" />

      {/* Inline Text Styles */}
      <button
        type="button"
        title="Bold (Ctrl+B)"
        aria-label="Bold (Ctrl+B)"
        aria-pressed={active.bold}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run().toggleBold().run()}
        className={toolBtn(active.bold)}
      >
        <Bold size={15} />
      </button>

      <button
        type="button"
        title="Italic (Ctrl+I)"
        aria-label="Italic (Ctrl+I)"
        aria-pressed={active.italic}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run().toggleItalic().run()}
        className={toolBtn(active.italic)}
      >
        <Italic size={15} />
      </button>

      <button
        type="button"
        title="Underline (Ctrl+U)"
        aria-label="Underline (Ctrl+U)"
        aria-pressed={active.underline}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run().toggleUnderline().run()}
        className={toolBtn(active.underline)}
      >
        <Underline size={15} />
      </button>

      <button
        type="button"
        title="Strikethrough"
        aria-label="Strikethrough"
        aria-pressed={active.strike}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run().toggleStrike().run()}
        className={toolBtn(active.strike)}
      >
        <Strikethrough size={15} />
      </button>

      <div className="mx-1 h-4 w-px bg-line" aria-hidden="true" />

      {/* Lists */}
      <button
        type="button"
        title="Bullet list"
        aria-label="Bullet list"
        aria-pressed={active.bullet}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run().toggleBulletList().run()}
        className={toolBtn(active.bullet)}
      >
        <List size={15} />
      </button>

      <button
        type="button"
        title="Numbered list"
        aria-label="Numbered list"
        aria-pressed={active.ordered}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run().toggleOrderedList().run()}
        className={toolBtn(active.ordered)}
      >
        <ListOrdered size={15} />
      </button>

      <button
        type="button"
        title="Task checklist"
        aria-label="Task checklist"
        aria-pressed={active.task}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run().toggleTaskList().run()}
        className={toolBtn(active.task)}
      >
        <ListChecks size={15} />
      </button>

      <div className="mx-1 h-4 w-px bg-line" aria-hidden="true" />

      {/* Blocks & Media */}
      <button
        type="button"
        title="Quote blockout"
        aria-label="Quote blockout"
        aria-pressed={active.quote}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run().toggleBlockquote().run()}
        className={toolBtn(active.quote)}
      >
        <Quote size={15} />
      </button>

      <button
        type="button"
        title="Code block"
        aria-label="Code block"
        aria-pressed={active.code}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run().toggleCodeBlock().run()}
        className={toolBtn(active.code)}
      >
        <Code size={15} />
      </button>

      <button
        type="button"
        title="Insert image (from device or clipboard)"
        aria-label="Insert image"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onInsertImage}
        className={toolBtn(false)}
      >
        <ImageIcon size={15} />
      </button>

      <button
        type="button"
        title="Insert or edit hyperlink"
        aria-label="Insert or edit hyperlink"
        aria-pressed={active.link}
        onMouseDown={(e) => e.preventDefault()}
        onClick={setLink}
        className={toolBtn(active.link)}
      >
        <Link2 size={15} />
      </button>
    </div>
  );
}
