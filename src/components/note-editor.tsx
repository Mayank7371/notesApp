"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

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
    ],
    onUpdate: ({ editor }) => onChange(noteId, editor.getJSON()),
  });

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-[68ch]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
