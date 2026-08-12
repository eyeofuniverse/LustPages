import {
  getPublishedStories,
  getStoryCount,
  getTrendingStories,
  getPublishedCollections,
} from "@/lib/queries";
import { getCachedCategories, getCachedPopularTags } from "@/lib/cached-queries";
import { AUTO_COLLECTIONS } from "@/lib/collections";
import { redirect } from "next/navigation";
import { FilterBar } from "@/components/story/FilterBar";
import { StoriesSearchBar } from "@/components/story/StoriesSearchBar";
import { TrendingCarousel } from "@/components/story/TrendingCarousel";
import { StoryListItem } from "@/components/story/StoryListItem";
import { AdSlot } from "@/components/ads/AdSlot";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen, Star } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300;

const PER_PAGE = 15;

interface Props {
  searchParams: Promise<{
    category?: string;
    page?: string;
    search?: string;
    tag?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const base = process.env.NEXTAUTH_URL ?? "https://lustpages.com";

  if (params.search) {
    return {
      title: `Search: "${params.search}" — LustPages`,
      description: `Stories matching "${params.search}" on LustPages.`,
      robots: { index: false },
    };
  }

  return {
    title: "Browse Erotica Stories — LustPages",
    description:
      "Explore thousands of free adult fiction and erotica stories across every genre. Filter by category or search by author.",
    alternates: { canonical: `${base}/stories` },
    openGraph: {
      title: "Browse Erotica Stories — LustPages",
      description: "Explore thousands of free adult fiction stories on LustPages.",
      type: "website",
      url: `${base}/stories`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Browse Erotica Stories — LustPages",
      description:
        "Explore thousands of free adult fiction and erotica stories across every genre.",
    },
  };
}

export default async function StoriesPage({ searchParams }: Props) {
  const params = await searchParams;

  // Redirect old query-param URLs to SEO-friendly path-based URLs
  if (params.category) redirect(`/categories/${params.category}`);
  if (params.tag) redirect(`/tags/${encodeURIComponent(params.tag)}`);

  const rawPage = parseInt(params.page ?? "1", 10);
  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  const skip = (page - 1) * PER_PAGE;
  const sort = params.sort === "top-rated" ? "top-rated" as const : "latest" as const;
  const showTrending = !params.search && page === 1 && sort === "latest";

  // Batch 1: core page data
  const [stories, categories, total] = await Promise.all([
    getPublishedStories({ take: PER_PAGE, skip, search: params.search, sort }).catch(() => []),
    getCachedCategories().catch(() => []),
    getStoryCount({ published: true, search: params.search }).catch(() => 0),
  ]);

  // Batch 2: non-critical supplementary data (separate to avoid pool exhaustion)
  const [trendingStories, popularTags, featuredCollections] = await Promise.all([
    showTrending ? getTrendingStories(10).catch(() => []) : Promise.resolve([]),
    getCachedPopularTags(20).catch(() => []),
    !params.search && page === 1 ? getPublishedCollections().catch(() => []) : Promise.resolve([]),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  function buildUrl(p: number, newSort?: string) {
    const qs = new URLSearchParams({
      ...(params.search && { search: params.search }),
      ...((newSort ?? sort) === "top-rated" && { sort: "top-rated" }),
      ...(p > 1 && { page: String(p) }),
    });
    const str = qs.toString();
    return str ? `/stories?${str}` : "/stories";
  }

  const heading = params.search ? `Search: "${params.search}"` : "All Stories";
  const subheading = params.search
    ? `${total} ${total === 1 ? "result" : "results"}`
    : `${total} ${total === 1 ? "story" : "stories"} available`;
  const sectionLabel = params.search
    ? `Results for "${params.search}"`
    : sort === "top-rated" ? "Top Rated" : "Most Recent";

  return (
    <>
      {!params.search && page === 1 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Browse Erotica Stories — LustPages",
              description: "Explore thousands of free adult fiction stories on LustPages.",
              url: "https://lustpages.com/stories",
            }),
          }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-1"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            {heading}
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {subheading}
          </p>
        </div>

        {/* Search */}
        <div className="mb-5">
          <StoriesSearchBar initialSearch={params.search} />
        </div>

        {/* Category + Tag nav */}
        <div className="mb-6 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <FilterBar
            categories={categories}
            popularTags={popularTags}
          />
        </div>

        {/* Collections strip — only on page 1 without search */}
        {showTrending && (featuredCollections.length > 0 || AUTO_COLLECTIONS.length > 0) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Best Of Collections
              </h2>
              <Link href="/collections" className="text-xs font-semibold transition-opacity hover:opacity-75" style={{ color: "#c4426a" }}>
                See all →
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {AUTO_COLLECTIONS.slice(0, 3).map((col) => (
                <Link
                  key={col.slug}
                  href={`/collections/${col.slug}`}
                  className="shrink-0 flex flex-col gap-1.5 px-4 py-3 rounded-xl transition-all hover:opacity-75"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", minWidth: "180px" }}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Live ranking</span>
                  <span className="text-sm font-semibold leading-snug" style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}>
                    {col.title}
                  </span>
                </Link>
              ))}
              {featuredCollections.slice(0, 2).map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="shrink-0 flex flex-col gap-1.5 px-4 py-3 rounded-xl transition-all hover:opacity-75"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", minWidth: "180px" }}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Editorial</span>
                  <span className="text-sm font-semibold leading-snug" style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}>
                    {col.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trending carousel */}
        {showTrending && trendingStories.length > 0 && (
          <TrendingCarousel stories={trendingStories} />
        )}

        {/* Results */}
        <section aria-labelledby="results-heading">
          <div className="flex items-center justify-between mb-1">
            <h2
              id="results-heading"
              className="text-base font-semibold"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              {sectionLabel}
            </h2>
            <div className="flex items-center gap-2">
              {!params.search && (
                <div className="flex items-center gap-1 text-xs">
                  <Link
                    href={buildUrl(1, "latest")}
                    className="px-2.5 py-1 rounded-lg font-medium transition-all"
                    style={{
                      background: sort === "latest" ? "rgba(196,66,106,0.15)" : "var(--muted)",
                      color: sort === "latest" ? "#c4426a" : "var(--muted-foreground)",
                    }}
                  >
                    Latest
                  </Link>
                  <Link
                    href={buildUrl(1, "top-rated")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all"
                    style={{
                      background: sort === "top-rated" ? "rgba(196,66,106,0.15)" : "var(--muted)",
                      color: sort === "top-rated" ? "#c4426a" : "var(--muted-foreground)",
                    }}
                  >
                    <Star size={11} fill={sort === "top-rated" ? "#c4426a" : "none"} />
                    Top Rated
                  </Link>
                </div>
              )}
              {page > 1 && (
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Page {page} of {totalPages}
                </span>
              )}
            </div>
          </div>

          {stories.length === 0 ? (
            <div
              className="text-center py-20 rounded-2xl mt-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <BookOpen
                size={36}
                className="mx-auto mb-3 opacity-30"
                style={{ color: "var(--muted-foreground)" }}
              />
              <p
                className="text-lg font-medium mb-1"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
              >
                No stories found
              </p>
              <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
                Try a different search term
              </p>
              <Link
                href="/stories"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#c4426a" }}
              >
                Browse all stories
              </Link>
            </div>
          ) : (
            <div>
              {stories.slice(0, 3).map((story) => (
                <StoryListItem
                  key={story.id}
                  story={story as Parameters<typeof StoryListItem>[0]["story"]}
                />
              ))}
              {stories.length > 3 && <AdSlot identifier="stories_list_top" />}
              {stories.slice(3, 11).map((story) => (
                <StoryListItem
                  key={story.id}
                  story={story as Parameters<typeof StoryListItem>[0]["story"]}
                />
              ))}
              {stories.length > 11 && <AdSlot identifier="stories_list_mid" />}
              {stories.slice(11).map((story) => (
                <StoryListItem
                  key={story.id}
                  story={story as Parameters<typeof StoryListItem>[0]["story"]}
                />
              ))}
            </div>
          )}
        </section>

        {/* Ad: below list */}
        {stories.length > 0 && <AdSlot identifier="stories_list_bottom" />}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            className="flex items-center justify-center gap-1.5 mt-10"
            aria-label="Pagination"
          >
            {page > 1 && (
              <Link
                href={buildUrl(page - 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-75"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                <ChevronLeft size={14} /> Prev
              </Link>
            )}
            {buildPageNumbers(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span
                  key={`e${i}`}
                  className="px-2 text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  …
                </span>
              ) : (
                <Link
                  key={p}
                  href={buildUrl(p as number)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all"
                  style={{
                    background: p === page ? "#c4426a" : "var(--card)",
                    color: p === page ? "white" : "var(--muted-foreground)",
                    border: "1px solid var(--border)",
                  }}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </Link>
              )
            )}
            {page < totalPages && (
              <Link
                href={buildUrl(page + 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-75"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                Next <ChevronRight size={14} />
              </Link>
            )}
          </nav>
        )}
      </div>
    </>
  );
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
