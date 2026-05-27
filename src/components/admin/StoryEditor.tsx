"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TiptapLink from "@tiptap/extension-link";
import { useState, useEffect, useRef } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading2, Heading3, Quote, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo,
  BookMarked, Search,
} from "lucide-react";

interface StoryResult {
  id: string;
  title: string;
  slug: string;
  published: boolean;
}

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
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
      }),
      Placeholder.configure({ placeholder: "Write your story here…" }),
      CharacterCount,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: { class: "tiptap" },
    },
  });

  // ── Story link picker state ───────────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StoryResult[]>([]);
  const [searching, setSearching] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!pickerOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        closePicker();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [pickerOpen]);

  // Focus input when picker opens
  useEffect(() => {
    if (pickerOpen) setTimeout(() => inputRef.current?.focus(), 30);
  }, [pickerOpen]);

  // Debounced search
  useEffect(() => {
    if (!pickerOpen || query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/stories/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [query, pickerOpen]);

  function closePicker() {
    setPickerOpen(false);
    setQuery("");
    setResults([]);
  }

  function insertStoryLink(slug: string, title: string) {
    if (!editor) return;
    editor.chain().focus().insertContent(`<a href="/stories/${slug}">${title}</a>`).run();
    closePicker();
  }

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
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnClass()} style={btnStyle()} title="Undo">
          <Undo size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnClass()} style={btnStyle()} title="Redo">
          <Redo size={15} />
        </button>

        <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))} style={btnStyle(editor.isActive("bold"))} title="Bold">
          <Bold size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))} style={btnStyle(editor.isActive("italic"))} title="Italic">
          <Italic size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive("underline"))} style={btnStyle(editor.isActive("underline"))} title="Underline">
          <UnderlineIcon size={15} />
        </button>

        <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive("heading", { level: 2 }))} style={btnStyle(editor.isActive("heading", { level: 2 }))} title="Heading 2">
          <Heading2 size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive("heading", { level: 3 }))} style={btnStyle(editor.isActive("heading", { level: 3 }))} title="Heading 3">
          <Heading3 size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))} style={btnStyle(editor.isActive("blockquote"))} title="Quote">
          <Quote size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))} style={btnStyle(editor.isActive("bulletList"))} title="Bullet list">
          <List size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))} style={btnStyle(editor.isActive("orderedList"))} title="Ordered list">
          <ListOrdered size={15} />
        </button>

        <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btnClass(editor.isActive({ textAlign: "left" }))} style={btnStyle(editor.isActive({ textAlign: "left" }))} title="Align left">
          <AlignLeft size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btnClass(editor.isActive({ textAlign: "center" }))} style={btnStyle(editor.isActive({ textAlign: "center" }))} title="Align center">
          <AlignCenter size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={btnClass(editor.isActive({ textAlign: "right" }))} style={btnStyle(editor.isActive({ textAlign: "right" }))} title="Align right">
          <AlignRight size={15} />
        </button>

        <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

        {/* Link Story picker */}
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className={btnClass(pickerOpen)}
            style={btnStyle(pickerOpen)}
            title="Link an internal story"
          >
            <BookMarked size={15} />
          </button>

          {pickerOpen && (
            <div
              className="absolute left-0 top-full mt-1.5 z-50 rounded-xl shadow-2xl overflow-hidden"
              style={{
                width: "280px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
              }}
            >
              {/* Search input */}
              <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <Search size={13} className="shrink-0" style={{ color: "var(--muted-foreground)" }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && closePicker()}
                  placeholder="Search stories…"
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ color: "var(--foreground)" }}
                />
              </div>

              {/* Results */}
              <div className="max-h-56 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                {searching ? (
                  <p className="px-3 py-4 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                    Searching…
                  </p>
                ) : query.trim().length < 2 ? (
                  <p className="px-3 py-4 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                    Type at least 2 characters
                  </p>
                ) : results.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                    No stories found
                  </p>
                ) : (
                  results.map((story) => (
                    <button
                      key={story.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent editor blur
                        insertStoryLink(story.slug, story.title);
                      }}
                      className="w-full text-left px-3 py-2.5 transition-opacity hover:opacity-75"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium leading-snug" style={{ color: "var(--foreground)" }}>
                          {story.title}
                        </span>
                        {!story.published && (
                          <span
                            className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
                          >
                            draft
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-mono mt-0.5 block" style={{ color: "var(--muted-foreground)" }}>
                        /stories/{story.slug}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto text-xs" style={{ color: "var(--muted-foreground)" }}>
          {editor.storage.characterCount?.words() ?? 0} words
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
