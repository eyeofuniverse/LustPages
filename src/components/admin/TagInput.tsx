"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}

export function TagInput({ value, onChange, suggestions, placeholder = "Type a tag and press Enter…" }: TagInputProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = input.trim()
    ? suggestions
        .filter((s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s))
        .slice(0, 8)
    : [];

  function commit(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput("");
    setOpen(false);
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(filtered.length > 0 ? filtered[0] : input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[42px] px-3 py-2 rounded-xl cursor-text"
        style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
            style={{
              background: "rgba(196,66,106,0.15)",
              color: "#c4426a",
              border: "1px solid rgba(196,66,106,0.3)",
            }}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="opacity-60 hover:opacity-100 transition-opacity leading-none"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[100px] text-sm bg-transparent outline-none"
          style={{ color: "var(--foreground)" }}
        />
      </div>

      {open && filtered.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}
        >
          {filtered.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); commit(tag); }}
              className="w-full text-left px-3 py-2 text-sm transition-opacity hover:opacity-75"
              style={{ color: "var(--foreground)", background: "transparent" }}
            >
              <span className="text-xs mr-1.5" style={{ color: "var(--muted-foreground)" }}>#</span>
              {tag}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
        Enter or comma to add · Backspace to remove last
      </p>
    </div>
  );
}
