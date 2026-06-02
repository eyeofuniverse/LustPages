"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface TagOption {
  id: string;
  name: string;
  tier: number;
}

interface Props {
  options: TagOption[];
  excludeId?: string;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

export function TagSearchPicker({ options, excludeId, value, onChange, placeholder = "Search tags…" }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = options
    .filter((t) => t.id !== excludeId)
    .filter((t) => !query.trim() || t.name.toLowerCase().includes(query.toLowerCase()));

  const selected = options.find((t) => t.id === value);

  return (
    <div ref={containerRef} className="relative" style={{ minWidth: 200 }}>
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
        style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", cursor: "text" }}
        onClick={() => { if (!open) setOpen(true); }}
      >
        {selected && !query ? (
          <>
            <span className="flex-1 truncate text-xs" style={{ color: "var(--foreground)" }}>{selected.name}</span>
            <span className="text-[10px] shrink-0" style={{ color: "var(--muted-foreground)" }}>T{selected.tier}</span>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(""); }}
              className="opacity-40 hover:opacity-100 shrink-0"
            >
              <X size={10} />
            </button>
          </>
        ) : (
          <input
            className="flex-1 bg-transparent outline-none text-xs min-w-0"
            style={{ color: "var(--foreground)" }}
            placeholder={selected ? selected.name : placeholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
        )}
      </div>

      {open && (
        <div
          className="absolute z-30 top-full mt-1 left-0 w-64 max-h-48 overflow-y-auto rounded-lg shadow-xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
              {query ? "No tags match" : "No tags available"}
            </p>
          ) : (
            filtered.slice(0, 30).map((t) => (
              <button
                key={t.id}
                type="button"
                className="w-full text-left flex items-center justify-between px-3 py-2 text-xs hover:opacity-75 transition-opacity"
                style={{ color: "var(--foreground)" }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(t.id);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="truncate mr-2">{t.name}</span>
                <span className="shrink-0 text-[10px]" style={{ color: "var(--muted-foreground)" }}>T{t.tier}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
