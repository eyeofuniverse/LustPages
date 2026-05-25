"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Hash, TrendingUp, ArrowUpDown } from "lucide-react";

interface Tag {
  tag: string;   // slug
  count: number;
  name: string;  // display name
  tier: number;
  id: string;
}

interface Props {
  tags: Tag[];
}

type SortMode = "alpha" | "popular";

const TIER_COLORS: Record<number, string> = {
  1: "#6366f1",
  2: "#c4426a",
  3: "#f59e0b",
};

const TIER_LABELS: Record<number, string> = {
  1: "Subgenre",
  2: "Trope",
  3: "Content",
};

export function TagsBrowser({ tags }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("alpha");
  const [tierFilter, setTierFilter] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = tags.filter((t) => {
      const matchSearch = !q || t.name.toLowerCase().includes(q) || t.tag.includes(q);
      const matchTier = tierFilter === null || t.tier === tierFilter;
      return matchSearch && matchTier;
    });
    return sort === "popular"
      ? [...base].sort((a, b) => b.count - a.count)
      : [...base].sort((a, b) => a.name.localeCompare(b.name));
  }, [tags, query, sort, tierFilter]);

  // Group alphabetically only when not searching and sorted alpha
  const grouped = useMemo(() => {
    if (query.trim() || sort === "popular" || tierFilter !== null) return null;
    const map = new Map<string, Tag[]>();
    for (const t of filtered) {
      const letter = /^[a-z]/i.test(t.name) ? t.name[0].toUpperCase() : "#";
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, query, sort, tierFilter]);

  const letters = grouped ? grouped.map(([l]) => l) : [];

  function tagSize(count: number) {
    if (count >= 10) return "text-base font-bold";
    if (count >= 5) return "text-sm font-semibold";
    return "text-xs font-medium";
  }

  function tagOpacity(count: number) {
    if (count >= 10) return 1;
    if (count >= 5) return 0.85;
    if (count >= 3) return 0.7;
    return 0.55;
  }

  return (
    <div>
      {/* Search + sort + tier controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tags…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              outline: "none",
            }}
          />
        </div>

        {/* Tier filter */}
        <div
          className="flex rounded-xl overflow-hidden shrink-0"
          style={{ border: "1px solid var(--border)", background: "var(--card)" }}
        >
          {([null, 1, 2, 3] as const).map((t) => (
            <button
              key={String(t)}
              onClick={() => setTierFilter(t)}
              className="px-3 py-2.5 text-xs font-semibold transition-all"
              style={{
                background: tierFilter === t ? "#c4426a" : "transparent",
                color: tierFilter === t ? "white" : "var(--muted-foreground)",
              }}
            >
              {t === null ? "All" : TIER_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div
          className="flex rounded-xl overflow-hidden shrink-0"
          style={{ border: "1px solid var(--border)", background: "var(--card)" }}
        >
          {(["alpha", "popular"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSort(mode)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold transition-all"
              style={{
                background: sort === mode ? "#c4426a" : "transparent",
                color: sort === mode ? "white" : "var(--muted-foreground)",
              }}
            >
              {mode === "alpha" ? <ArrowUpDown size={12} /> : <TrendingUp size={12} />}
              {mode === "alpha" ? "A–Z" : "Popular"}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(query.trim() || tierFilter !== null) && (
        <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
          {filtered.length} {filtered.length === 1 ? "tag" : "tags"}
          {query.trim() && <> matching &ldquo;{query.trim()}&rdquo;</>}
          {tierFilter !== null && <> in {TIER_LABELS[tierFilter]}</>}
        </p>
      )}

      {filtered.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Hash size={32} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
          <p className="font-medium" style={{ color: "var(--foreground)" }}>No tags found</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Try a different search term.
          </p>
        </div>
      ) : grouped ? (
        <div>
          {/* Letter index */}
          <div className="flex flex-wrap gap-1.5 mb-8">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:opacity-80"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
              >
                {letter}
              </a>
            ))}
          </div>

          {grouped.map(([letter, letterTags]) => (
            <div key={letter} id={`letter-${letter}`} className="mb-10 scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--font-playfair), serif", color: "#c4426a" }}
                >
                  {letter}
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {letterTags.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {letterTags.map(({ tag, count, name, tier }) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:scale-105 ${tagSize(count)}`}
                    style={{
                      background: "var(--card)",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                      opacity: tagOpacity(count),
                    }}
                  >
                    <Hash size={11} style={{ color: TIER_COLORS[tier] ?? "#c4426a", flexShrink: 0 }} />
                    {name}
                    <span className="text-xs ml-0.5 font-normal" style={{ color: "var(--muted-foreground)" }}>
                      {count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filtered.map(({ tag, count, name, tier }, i) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:scale-105 ${
                sort === "popular" && i < 3 ? "text-sm font-bold" : "text-xs font-medium"
              }`}
              style={{
                background: sort === "popular" && i === 0 ? "rgba(196,66,106,0.12)" : "var(--card)",
                color: sort === "popular" && i === 0 ? "#c4426a" : "var(--foreground)",
                border: sort === "popular" && i === 0
                  ? "1px solid rgba(196,66,106,0.3)"
                  : "1px solid var(--border)",
              }}
            >
              <Hash size={11} style={{ color: TIER_COLORS[tier] ?? "#c4426a", flexShrink: 0 }} />
              {name}
              <span className="text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>
                {count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
