"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, BookOpen } from "lucide-react";
import Link from "next/link";

interface Suggestion {
  id: string;
  title: string;
  slug: string;
  author: { name: string; slug: string };
  categories: { name: string; color: string }[];
}

export function StoriesSearchBar({ initialSearch }: { initialSearch?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialSearch ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/stories/search?q=${encodeURIComponent(q)}`);
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setValue(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(q), 300);
  }

  // Always navigate to /stories?search=… regardless of current pathname
  function navigate(search: string) {
    if (search.trim()) {
      router.push(`/stories?search=${encodeURIComponent(search.trim())}`);
    } else {
      router.push("/stories");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    navigate(value);
  }

  function handleClear() {
    setValue("");
    setSuggestions([]);
    setOpen(false);
    router.push("/stories");
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--muted-foreground)" }}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search stories, authors, tags…"
          className="w-full pl-11 pr-28 py-3.5 rounded-2xl text-sm transition-all"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            outline: "none",
            fontSize: "15px",
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = "#c4426a55";
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 top-1/2 -translate-y-1/2 p-1 rounded-full hover:opacity-75 transition-opacity"
            style={{ color: "var(--muted-foreground)" }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-85"
          style={{ background: "#c4426a", color: "white" }}
        >
          {loading ? "…" : "Search"}
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 rounded-2xl shadow-2xl overflow-hidden z-50"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {suggestions.map((s) => {
            const color = s.categories[0]?.color ?? "#c4426a";
            return (
              <Link
                key={s.id}
                href={`/stories/${s.slug}`}
                className="flex items-center gap-3 px-4 py-3 hover:opacity-75 transition-opacity"
                style={{ borderBottom: "1px solid var(--border)" }}
                onClick={() => setOpen(false)}
              >
                <BookOpen size={14} className="shrink-0" style={{ color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1" style={{ color: "var(--foreground)" }}>
                    {s.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    by {s.author.name}
                    {s.categories.length > 0 && (
                      <>
                        {" "}
                        · <span style={{ color }}>{s.categories[0].name}</span>
                      </>
                    )}
                  </p>
                </div>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(value);
            }}
            className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 hover:opacity-75 transition-opacity"
            style={{ color: "#c4426a" }}
          >
            <Search size={14} />
            Search all stories for &ldquo;{value}&rdquo; →
          </button>
        </div>
      )}
    </div>
  );
}
