"use client";

import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { common, createLowlight } from "lowlight";
import { Bold, Code, Heading2, Italic, List, ListChecks, ListOrdered, Quote, Strikethrough, Underline } from "lucide-react";

const lowlight = createLowlight(common);

type Props = {
  noteId: string;
  getDoc: (id: string) => JSONContent;
  onChange: (id: string, doc: JSONContent) => void;
};

export function NoteEditor({ noteId, getDoc, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    content: getDoc(noteId),
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    onUpdate: ({ editor }) => onChange(noteId, editor.getJSON()),
  });

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <Toolbar editor={editor} />
      <div className="min-h-0 flex-1 overflow-y-auto" onClick={() => editor?.commands.focus()}>
        <div className="mx-auto max-w-[68ch] px-6 py-8">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
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
    }),
  });
  if (!editor || !active) return <div className="h-10 border-b border-line" />;

  const run = () => editor.chain().focus();
  const items = [
    { label: "Heading", Icon: Heading2, on: active.h2, act: () => run().toggleHeading({ level: 2 }).run() },
    { label: "Bold", Icon: Bold, on: active.bold, act: () => run().toggleBold().run() },
    { label: "Italic", Icon: Italic, on: active.italic, act: () => run().toggleItalic().run() },
    { label: "Underline", Icon: Underline, on: active.underline, act: () => run().toggleUnderline().run() },
    { label: "Strikethrough", Icon: Strikethrough, on: active.strike, act: () => run().toggleStrike().run() },
    { label: "Bullet list", Icon: List, on: active.bullet, act: () => run().toggleBulletList().run() },
    { label: "Numbered list", Icon: ListOrdered, on: active.ordered, act: () => run().toggleOrderedList().run() },
    { label: "Checklist", Icon: ListChecks, on: active.task, act: () => run().toggleTaskList().run() },
    { label: "Quote", Icon: Quote, on: active.quote, act: () => run().toggleBlockquote().run() },
    { label: "Code block", Icon: Code, on: active.code, act: () => run().toggleCodeBlock().run() },
  ];

  return (
    <div role="toolbar" className="flex h-10 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-line px-3">
      {items.map(({ label, Icon, on, act }) => (
        <button
          key={label}
          type="button"
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
