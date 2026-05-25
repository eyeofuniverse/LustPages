"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { Search, BookOpen, Eye, Heart, X, Users } from "lucide-react";
import { AuthorBadge, isFeaturedAuthor } from "@/components/author/AuthorBadge";

type Author = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  image: string | null;
  _count: { stories: number };
  totalViews: number;
  totalLikes: number;
};

type SortKey = "stories" | "name" | "views";

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function AuthorsClient({ authors }: { authors: Author[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("stories");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? authors.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.bio?.toLowerCase().includes(q)
        )
      : authors;

    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "views") return b.totalViews - a.totalViews;
      return b._count.stories - a._count.stories;
    });
  }, [authors, query, sort]);

  const SORTS: { key: SortKey; label: string }[] = [
    { key: "stories", label: "Most Stories" },
    { key: "views", label: "Most Popular" },
    { key: "name", label: "A–Z" },
  ];

  return (
    <>
      {/* Search + sort toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search authors by name or bio…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              outline: "none",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted-foreground)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort pills */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl shrink-0"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {SORTS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                sort === key
                  ? { background: "#c4426a", color: "white" }
                  : { color: "var(--muted-foreground)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {query && (
        <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
          {filtered.length === 0
            ? `No authors found for "${query}"`
            : `${filtered.length} author${filtered.length === 1 ? "" : "s"} found`}
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Users
            size={36}
            className="mx-auto mb-3 opacity-30"
            style={{ color: "var(--muted-foreground)" }}
          />
          <p
            className="text-lg font-medium mb-1"
            style={{
              fontFamily: "var(--font-playfair), serif",
              color: "var(--foreground)",
            }}
          >
            No authors found
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
            Try a different search term
          </p>
          <button
            onClick={() => setQuery("")}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#c4426a" }}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((author) => (
            <AuthorCard key={author.id} author={author} />
          ))}
        </div>
      )}
    </>
  );
}

function AuthorCard({ author }: { author: Author }) {
  const featured = isFeaturedAuthor(author._count.stories, author.totalLikes);

  return (
    <Link
      href={`/authors/${author.slug}`}
      className="group flex flex-col p-6 rounded-2xl transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        background: "var(--card)",
        border: featured ? "1px solid rgba(245,158,11,0.4)" : "1px solid var(--border)",
      }}
    >
      {/* Avatar + name row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative shrink-0">
          {author.image ? (
            <div
              className="w-14 h-14 rounded-full overflow-hidden relative"
              style={featured ? { boxShadow: "0 0 0 2px #f59e0b55" } : undefined}
            >
              <SafeImage
                src={author.image}
                alt={author.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-transform duration-300 group-hover:scale-105"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(196,66,106,0.35), rgba(196,66,106,0.12))",
                color: "#c4426a",
                fontFamily: "var(--font-playfair), serif",
                border: featured ? "2px solid rgba(245,158,11,0.6)" : "2px solid rgba(196,66,106,0.25)",
              }}
            >
              {author.name[0].toUpperCase()}
            </div>
          )}
          {/* Story count badge */}
          {author._count.stories > 0 && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: "#c4426a", border: "2px solid var(--card)" }}
            >
              {author._count.stories > 9 ? "9+" : author._count.stories}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2
            className="font-bold text-base leading-tight mb-0.5 group-hover:opacity-75 transition-opacity truncate"
            style={{
              color: "var(--foreground)",
              fontFamily: "var(--font-playfair), serif",
            }}
          >
            {author.name}
          </h2>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {author._count.stories}{" "}
              {author._count.stories === 1 ? "story" : "stories"} published
            </p>
            <AuthorBadge storyCount={author._count.stories} totalLikes={author.totalLikes} />
          </div>
        </div>
      </div>

      {/* Bio */}
      {author.bio ? (
        <p
          className="text-sm leading-relaxed line-clamp-2 flex-1 mb-4"
          style={{ color: "var(--muted-foreground)" }}
        >
          {author.bio}
        </p>
      ) : (
        <div className="flex-1 mb-4" />
      )}

      {/* Stats row */}
      <div
        className="flex items-center gap-4 pt-4 text-xs"
        style={{
          borderTop: "1px solid var(--border)",
          color: "var(--muted-foreground)",
        }}
      >
        <span className="flex items-center gap-1.5">
          <BookOpen size={12} style={{ color: "#c4426a" }} />
          {author._count.stories} stories
        </span>
        <span className="flex items-center gap-1.5">
          <Eye size={12} />
          {fmt(author.totalViews)} views
        </span>
        <span className="flex items-center gap-1.5">
          <Heart size={12} />
          {fmt(author.totalLikes)} likes
        </span>
      </div>
    </Link>
  );
}
