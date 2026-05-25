"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Hash } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface FilterBarProps {
  categories: Category[];
  activeCategory?: string;
  activeTag?: string;
  popularTags?: { tag: string; count: number }[];
}

export function FilterBar({
  categories,
  activeCategory,
  activeTag,
  popularTags = [],
}: FilterBarProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function go(path: string) {
    startTransition(() => router.push(path));
  }

  return (
    <div className="space-y-3">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => go("/stories")}
          className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all shrink-0"
          style={{
            background: !activeCategory && !activeTag ? "#c4426a" : "var(--muted)",
            color: !activeCategory && !activeTag ? "white" : "var(--muted-foreground)",
          }}
        >
          All
        </button>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => go(isActive ? "/stories" : `/categories/${cat.slug}`)}
              className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all shrink-0"
              style={{
                background: isActive ? cat.color : "var(--muted)",
                color: isActive ? "white" : "var(--muted-foreground)",
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Popular tags */}
      {popularTags.length > 0 && (
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          <span
            className="flex items-center gap-1 text-xs font-semibold shrink-0"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Hash size={12} />
            Popular:
          </span>
          {popularTags.map(({ tag }) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => go(isActive ? "/stories" : `/tags/${encodeURIComponent(tag)}`)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 hover:opacity-80"
                style={
                  isActive
                    ? {
                        background: "rgba(196,66,106,0.15)",
                        color: "#c4426a",
                        border: "1px solid rgba(196,66,106,0.4)",
                      }
                    : { background: "var(--muted)", color: "var(--muted-foreground)" }
                }
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
