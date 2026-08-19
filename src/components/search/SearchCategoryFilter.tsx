"use client";

import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface Props {
  categories: Category[];
  currentCat: string;
  query: string;
  sortParam: string;
  lengthFilter: string;
  rawRating: string;
}

export function SearchCategoryFilter({
  categories,
  currentCat,
  query,
  sortParam,
  lengthFilter,
  rawRating,
}: Props) {
  const router = useRouter();

  function buildUrl(cat: string) {
    const p = new URLSearchParams({ q: query });
    if (sortParam) p.set("sort", sortParam);
    if (cat) p.set("cat", cat);
    if (lengthFilter) p.set("length", lengthFilter);
    if (rawRating) p.set("rating", rawRating);
    return `/search?${p.toString()}`;
  }

  return (
    <select
      value={currentCat}
      onChange={(e) => router.push(buildUrl(e.target.value))}
      className="text-xs px-3 py-1.5 rounded-full font-medium outline-none cursor-pointer transition-all"
      style={{
        background: currentCat ? "rgba(196,66,106,0.12)" : "var(--muted)",
        color: currentCat ? "#c4426a" : "var(--muted-foreground)",
        border: currentCat ? "1px solid rgba(196,66,106,0.3)" : "1px solid transparent",
      }}
    >
      <option value="">All Categories</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.slug}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}
