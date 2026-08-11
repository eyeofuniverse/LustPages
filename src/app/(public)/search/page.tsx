import {
  getPublishedStories,
  getStoryCount,
  getTrendingStories,
  searchSeries,
} from "@/lib/queries";
import { getCachedCategories, getCachedPopularTags } from "@/lib/cached-queries";
import { prisma } from "@/lib/prisma";
import { SearchInput } from "@/components/search/SearchInput";
import { StoryListItem } from "@/components/story/StoryListItem";
import { AdSlot } from "@/components/ads/AdSlot";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { BookOpen, Layers, TrendingUp, Hash, Search } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 180;

interface Props {
  searchParams: Promise<{ q?: string }>;
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

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const hasQuery = query.length > 0;

  const [stories, seriesResults, storyCount, categories, popularTags, trending] =
    await Promise.all([
      hasQuery
        ? getPublishedStories({ search: query, take: 20 })
        : Promise.resolve([]),
      hasQuery ? searchSeries(query, 9) : Promise.resolve([]),
      hasQuery
        ? getStoryCount({ published: true, search: query })
        : Promise.resolve(0),
      !hasQuery ? getCachedCategories() : Promise.resolve([]),
      !hasQuery ? getCachedPopularTags(30) : Promise.resolve([]),
      !hasQuery ? getTrendingStories(6) : Promise.resolve([]),
    ]);

  const totalResults = storyCount + seriesResults.length;

  if (hasQuery && query.length >= 2) {
    prisma.searchQuery
      .create({ data: { query: query.toLowerCase(), results: totalResults } })
      .catch(() => {});
  }

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
      ...(hasQuery ? [{ "@type": "ListItem", position: 3, name: query, item: `${BASE}/search?q=${encodeURIComponent(query)}` }] : []),
    ],
  };

  const itemListLd = hasQuery && stories.length > 0 ? {
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
  } : null;

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
            background:
              "linear-gradient(180deg, rgba(196,66,106,0.06) 0%, transparent 100%)",
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
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    color: "var(--foreground)",
                  }}
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
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    color: "var(--foreground)",
                  }}
                >
                  Search Results
                </h1>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {totalResults > 0
                    ? `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${query}"`
                    : `No results found for "${query}"`}
                </p>
              </div>
            )}

            <SearchInput initialQuery={query} autoFocus={!hasQuery} />

            {/* Quick links below search bar */}
            {!hasQuery && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Browse:
                </span>
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

        {/* ── Results ── */}
        {hasQuery && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            {totalResults === 0 ? (
              <NoResults query={query} />
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
                        style={{
                          fontFamily: "var(--font-playfair), serif",
                          color: "var(--foreground)",
                        }}
                      >
                        Stories
                      </h2>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(196,66,106,0.1)",
                          color: "#c4426a",
                        }}
                      >
                        {storyCount}
                      </span>
                    </div>
                    <div>
                      {stories.map((story) => (
                        <StoryListItem
                          key={story.id}
                          story={
                            story as Parameters<typeof StoryListItem>[0]["story"]
                          }
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
                        style={{
                          fontFamily: "var(--font-playfair), serif",
                          color: "var(--foreground)",
                        }}
                      >
                        Series
                      </h2>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(196,66,106,0.1)",
                          color: "#c4426a",
                        }}
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
                            style={{
                              background: "var(--card)",
                              border: "1px solid var(--border)",
                              textDecoration: "none",
                            }}
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
                                      color:
                                        primaryCategory?.color ?? "rgb(6,182,212)",
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
                                  style={{
                                    fontFamily: "var(--font-playfair), serif",
                                    color: "var(--foreground)",
                                  }}
                                >
                                  {series.name}
                                </h3>
                                <span
                                  className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[9px] font-extrabold"
                                  style={{
                                    background: "rgba(6,182,212,0.15)",
                                    color: "rgb(6,182,212)",
                                  }}
                                >
                                  S
                                </span>
                              </div>
                              <p
                                className="text-xs mb-1.5 truncate"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                by {series.author.name}
                              </p>
                              {series.description && (
                                <p
                                  className="text-xs line-clamp-2 mb-1.5"
                                  style={{ color: "var(--muted-foreground)" }}
                                >
                                  {series.description}
                                </p>
                              )}
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                style={{
                                  background: "rgba(6,182,212,0.12)",
                                  color: "rgb(6,182,212)",
                                }}
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
            {/* Popular Tags */}
            {popularTags.length > 0 && (
              <section aria-labelledby="popular-tags-heading">
                <div className="flex items-center gap-2 mb-4">
                  <Hash size={16} style={{ color: "#c4426a" }} />
                  <h2
                    id="popular-tags-heading"
                    className="text-base font-bold"
                    style={{
                      fontFamily: "var(--font-playfair), serif",
                      color: "var(--foreground)",
                    }}
                  >
                    Popular Tags
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(({ tag, count }) => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:opacity-80"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                    >
                      <span style={{ color: "var(--muted-foreground)" }}>#</span>
                      {tag}
                      <span
                        className="text-xs ml-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
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
                    style={{
                      fontFamily: "var(--font-playfair), serif",
                      color: "var(--foreground)",
                    }}
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
                      style={{
                        background: cat.color + "12",
                        border: `1px solid ${cat.color}30`,
                      }}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: cat.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: "var(--foreground)" }}
                        >
                          {cat.name}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {cat._count.stories}{" "}
                          {cat._count.stories === 1 ? "story" : "stories"}
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
                      style={{
                        fontFamily: "var(--font-playfair), serif",
                        color: "var(--foreground)",
                      }}
                    >
                      Trending Now
                    </h2>
                  </div>
                  <Link
                    href="/stories"
                    className="text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "#c4426a" }}
                  >
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
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          textDecoration: "none",
                        }}
                      >
                        <span
                          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: primaryColor + "20",
                            color: primaryColor,
                          }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-bold line-clamp-2 leading-snug mb-0.5 group-hover:opacity-80 transition-opacity"
                            style={{
                              fontFamily: "var(--font-playfair), serif",
                              color: "var(--foreground)",
                            }}
                          >
                            {story.title}
                          </p>
                          <p
                            className="text-xs truncate"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            by {story.author.name}
                            {primaryCategory && (
                              <span
                                className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                style={{
                                  background: primaryColor + "20",
                                  color: primaryColor,
                                }}
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

function NoResults({ query }: { query: string }) {
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
          style={{
            fontFamily: "var(--font-playfair), serif",
            color: "var(--foreground)",
          }}
        >
          No results for &ldquo;{query}&rdquo;
        </p>
        <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
          Try different keywords or explore by genre
        </p>
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
            style={{
              background: "var(--muted)",
              color: "var(--foreground)",
            }}
          >
            Browse Series
          </Link>
        </div>
      </div>
    </div>
  );
}
