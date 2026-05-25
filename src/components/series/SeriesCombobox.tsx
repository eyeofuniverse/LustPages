"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, Plus, Search, X } from "lucide-react";

interface SeriesResult {
  id: string;
  name: string;
  slug: string;
  storyCount: number;
  nextChapter: number;
}

interface SeriesComboboxProps {
  selectedSeries: { id: string; name: string } | null;
  chapterNumber: string;
  authorId: string;
  onSeriesChange: (series: { id: string; name: string } | null) => void;
  onChapterChange: (chapter: string) => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
}

export function SeriesCombobox({
  selectedSeries,
  chapterNumber,
  authorId,
  onSeriesChange,
  onChapterChange,
  inputStyle,
  labelStyle,
}: SeriesComboboxProps) {
  const [query, setQuery] = useState(selectedSeries?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SeriesResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prevAuthorId = useRef(authorId);

  // Sync display name when selectedSeries changes externally
  useEffect(() => {
    setQuery(selectedSeries?.name ?? "");
  }, [selectedSeries]);

  // Clear selection when author changes (admin form author switch)
  useEffect(() => {
    if (prevAuthorId.current !== authorId) {
      prevAuthorId.current = authorId;
      setQuery("");
      setResults([]);
      onSeriesChange(null);
      onChapterChange("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorId]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Revert input to selected series name if user typed but didn't pick
        setQuery(selectedSeries?.name ?? "");
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [selectedSeries]);

  const search = useCallback(
    async (q: string) => {
      if (!authorId) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/series/search?q=${encodeURIComponent(q)}&authorId=${encodeURIComponent(authorId)}`
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [authorId]
  );

  function handleInputChange(v: string) {
    setQuery(v);
    setIsOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300);
  }

  function handleFocus() {
    setIsOpen(true);
    search(query);
  }

  function handleSelect(result: SeriesResult) {
    onSeriesChange({ id: result.id, name: result.name });
    onChapterChange(String(result.nextChapter));
    setQuery(result.name);
    setIsOpen(false);
  }

  async function handleCreate() {
    const trimmed = query.trim();
    if (!trimmed || !authorId || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, authorId }),
      });
      if (!res.ok) return;
      const created: SeriesResult = await res.json();
      onSeriesChange({ id: created.id, name: created.name });
      onChapterChange("1");
      setQuery(created.name);
      setIsOpen(false);
    } finally {
      setCreating(false);
    }
  }

  function handleClear() {
    setQuery("");
    onSeriesChange(null);
    onChapterChange("");
    setIsOpen(false);
    setResults([]);
  }

  const exactMatch = results.some(
    (r) => r.name.toLowerCase() === query.trim().toLowerCase()
  );
  const showCreate = query.trim().length > 0 && !exactMatch;

  return (
    <div className="space-y-3">
      {/* Series search input */}
      <div>
        <label style={labelStyle}>Series</label>
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--muted-foreground)" }}
            />
            <input
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleFocus}
              placeholder={authorId ? "Search or create a series…" : "Select an author first"}
              disabled={!authorId}
              autoComplete="off"
              className="w-full rounded-xl text-sm"
              style={{
                ...inputStyle,
                paddingLeft: "2rem",
                paddingRight: selectedSeries || query ? "2rem" : "0.75rem",
                paddingTop: "0.625rem",
                paddingBottom: "0.625rem",
                opacity: authorId ? 1 : 0.5,
              }}
            />
            {(selectedSeries || query) && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-75"
                style={{ color: "var(--muted-foreground)" }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {isOpen && authorId && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl z-50 overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              {loading ? (
                <div className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Searching…
                </div>
              ) : (
                <>
                  {results.length === 0 && !showCreate && (
                    <div className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {query ? "No matching series found" : "No series yet — type a name to create one"}
                    </div>
                  )}

                  {results.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:opacity-75"
                      style={{
                        borderBottom: i < results.length - 1 || showCreate ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen size={13} style={{ color: "#c4426a" }} />
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {r.name}
                        </span>
                      </div>
                      <span className="text-xs shrink-0 ml-4" style={{ color: "var(--muted-foreground)" }}>
                        {r.storyCount} part{r.storyCount !== 1 ? "s" : ""} · next #{r.nextChapter}
                      </span>
                    </button>
                  ))}

                  {showCreate && (
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={creating}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-opacity hover:opacity-75 disabled:opacity-50"
                    >
                      <Plus size={13} style={{ color: "#22c55e" }} />
                      <span className="text-sm" style={{ color: "var(--foreground)" }}>
                        {creating ? "Creating…" : `Create new series "${query.trim()}"`}
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {selectedSeries && (
          <p className="text-xs mt-1.5" style={{ color: "#22c55e" }}>
            Linked to <span className="font-semibold">{selectedSeries.name}</span>
          </p>
        )}
      </div>

      {/* Part number — only shown when a series is selected */}
      {selectedSeries && (
        <div>
          <label style={labelStyle}>Part Number</label>
          <input
            type="number"
            min={1}
            value={chapterNumber}
            onChange={(e) => onChapterChange(e.target.value)}
            placeholder="Auto-assigned"
            className="w-full rounded-xl text-sm"
            style={{ ...inputStyle, padding: "0.625rem 1rem" }}
          />
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            Auto-filled based on existing parts. Adjust if needed.
          </p>
        </div>
      )}
    </div>
  );
}
