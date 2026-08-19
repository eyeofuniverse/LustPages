import {
  getPublishedStories,
  getStoryCount,
  getTrendingStories,
  getTrendingSearches,
  getRelatedTags,
  searchSeries,
} from "@/lib/queries";
import { getCachedCategories, getCachedPopularTags } from "@/lib/cached-queries";
import { prisma } from "@/lib/prisma";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchCategoryFilter } from "@/components/search/SearchCategoryFilter";
import { StoryListItem } from "@/components/story/StoryListItem";
import { AdSlot } from "@/components/ads/AdSlot";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  BookOpen,
  Layers,
  TrendingUp,
  Hash,
  Search,
  Flame,
  Star,
} from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 180;

type SortOption = "latest" | "most-read" | "top-rated";
type LengthOption = "short" | "medium" | "long";

interface Props {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    cat?: string;
    length?: string;
    rating?: string;
  }>;
}

const BASE = "https://lustpages.com";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return {
      title: "Search Stories & Series — LustPages",
      description:
        "Search thousands of adult fiction stories and series on LustPages. Find by title, author, tag, or genre.",
      alternates: { canonical: `${BASE}/search` },
      openGraph: {
        title: "Search Stories & Series — LustPages",
        description: "Search thousands of adult fiction stories and series on LustPages.",
        url: `${BASE}/search`,
        type: "website",
        siteName: "LustPages",
      },
      twitter: {
        card: "summary_large_image",
        title: "Search Stories & Series — LustPages",
        description: "Search thousands of adult fiction stories and series on LustPages.",
      },
    };
  }

  const canonical = `${BASE}/search?q=${encodeURIComponent(query)}`;
  const title = `${query} Erotica Stories — LustPages`;
  const description = `Browse adult fiction stories and series matching "${query}" on LustPages. Free to read, updated regularly.`;

  return {
    title,
    description,
    keywords: [query, `${query} erotica`, `${query} adult fiction`, `${query} stories`, "lustpages", "free erotica"],
    alternates: { canonical },
    openGraph: {
      title: `${query} Erotica — LustPages`,
      description,
      url: canonical,
      type: "website",
      siteName: "LustPages",
    },
    twitter: {
      card: "summary_large_image",
      title: `${query} Erotica — LustPages`,
      description,
    },
  };
}

