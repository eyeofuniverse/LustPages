"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, Loader2, BookOpen, Hash, PenLine } from "lucide-react";

interface Props {
  initialQuery: string;
  autoFocus?: boolean;
}

interface StorySuggestion {
  id: string;
  title: string;
  slug: string;
  author: { name: string; slug: string };
  categories: { name: string; color: string }[];
}

interface TagSuggestion {
  id: string;
  name: string;
  slug: string;
}

interface AuthorSuggestion {
  id: string;
  name: string;
  slug: string;
  _count: { stories: number };
}

interface Suggestions {
  stories: StorySuggestion[];
  tags: TagSuggestion[];
  authors: AuthorSuggestion[];
}

export function SearchInput({ initialQuery, autoFocus }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const fetchSuggestions = useCallback(async (q: string) => {
    setIsFetchingSuggestions(true);
    try {
      const enc = encodeURIComponent(q);
      const settled = await Promise.allSettled([
        fetch(`/api/stories/search?q=${enc}`).then((r) => r.json()),
        fetch(`/api/tags/search?q=${enc}`).then((r) => r.json()),
        fetch(`/api/authors/search?q=${enc}`).then((r) => r.json()),
      ]);
      setSuggestions({
        stories: settled[0].status === "fulfilled" ? (settled[0].value as StorySuggestion[]).slice(0, 4) : [],
        tags:    settled[1].status === "fulfilled" ? (settled[1].value as TagSuggestion[]).slice(0, 5) : [],
        authors: settled[2].status === "fulfilled" ? (settled[2].value as AuthorSuggestion[]).slice(0, 3) : [],
      });
    } catch {
      setSuggestions(null);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (trimmed.length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(trimmed), 300);
    } else {
      setSuggestions(null);
    }
  }

  function handleFocus() {
    setShowDropdown(true);
    const trimmed = query.trim();
    if (trimmed.length >= 2 && !suggestions && !isFetchingSuggestions) {
      fetchSuggestions(trimmed);
    }
  }

  function handleBlur() {
    // Delay to allow dropdown mousedown/click to fire first
    setTimeout(() => setShowDropdown(false), 150);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  }

  function closeAndNavigate(url: string) {
    setShowDropdown(false);
    setSuggestions(null);
    router.push(url);
  }

  function submit(q: string) {
    const trimmed = q.trim();
    setShowDropdown(false);
    setSuggestions(null);
    if (trimmed.length >= 2) {
      fetch("/api/track/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, results: 0 }),
      }).catch(() => {});
    }
    startTransition(() => {
      if (!trimmed) router.push("/search");
      else router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(query);
  }

  function clear() {
    setQuery("");
    setSuggestions(null);
    setShowDropdown(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    inputRef.current?.focus();
    startTransition(() => router.push("/search"));
  }

  const hasSuggestions =
    suggestions !== null &&
    (suggestions.stories.length > 0 || suggestions.tags.length > 0 || suggestions.authors.length > 0);

  const dropdownVisible = showDropdown && (hasSuggestions || isFetchingSuggestions);

  return (
    <div className="relative group">
      <form id="search-form" onSubmit={handleSubmit} role="search">
        {isPending ? (
          <Loader2
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 animate-spin"
            style={{ color: "#c4426a" }}
          />
        ) : (
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: query ? "#c4426a" : "var(--muted-foreground)" }}
          />
        )}

        <input
          ref={inputRef}
          type="text"
          name="q"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={(e) => {
            handleFocus();
            e.currentTarget.style.borderColor = "rgba(196,66,106,0.5)";
          }}
          onBlur={(e) => {
            handleBlur();
            e.currentTarget.style.borderColor = "var(--border)";
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search stories, series, authors, tags…"
          autoFocus={autoFocus}
          autoComplete="off"
          className="w-full pl-12 pr-28 py-4 rounded-2xl text-base outline-none transition-all"
          style={{
            background: "var(--card)",
            border: "2px solid var(--border)",
            color: "var(--foreground)",
            borderRadius: dropdownVisible ? "1rem 1rem 0 0" : undefined,
          }}
          aria-label="Search stories"
          aria-expanded={dropdownVisible}
          aria-autocomplete="list"
          aria-controls={dropdownVisible ? "search-suggestions" : undefined}
        />

        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-[100px] top-1/2 -translate-y-1/2 p-1 rounded-full transition-opacity hover:opacity-75"
            style={{ color: "var(--muted-foreground)" }}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}

        <button
          type="submit"
          disabled={!query.trim() || isPending}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: "#c4426a" }}
        >
          Search
        </button>
      </form>

      {/* Autocomplete dropdown */}
      {dropdownVisible && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 z-50 overflow-hidden shadow-xl"
          style={{
            top: "calc(100% - 2px)",
            background: "var(--card)",
            border: "2px solid rgba(196,66,106,0.5)",
            borderTop: "1px solid var(--border)",
            borderRadius: "0 0 1rem 1rem",
          }}
        >
          {isFetchingSuggestions && !hasSuggestions && (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={18} className="animate-spin" style={{ color: "#c4426a" }} />
            </div>
          )}

          {hasSuggestions && (
            <>
              {/* Stories */}
              {suggestions!.stories.length > 0 && (
                <div>
                  <p
                    className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Stories
                  </p>
                  {suggestions!.stories.map((story) => (
                    <button
                      key={story.id}
                      type="button"
                      role="option"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:opacity-80"
                      style={{ background: "transparent" }}
                      onMouseDown={(e) => e.preventDefault()}
                      onTouchStart={(e) => e.preventDefault()}
                      onClick={() => closeAndNavigate(`/stories/${story.slug}`)}
                    >
                      <BookOpen size={13} className="shrink-0" style={{ color: "#c4426a" }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                          {story.title}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                          by {story.author.name}
                          {story.categories[0] && (
                            <span
                              className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                              style={{
                                background: story.categories[0].color + "22",
                                color: story.categories[0].color,
                              }}
                            >
                              {story.categories[0].name}
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Tags */}
              {suggestions!.tags.length > 0 && (
                <div
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p
                    className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2 px-4 pb-3">
                    {suggestions!.tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        role="option"
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-opacity hover:opacity-75"
                        style={{
                          background: "rgba(196,66,106,0.1)",
                          color: "#c4426a",
                          border: "1px solid rgba(196,66,106,0.2)",
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        onTouchStart={(e) => e.preventDefault()}
                        onClick={() => closeAndNavigate(`/tags/${encodeURIComponent(tag.name)}`)}
                      >
                        <Hash size={10} />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Authors */}
              {suggestions!.authors.length > 0 && (
                <div
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p
                    className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Authors
                  </p>
                  {suggestions!.authors.map((author) => (
                    <button
                      key={author.id}
                      type="button"
                      role="option"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:opacity-80"
                      style={{ background: "transparent" }}
                      onMouseDown={(e) => e.preventDefault()}
                      onTouchStart={(e) => e.preventDefault()}
                      onClick={() => closeAndNavigate(`/authors/${author.slug}`)}
                    >
                      <PenLine size={13} className="shrink-0" style={{ color: "#c4426a" }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {author.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {author._count.stories}{" "}
                          {author._count.stories === 1 ? "story" : "stories"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* View all results */}
              <div
                className="border-t px-4 py-3"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  type="button"
                  className="text-sm font-semibold transition-opacity hover:opacity-75"
                  style={{ color: "#c4426a" }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => submit(query)}
                >
                  See all results for &ldquo;{query.trim()}&rdquo; →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
