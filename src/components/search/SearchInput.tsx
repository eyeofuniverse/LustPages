"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

interface Props {
  initialQuery: string;
  autoFocus?: boolean;
}

export function SearchInput({ initialQuery, autoFocus }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function submit(q: string) {
    const trimmed = q.trim();
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
    inputRef.current?.focus();
    startTransition(() => router.push("/search"));
  }

  return (
    <form onSubmit={handleSubmit} className="relative group" role="search">
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
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search stories, series, authors, tags…"
        autoFocus={autoFocus}
        autoComplete="off"
        className="w-full pl-12 pr-28 py-4 rounded-2xl text-base outline-none transition-all"
        style={{
          background: "var(--card)",
          border: "2px solid var(--border)",
          color: "var(--foreground)",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = "rgba(196,66,106,0.5)")
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = "var(--border)")
        }
        aria-label="Search stories"
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
  );
}
