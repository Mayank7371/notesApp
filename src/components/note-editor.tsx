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
    // Fall back to opening file selector
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
        placeholder: "Start writing, or type '/' for commands (image, code block…)",
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
    onUpdate: ({ editor }) => onChange(noteId, editor.getJSON()),
  });

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      insertImageFile(file, editor);
    }
    // Reset file input so the same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileInputChange}
        className="hidden"
        aria-hidden="true"
      />
      <Toolbar
        editor={editor}
        onInsertImage={() => editor && triggerImageUpload(editor)}
      />
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        onClick={() => editor?.commands.focus()}
      >
        <div className="mx-auto max-w-[68ch] px-6 py-8">
          <EditorContent editor={editor} />
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
  if (!editor || !active) return <div className="h-10 border-b border-line" />;

  const run = () => editor.chain().focus();
  const setLink = () => {
    const url = window.prompt("Link URL", editor.getAttributes("link").href ?? "");
    if (url === null) return;
    if (url === "") run().unsetLink().run();
    else run().setLink({ href: url }).run();
  };

  const items = [
    { label: "Heading", Icon: Heading2, on: active.h2, act: () => run().toggleHeading({ level: 2 }).run() },
    { label: "Bold (Ctrl+B)", Icon: Bold, on: active.bold, act: () => run().toggleBold().run() },
    { label: "Italic (Ctrl+I)", Icon: Italic, on: active.italic, act: () => run().toggleItalic().run() },
    { label: "Underline (Ctrl+U)", Icon: Underline, on: active.underline, act: () => run().toggleUnderline().run() },
    { label: "Strikethrough", Icon: Strikethrough, on: active.strike, act: () => run().toggleStrike().run() },
    { label: "Bullet list", Icon: List, on: active.bullet, act: () => run().toggleBulletList().run() },
    { label: "Numbered list", Icon: ListOrdered, on: active.ordered, act: () => run().toggleOrderedList().run() },
    { label: "Checklist", Icon: ListChecks, on: active.task, act: () => run().toggleTaskList().run() },
    { label: "Quote", Icon: Quote, on: active.quote, act: () => run().toggleBlockquote().run() },
    { label: "Code block", Icon: Code, on: active.code, act: () => run().toggleCodeBlock().run() },
    { label: "Insert image", Icon: ImageIcon, on: false, act: onInsertImage },
    { label: "Link", Icon: Link2, on: active.link, act: setLink },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex h-10 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-line px-3"
    >
      {items.map(({ label, Icon, on, act }) => (
        <button
          key={label}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={on}
          onMouseDown={(e) => e.preventDefault()}
          onClick={act}
          className={`grid size-7 shrink-0 place-items-center rounded transition-colors ${
            on ? "bg-hover text-accent" : "text-muted hover:bg-hover hover:text-ink"
          }`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
