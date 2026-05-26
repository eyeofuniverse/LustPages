"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

export function FieldInfo({ text }: { text: string }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const visible = hovered || pinned;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pinned) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setPinned(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pinned]);

  return (
    <div ref={ref} className="relative inline-flex shrink-0 items-center" style={{ lineHeight: 0 }}>
      <button
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => { setPinned((p) => !p); setHovered(false); }}
        aria-label="Show field info"
        className="opacity-40 hover:opacity-80 transition-opacity"
        style={{ lineHeight: 0, color: "var(--muted-foreground)" }}
      >
        <Info size={13} />
      </button>
      {visible && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 w-56 px-3 py-2.5 rounded-xl text-xs leading-relaxed pointer-events-none"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--muted-foreground)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: "normal",
            whiteSpace: "normal",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
