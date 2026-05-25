import {
  getPublishedStories,
  getCategories,
  getStoryCount,
  getTrendingStories,
  getPopularTags,
  getTagBySlug,
} from "@/lib/queries";
import { FilterBar } from "@/components/story/FilterBar";
import { StoriesSearchBar } from "@/components/story/StoriesSearchBar";
import { TrendingCarousel } from "@/components/story/TrendingCarousel";
import { StoryListItem } from "@/components/story/StoryListItem";
import { AdSlot } from "@/components/ads/AdSlot";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";

const PER_PAGE = 15;
const BASE = "https://lustpages.com";

interface Props {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const tagSlug = decodeURIComponent(tag);
  const tagRecord = await getTagBySlug(tagSlug);
  const displayName = tagRecord?.name ?? tagSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const desc = `Explore the best ${displayName} erotica and adult fiction stories on LustPages. Browse free and premium ${displayName} stories written by talented independent authors.`;
  return {
    title: `${displayName} Stories — LustPages`,
    description: desc,
    alternates: { canonical: `${BASE}/tags/${tag}` },
    openGraph: {
      title: `${displayName} Stories — LustPages`,
      description: desc,
      type: "website",
      url: `${BASE}/tags/${tag}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} Stories — LustPages`,
      description: desc,
    },
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { tag } = await params;
  const tagSlug = decodeURIComponent(tag);
  const tagRecord = await getTagBySlug(tagSlug);
  const tagName = tagRecord?.name ?? tagSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const skip = (page - 1) * PER_PAGE;

  const [stories, categories, total] = await Promise.all([
    getPublishedStories({ take: PER_PAGE, skip, tag: tagSlug }).catch(() => []),
    getCategories().catch(() => []),
    getStoryCount({ published: true, tag: tagSlug }).catch(() => 0),
  ]);

  const [trendingStories, popularTags] = await Promise.all([
    page === 1 ? getTrendingStories(10).catch(() => []) : Promise.resolve([]),
    getPopularTags(20).catch(() => []),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  function buildUrl(p: number) {
    if (p <= 1) return `/tags/${tag}`;
    return `/tags/${tag}?page=${p}`;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `#${tagName} Stories — LustPages`,
            description: `Explore the best ${tagName} erotica and adult fiction stories on LustPages. Browse free and premium ${tagName} stories written by talented independent authors.`,
            url: `${BASE}/tags/${tag}`,
          }),
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-xs mb-5"
          style={{ color: "var(--muted-foreground)" }}
          aria-label="Breadcrumb"
        >
          <Link href="/stories" className="hover:opacity-75 transition-opacity">Stories</Link>
          <span>›</span>
          <Link href="/tags" className="hover:opacity-75 transition-opacity">Tags</Link>
          <span>›</span>
          <span style={{ color: "#c4426a", fontWeight: 600 }}>#{tagName}</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-1"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            <span style={{ color: "#c4426a" }}>#</span>
            {tagName}
          </h1>
          <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
            {total} {total === 1 ? "story" : "stories"} tagged #{tagName}
          </p>
          <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "var(--muted-foreground)" }}>
            Explore the best {tagName} erotica and adult fiction stories on LustPages. Browse free and premium {tagName} stories written by talented independent authors.
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
            activeTag={tagName}
            popularTags={popularTags}
          />
        </div>

        <AdSlot identifier="tags_page_banner" />

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
              #{tagName} Stories
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
                No stories found
              </p>
              <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
                No stories tagged #{tagName} yet
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
