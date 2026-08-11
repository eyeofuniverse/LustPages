import {
  getPublishedStories,
  getStoryCount,
  getTrendingStories,
  getCategoryBySlug,
} from "@/lib/queries";
import { getCachedCategories, getCachedPopularTags } from "@/lib/cached-queries";
import { notFound } from "next/navigation";
import { FilterBar } from "@/components/story/FilterBar";
import { StoriesSearchBar } from "@/components/story/StoriesSearchBar";
import { TrendingCarousel } from "@/components/story/TrendingCarousel";
import { StoryListItem } from "@/components/story/StoryListItem";
import { AdSlot } from "@/components/ads/AdSlot";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300;

const PER_PAGE = 15;
const BASE = "https://lustpages.com";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };
  const name = category.name;
  const metaDesc =
    category.description ??
    `Explore ${name} erotica and adult fiction on LustPages — slow-burn romance to explicit scenes, all free to read and updated regularly.`;
  return {
    title: `${name} Erotica Stories — LustPages`,
    description: metaDesc,
    alternates: { canonical: `${BASE}/categories/${slug}` },
    openGraph: {
      title: `${name} Erotica Stories — LustPages`,
      description: metaDesc,
      type: "website",
      url: `${BASE}/categories/${slug}`,
      siteName: "LustPages",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} Erotica Stories — LustPages`,
      description: metaDesc,
    },
    keywords: [`${name} erotica`, `${name} adult fiction`, `${name} stories`, "lustpages", "free erotica", "online adult fiction"],
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const skip = (page - 1) * PER_PAGE;

  const [category, stories, categories, total] = await Promise.all([
    getCategoryBySlug(slug),
    getPublishedStories({ take: PER_PAGE, skip, categorySlug: slug }).catch(() => []),
    getCachedCategories().catch(() => []),
    getStoryCount({ published: true, categorySlug: slug }).catch(() => 0),
  ]);

  const [trendingStories, popularTags] = await Promise.all([
    page === 1 ? getTrendingStories(10).catch(() => []) : Promise.resolve([]),
    getCachedPopularTags(20).catch(() => []),
  ]);

  if (!category) notFound();

  const totalPages = Math.ceil(total / PER_PAGE);

  function buildUrl(p: number) {
    if (p <= 1) return `/categories/${slug}`;
    return `/categories/${slug}?page=${p}`;
  }

  const heading = `${category.name} Stories`;

  const categoryDescription =
    category.description ??
    `Explore ${category.name} erotica and adult fiction on LustPages. ` +
    `From slow-burn romantic tension to explicitly charged scenes, our ${category.name} collection ` +
    `covers every mood and intensity level. All stories are free to read, written by passionate ` +
    `authors, and updated regularly — so there's always something new to discover. ` +
    `Browse reader favourites, filter by rating, or dive into the latest arrivals.`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: heading,
            description: categoryDescription,
            url: `${BASE}/categories/${slug}`,
          }),
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs mb-5" style={{ color: "var(--muted-foreground)" }} aria-label="Breadcrumb">
          <Link href="/stories" className="hover:opacity-75 transition-opacity">Stories</Link>
          <span>›</span>
          <span style={{ color: category.color, fontWeight: 600 }}>{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full" style={{ background: category.color }} />
            <h1
              className="text-3xl sm:text-4xl font-bold"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              {heading}
            </h1>
          </div>
          {page === 1 && (
            <p className="text-sm mb-3 max-w-2xl leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {categoryDescription}
            </p>
          )}
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {total} {total === 1 ? "story" : "stories"}
          </p>
        </div>

        {/* Search */}
        <div className="mb-5">
          <StoriesSearchBar />
        </div>

        {/* Category + Tag nav */}
        <div className="mb-6 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <FilterBar
            categories={categories}
            activeCategory={slug}
            popularTags={popularTags}
          />
        </div>

        <AdSlot identifier="category_page_banner" />

        {/* Trending carousel */}
        {page === 1 && trendingStories.length > 0 && (
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
              {category.name} Stories
            </h2>
            {page > 1 && (
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          {stories.length === 0 ? (
            <div
              className="text-center py-20 rounded-2xl mt-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <BookOpen size={36} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-lg font-medium mb-1" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
                No stories yet
              </p>
              <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
                No {category.name} stories have been published yet
              </p>
              <Link href="/stories" className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#c4426a" }}>
                Browse all stories
              </Link>
            </div>
          ) : (
            <div>
              {stories.map((story) => (
                <StoryListItem
                  key={story.id}
                  story={story as Parameters<typeof StoryListItem>[0]["story"]}
                />
              ))}
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-1.5 mt-10" aria-label="Pagination">
            {page > 1 && (
              <Link
                href={buildUrl(page - 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-75"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
              >
                <ChevronLeft size={14} /> Prev
              </Link>
            )}
            {buildPageNumbers(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`e${i}`} className="px-2 text-sm" style={{ color: "var(--muted-foreground)" }}>…</span>
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
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
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