// Build a search URL preserving all current filter params, with one override.
function buildFilterUrl(
  q: string,
  current: { sort: string; cat: string; length: string; rating: string },
  override: Partial<{ sort: string; cat: string; length: string; rating: string }>,
): string {
  const merged = { ...current, ...override };
  const p = new URLSearchParams({ q });
  if (merged.sort && merged.sort !== "latest") p.set("sort", merged.sort);
  if (merged.cat) p.set("cat", merged.cat);
  if (merged.length) p.set("length", merged.length);
  if (merged.rating) p.set("rating", merged.rating);
  return `/search?${p.toString()}`;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, sort: rawSort, cat: rawCat, length: rawLength, rating: rawRating } =
    await searchParams;

  const query = q?.trim() ?? "";
  const hasQuery = query.length > 0;
  const isValidSearch = query.length >= 2;

  // Parse and validate filter params
  const sortParam: SortOption | undefined =
    rawSort === "most-read" ? "most-read" :
    rawSort === "top-rated" ? "top-rated" :
    undefined;
  const catFilter = rawCat?.trim() ?? "";
  const lengthFilter: LengthOption | "" =
    rawLength === "short" ? "short" :
    rawLength === "medium" ? "medium" :
    rawLength === "long" ? "long" :
    "";
  const rawRatingStr = rawRating ?? "";
  const ratingNum = parseInt(rawRating ?? "");
  const minRating = ratingNum >= 3 && ratingNum <= 5 ? ratingNum : undefined;

  // Length → readingTime bounds (minutes)
  const minLength =
    lengthFilter === "medium" ? 10 :
    lengthFilter === "long"   ? 30 :
    undefined;
  const maxLength =
    lengthFilter === "short"  ? 10 :
    lengthFilter === "medium" ? 30 :
    undefined;

  const currentFilters = {
    sort: sortParam ?? "",
    cat: catFilter,
    length: lengthFilter,
    rating: rawRatingStr,
  };

  const [
    stories,
    seriesResults,
    storyCount,
    categories,
    relatedTags,
    popularTags,
    trending,
    trendingSearches,
  ] = await Promise.all([
    isValidSearch
      ? getPublishedStories({
          search: query,
          take: 20,
          sort: sortParam,
          ...(catFilter && { categorySlug: catFilter }),
          ...(minLength !== undefined && { minLength }),
          ...(maxLength !== undefined && { maxLength }),
          ...(minRating !== undefined && { minRating }),
        })
      : Promise.resolve([]),
    isValidSearch ? searchSeries(query, 9) : Promise.resolve([]),
    isValidSearch
      ? getStoryCount({
          published: true,
          search: query,
          ...(catFilter && { categorySlug: catFilter }),
          ...(minLength !== undefined && { minLength }),
          ...(maxLength !== undefined && { maxLength }),
          ...(minRating !== undefined && { minRating }),
        })
      : Promise.resolve(0),
    getCachedCategories(),
    isValidSearch ? getRelatedTags(query) : Promise.resolve([]),
    !hasQuery ? getCachedPopularTags(30) : Promise.resolve([]),
    !hasQuery ? getTrendingStories(6) : Promise.resolve([]),
    !hasQuery ? getTrendingSearches(10) : Promise.resolve([]),
  ]);

  const totalResults = storyCount + seriesResults.length;

  if (isValidSearch) {
    prisma.searchQuery
      .create({ data: { query: query.toLowerCase(), results: totalResults } })
      .catch(() => {});
  }

  const activeFiltersCount = [sortParam, catFilter, lengthFilter, minRating].filter(Boolean).length;

  const searchActionLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LustPages",
    url: BASE,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BASE}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Search", item: `${BASE}/search` },
      ...(hasQuery
        ? [{ "@type": "ListItem", position: 3, name: query, item: `${BASE}/search?q=${encodeURIComponent(query)}` }]
        : []),
    ],
  };

  const itemListLd =
    hasQuery && stories.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Search results for "${query}"`,
          numberOfItems: totalResults,
          itemListElement: stories.slice(0, 10).map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.title,
            url: `${BASE}/stories/${s.slug}`,
          })),
        }
      : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {itemListLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      )}

      <div className="min-h-screen">
        {/* ── Hero ── */}
        <div
          className="py-12 sm:py-16"
          style={{
            background: "linear-gradient(180deg, rgba(196,66,106,0.06) 0%, transparent 100%)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {!hasQuery && (
              <div className="text-center mb-8">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                  style={{ background: "rgba(196,66,106,0.12)" }}
                >
                  <Search size={26} style={{ color: "#c4426a" }} />
                </div>
                <h1
                  className="text-3xl sm:text-4xl font-bold mb-2"
                  style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                >
                  Find Your Next Story
                </h1>
                <p className="text-base" style={{ color: "var(--muted-foreground)" }}>
                  Search through thousands of adult fiction stories and series
                </p>
              </div>
            )}

            {hasQuery && (
              <div className="mb-6">
                <h1
                  className="text-2xl sm:text-3xl font-bold mb-1"
                  style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                >
                  Search Results
                </h1>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {isValidSearch
                    ? totalResults > 0
                      ? `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${query}"`
                      : `No results found for "${query}"`
                    : `Enter at least 2 characters to search`}
                </p>
              </div>
            )}

            <SearchInput initialQuery={query} autoFocus={!hasQuery} />

            {/* Quick links — only when no query */}
            {!hasQuery && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Browse:</span>
                {[
                  { href: "/stories", label: "All Stories" },
                  { href: "/series", label: "All Series" },
                  { href: "/premium/stories", label: "Premium" },
                  { href: "/authors", label: "Authors" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-xs px-3 py-1 rounded-full font-medium transition-opacity hover:opacity-75"
                    style={{
                      background: "rgba(196,66,106,0.1)",
                      color: "#c4426a",
                      border: "1px solid rgba(196,66,106,0.2)",
                    }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Filter bar (only when searching) ── */}
        {isValidSearch && (
          <div
            className="border-b"
            style={{ background: "var(--background)", borderColor: "var(--border)" }}
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
              <div className="overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                  {/* Sort */}
                  <span className="text-xs font-medium shrink-0" style={{ color: "var(--muted-foreground)" }}>
                    Sort:
                  </span>
                  {(
                    [
                      { label: "Latest", value: "" },
                      { label: "Most Read", value: "most-read" },
                      { label: "Top Rated", value: "top-rated" },
                    ] as const
                  ).map((opt) => {
                    const isActive = (sortParam ?? "") === opt.value;
                    return (
                      <Link
                        key={opt.value || "latest"}
                        href={buildFilterUrl(query, currentFilters, { sort: opt.value })}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                        style={
                          isActive
                            ? { background: "#c4426a", color: "#fff" }
                            : { background: "var(--muted)", color: "var(--muted-foreground)" }
                        }
                      >
                        {opt.label}
                      </Link>
                    );
                  })}

                  <div className="w-px h-4 shrink-0" style={{ background: "var(--border)" }} />

                  {/* Length */}
                  <span className="text-xs font-medium shrink-0" style={{ color: "var(--muted-foreground)" }}>
                    Length:
                  </span>
                  {(
                    [
                      { label: "Any", value: "" },
                      { label: "Short", value: "short" },
                      { label: "Medium", value: "medium" },
                      { label: "Long", value: "long" },
                    ] as const
                  ).map((opt) => {
                    const isActive = lengthFilter === opt.value;
                    return (
                      <Link
                        key={opt.value || "any-length"}
                        href={buildFilterUrl(query, currentFilters, { length: opt.value })}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                        style={
                          isActive
                            ? { background: "#c4426a", color: "#fff" }
                            : { background: "var(--muted)", color: "var(--muted-foreground)" }
                        }
                      >
                        {opt.label}
                        {opt.value === "short" && (
                          <span className="ml-1 opacity-70">&lt;10m</span>
                        )}
                        {opt.value === "medium" && (
                          <span className="ml-1 opacity-70">10–30m</span>
                        )}
                        {opt.value === "long" && (
                          <span className="ml-1 opacity-70">30m+</span>
                        )}
                      </Link>
                    );
                  })}

                  <div className="w-px h-4 shrink-0" style={{ background: "var(--border)" }} />

                  {/* Rating */}
                  <span className="text-xs font-medium shrink-0" style={{ color: "var(--muted-foreground)" }}>
                    Rating:
                  </span>
                  {(
                    [
                      { label: "Any", value: "" },
                      { label: "3+", value: "3" },
                      { label: "4+", value: "4" },
                      { label: "5", value: "5" },
                    ] as const
                  ).map((opt) => {
                    const isActive = rawRatingStr === opt.value;
                    return (
                      <Link
                        key={opt.value || "any-rating"}
                        href={buildFilterUrl(query, currentFilters, { rating: opt.value })}
                        className="flex items-center gap-0.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                        style={
                          isActive
                            ? { background: "#c4426a", color: "#fff" }
                            : { background: "var(--muted)", color: "var(--muted-foreground)" }
                        }
                      >
                        {opt.label !== "Any" && <Star size={10} />}
                        {opt.label}
                      </Link>
                    );
                  })}

                  <div className="w-px h-4 shrink-0" style={{ background: "var(--border)" }} />

                  {/* Category */}
                  <span className="text-xs font-medium shrink-0" style={{ color: "var(--muted-foreground)" }}>
                    Genre:
                  </span>
                  <SearchCategoryFilter
                    categories={categories}
                    currentCat={catFilter}
                    query={query}
                    sortParam={sortParam ?? ""}
                    lengthFilter={lengthFilter}
                    rawRating={rawRatingStr}
                  />

                  {/* Clear all filters */}
                  {activeFiltersCount > 0 && (
                    <>
                      <div className="w-px h-4 shrink-0" style={{ background: "var(--border)" }} />
                      <Link
                        href={`/search?q=${encodeURIComponent(query)}`}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                        style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}
                      >
                        Clear filters ({activeFiltersCount})
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {hasQuery && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            {!isValidSearch ? (
              <div
                className="text-center py-16 rounded-2xl"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <Search size={32} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Enter at least 2 characters to search
                </p>
              </div>
            ) : totalResults === 0 ? (
              <NoResults query={query} relatedTags={relatedTags} />
            ) : (
              <div className="space-y-12">
                {/* Story results */}
                {stories.length > 0 && (
                  <section aria-labelledby="story-results-heading">
                    <div className="flex items-center gap-2.5 mb-5">
                      <BookOpen size={18} style={{ color: "#c4426a" }} />
                      <h2
                        id="story-results-heading"
                        className="text-lg font-bold"
                        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                      >
                        Stories
                      </h2>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}
                      >
                        {storyCount}
                      </span>
                    </div>
                    <div>
                      {stories.map((story) => (
                        <StoryListItem
                          key={story.id}
                          story={story as Parameters<typeof StoryListItem>[0]["story"]}
                        />
                      ))}
                    </div>
                    {storyCount > 20 && (
                      <div className="mt-6 text-center">
                        <Link
                          href={`/stories?search=${encodeURIComponent(query)}`}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                          style={{
                            background: "rgba(196,66,106,0.08)",
                            color: "#c4426a",
                            border: "1px solid rgba(196,66,106,0.2)",
                          }}
                        >
                          View all {storyCount} stories →
                        </Link>
                      </div>
                    )}
                  </section>
                )}

                {stories.length > 0 && seriesResults.length > 0 && (
                  <AdSlot identifier="search_results_banner" />
                )}

                {/* Series results */}
                {seriesResults.length > 0 && (
                  <section aria-labelledby="series-results-heading">
                    <div className="flex items-center gap-2.5 mb-5">
                      <Layers size={18} style={{ color: "#c4426a" }} />
                      <h2
                        id="series-results-heading"
                        className="text-lg font-bold"
                        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                      >
                        Series
                      </h2>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}
                      >
                        {seriesResults.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {seriesResults.map((series) => {
                        const cover = series.stories[0]?.coverImage ?? null;
                        const primaryCategory = series.stories[0]?.categories[0];
                        const placeholderBg = primaryCategory
                          ? `linear-gradient(160deg, ${primaryCategory.color}55 0%, ${primaryCategory.color}18 100%)`
                          : "linear-gradient(160deg, rgba(6,182,212,0.4) 0%, rgba(6,182,212,0.1) 100%)";

                        return (
                          <Link
                            key={series.id}
                            href={`/series/${series.slug}`}
                            className="group flex gap-3 p-3 rounded-2xl transition-all hover:opacity-80"
                            style={{ background: "var(--card)", border: "1px solid var(--border)", textDecoration: "none" }}
                          >
                            <div
                              className="shrink-0 w-16 rounded-xl overflow-hidden"
                              style={{ aspectRatio: "2/3", background: "var(--muted)" }}
                            >
                              {cover ? (
                                <SafeImage
                                  src={cover}
                                  alt={series.name}
                                  width={64}
                                  height={96}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center"
                                  style={{ background: placeholderBg }}
                                >
                                  <span
                                    className="text-xl font-bold"
                                    style={{
                                      fontFamily: "var(--font-playfair), serif",
                                      color: primaryCategory?.color ?? "rgb(6,182,212)",
                                      opacity: 0.75,
                                    }}
                                  >
                                    {series.name[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3
                                  className="text-sm font-bold line-clamp-2 leading-snug"
                                  style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                                >
                                  {series.name}
                                </h3>
                                <span
                                  className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[9px] font-extrabold"
                                  style={{ background: "rgba(6,182,212,0.15)", color: "rgb(6,182,212)" }}
                                >
                                  S
                                </span>
                              </div>
                              <p className="text-xs mb-1.5 truncate" style={{ color: "var(--muted-foreground)" }}>
                                by {series.author.name}
                              </p>
                              {series.description && (
                                <p className="text-xs line-clamp-2 mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                                  {series.description}
                                </p>
                              )}
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                style={{ background: "rgba(6,182,212,0.12)", color: "rgb(6,182,212)" }}
                              >
                                <BookOpen size={8} />
                                {series._count.stories}{" "}
                                {series._count.stories === 1 ? "part" : "parts"}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Discovery (no query) ── */}
        {!hasQuery && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
            {/* Trending Searches */}
            {trendingSearches.length > 0 && (
              <section aria-labelledby="trending-searches-heading">
                <div className="flex items-center gap-2 mb-4">
                  <Flame size={16} style={{ color: "#c4426a" }} />
                  <h2
                    id="trending-searches-heading"
                    className="text-base font-bold"
                    style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                  >
                    Trending Searches
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map(({ query: tq }) => (
                    <Link
                      key={tq}
                      href={`/search?q=${encodeURIComponent(tq)}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:opacity-80"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    >
                      <Search size={12} style={{ color: "#c4426a" }} />
                      {tq}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Popular Tags */}
            {popularTags.length > 0 && (
              <section aria-labelledby="popular-tags-heading">
                <div className="flex items-center gap-2 mb-4">
                  <Hash size={16} style={{ color: "#c4426a" }} />
                  <h2
                    id="popular-tags-heading"
                    className="text-base font-bold"
                    style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                  >
                    Popular Tags
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(({ tag, name, count }) => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:opacity-80"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    >
                      <span style={{ color: "var(--muted-foreground)" }}>#</span>
                      {name}
                      <span className="text-xs ml-0.5" style={{ color: "var(--muted-foreground)" }}>
                        {count}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Browse by Category */}
            {categories.length > 0 && (
              <section aria-labelledby="categories-heading">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={16} style={{ color: "#c4426a" }} />
                  <h2
                    id="categories-heading"
                    className="text-base font-bold"
                    style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                  >
                    Browse by Genre
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug}`}
                      className="group flex items-center gap-3 p-3.5 rounded-2xl transition-all hover:opacity-80"
                      style={{ background: cat.color + "12", border: `1px solid ${cat.color}30` }}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                          {cat.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {cat._count.stories} {cat._count.stories === 1 ? "story" : "stories"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Stories */}
            {trending.length > 0 && (
              <section aria-labelledby="trending-heading">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} style={{ color: "#c4426a" }} />
                    <h2
                      id="trending-heading"
                      className="text-base font-bold"
                      style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                    >
                      Trending Now
                    </h2>
                  </div>
                  <Link href="/stories" className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "#c4426a" }}>
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trending.map((story, i) => {
                    const primaryCategory = story.categories[0];
                    const primaryColor = primaryCategory?.color ?? "#c4426a";
                    return (
                      <Link
                        key={story.id}
                        href={`/stories/${story.slug}`}
                        className="group flex gap-3 p-3.5 rounded-2xl transition-all hover:opacity-80"
                        style={{ background: "var(--card)", border: "1px solid var(--border)", textDecoration: "none" }}
                      >
                        <span
                          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: primaryColor + "20", color: primaryColor }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-bold line-clamp-2 leading-snug mb-0.5 group-hover:opacity-80 transition-opacity"
                            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                          >
                            {story.title}
                          </p>
                          <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                            by {story.author.name}
                            {primaryCategory && (
                              <span
                                className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                style={{ background: primaryColor + "20", color: primaryColor }}
                              >
                                {primaryCategory.name}
                              </span>
                            )}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function NoResults({
  query,
  relatedTags,
}: {
  query: string;
  relatedTags: { name: string; slug: string }[];
}) {
  return (
    <div className="py-10">
      <div
        className="text-center py-12 rounded-2xl mb-10"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(196,66,106,0.1)" }}
        >
          <Search size={24} style={{ color: "#c4426a" }} />
        </div>
        <p
          className="text-xl font-bold mb-1"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          No results for &ldquo;{query}&rdquo;
        </p>
        <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
          Try different keywords or explore by genre
        </p>

        {relatedTags.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
              Related tags you might like:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {relatedTags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/tags/${encodeURIComponent(tag.slug)}`}
                  className="text-sm px-3 py-1.5 rounded-full font-medium transition-opacity hover:opacity-80"
                  style={{
                    background: "rgba(196,66,106,0.1)",
                    color: "#c4426a",
                    border: "1px solid rgba(196,66,106,0.2)",
                  }}
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/stories"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#c4426a" }}
          >
            Browse All Stories
          </Link>
          <Link
            href="/series"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
          >
            Browse Series
          </Link>
        </div>
      </div>
    </div>
  );
}
