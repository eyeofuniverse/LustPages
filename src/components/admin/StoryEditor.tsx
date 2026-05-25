"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading2, Heading3, Quote, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo
} from "lucide-react";

interface StoryEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function StoryEditor({ content, onChange }: StoryEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Write your story here…" }),
      CharacterCount,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap",
      },
    },
  });

  if (!editor) return null;

  const btnClass = (active?: boolean) =>
    `p-1.5 rounded-lg transition-all ${active ? "opacity-100" : "opacity-50 hover:opacity-75"}`;

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    background: active ? "rgba(196,66,106,0.15)" : "transparent",
    color: active ? "#c4426a" : "var(--foreground)",
    border: active ? "1px solid rgba(196,66,106,0.3)" : "1px solid transparent",
  });

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-1 p-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={btnClass()}
          style={btnStyle()}
          title="Undo"
        >
          <Undo size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={btnClass()}
          style={btnStyle()}
          title="Redo"
        >
          <Redo size={15} />
        </button>

        <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
          style={btnStyle(editor.isActive("bold"))}
          title="Bold"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive("italic"))}
          style={btnStyle(editor.isActive("italic"))}
          title="Italic"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive("underline"))}
          style={btnStyle(editor.isActive("underline"))}
          title="Underline"
        >
          <UnderlineIcon size={15} />
        </button>

        <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive("heading", { level: 2 }))}
          style={btnStyle(editor.isActive("heading", { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btnClass(editor.isActive("heading", { level: 3 }))}
          style={btnStyle(editor.isActive("heading", { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive("blockquote"))}
          style={btnStyle(editor.isActive("blockquote"))}
          title="Quote"
        >
          <Quote size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive("bulletList"))}
          style={btnStyle(editor.isActive("bulletList"))}
          title="Bullet list"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive("orderedList"))}
          style={btnStyle(editor.isActive("orderedList"))}
          title="Ordered list"
        >
          <ListOrdered size={15} />
        </button>

        <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={btnClass(editor.isActive({ textAlign: "left" }))}
          style={btnStyle(editor.isActive({ textAlign: "left" }))}
          title="Align left"
        >
          <AlignLeft size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={btnClass(editor.isActive({ textAlign: "center" }))}
          style={btnStyle(editor.isActive({ textAlign: "center" }))}
          title="Align center"
        >
          <AlignCenter size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={btnClass(editor.isActive({ textAlign: "right" }))}
          style={btnStyle(editor.isActive({ textAlign: "right" }))}
          title="Align right"
        >
          <AlignRight size={15} />
        </button>

        <div className="ml-auto text-xs" style={{ color: "var(--muted-foreground)" }}>
          {editor.storage.characterCount?.words() ?? 0} words
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
