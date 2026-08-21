"use client";

import { useEffect, useState } from "react";
import { ALargeSmall } from "lucide-react";

const SIZES = [
  { label: "A", px: 16 },
  { label: "A", px: 18 },
  { label: "A", px: 21 },
] as const;

const STORAGE_KEY = "lp:font-size";
const DEFAULT_PX = 18;

export function FontSizeControl() {
  const [px, setPx] = useState(DEFAULT_PX);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const n = parseInt(saved, 10);
        if (SIZES.some((s) => s.px === n)) {
          setPx(n);
          applySize(n);
        }
      }
    } catch {}
  }, []);

  function applySize(size: number) {
    const el = document.getElementById("story-body");
    if (el) (el as HTMLElement).style.fontSize = `${size}px`;
    // propagate to prose containers
    const prose = el?.querySelectorAll(".prose-story");
    prose?.forEach((p) => ((p as HTMLElement).style.fontSize = `${size}px`));
  }

  function select(size: number) {
    setPx(size);
    applySize(size);
    try { localStorage.setItem(STORAGE_KEY, String(size)); } catch {}
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Adjust font size"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-75"
        style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
      >
        <ALargeSmall size={14} />
        <span>Aa</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 flex items-center gap-1 p-1.5 rounded-xl shadow-lg"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {SIZES.map((s, i) => (
            <button
              key={s.px}
              onClick={() => select(s.px)}
              aria-label={`Font size ${s.px}px`}
              className="flex items-center justify-center rounded-lg transition-all"
              style={{
                width: 32 + i * 4,
                height: 32,
                fontSize: 12 + i * 2,
                fontWeight: 600,
                background: px === s.px ? "#c4426a" : "transparent",
                color: px === s.px ? "white" : "var(--muted-foreground)",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
