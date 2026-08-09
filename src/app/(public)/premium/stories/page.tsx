import { getPremiumStoriesPaginated, getPremiumStoriesCount, getPremiumSeriesList } from "@/lib/queries";
import { AdSlot } from "@/components/ads/AdSlot";
import { StoryListItem } from "@/components/story/StoryListItem";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { ChevronLeft, ChevronRight, Coins, Lock, BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

const PER_PAGE = 15;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

const BASE = "https://lustpages.com";

export const metadata: Metadata = {
  title: "Premium Stories & Series — LustPages",
  description:
    "Browse exclusive premium adult fiction stories and series on LustPages. Unlock with coins to access content from top authors.",
  alternates: { canonical: `${BASE}/premium/stories` },
  openGraph: {
    title: "Premium Stories & Series — LustPages",
    description:
      "Browse exclusive premium adult fiction stories and series on LustPages.",
    type: "website",
    url: `${BASE}/premium/stories`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Stories & Series — LustPages",
    description:
      "Browse exclusive premium adult fiction stories and series. Unlock with coins.",
  },
};

export default async function PremiumStoriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip = (page - 1) * PER_PAGE;

  const [stories, total, premiumSeries] = await Promise.all([
    getPremiumStoriesPaginated({ take: PER_PAGE, skip }),
    getPremiumStoriesCount(),
    page === 1 ? getPremiumSeriesList(20) : Promise.resolve([]),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  function buildUrl(p: number) {
    return p > 1 ? `/premium/stories?page=${p}` : "/premium/stories";
  }

  return (
    <>
      {page === 1 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Premium Stories & Series — LustPages",
              description:
                "Exclusive premium adult fiction stories and series unlocked with coins.",
              url: `${BASE}/premium/stories`,
            }),
          }}
        />
      )}
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 rounded-xl mt-1 shrink-0" style={{ background: "rgba(234,179,8,0.12)" }}>
            <Lock size={20} style={{ color: "#eab308" }} />
          </div>
          <div>
            <h1
              className="text-3xl sm:text-4xl font-bold mb-1"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Premium Content
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Exclusive stories and series unlocked with coins
            </p>
          </div>
        </div>

        {/* Coins banner */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}
        >
          <Coins size={16} style={{ color: "#eab308" }} />
          <span style={{ color: "var(--foreground)" }}>
            Buy coins from the{" "}
            <Link href="/store" className="font-semibold hover:opacity-75" style={{ color: "#eab308" }}>
              coin store
            </Link>{" "}
            to unlock premium stories instantly.
          </span>
        </div>
      </div>

      {/* Premium Series section — only on page 1 */}
      {page === 1 && premiumSeries.length > 0 && (
        <section className="mb-10">
          <h2
            className="text-xl font-bold mb-4 flex items-center gap-2"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            <BookOpen size={18} style={{ color: "#eab308" }} />
            Premium Series
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {premiumSeries.map((series) => {
              const cover = series.stories[0]?.coverImage ?? null;
              const primaryCategory = series.stories[0]?.categories[0];
              const placeholderBg = primaryCategory
                ? `linear-gradient(160deg, ${primaryCategory.color}55 0%, ${primaryCategory.color}18 100%)`
                : "linear-gradient(160deg, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.1) 100%)";

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
                      <SafeImage src={cover} alt={series.name} width={64} height={96} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: placeholderBg }}>
                        <span
                          className="text-xl font-bold"
                          style={{ fontFamily: "var(--font-playfair), serif", color: primaryCategory?.color ?? "#eab308", opacity: 0.75 }}
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
                        className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ background: "rgba(234,179,8,0.15)", color: "#eab308" }}
                      >
                        <Coins size={7} /> Premium
                      </span>
                    </div>
                    <p className="text-xs mb-2 truncate" style={{ color: "var(--muted-foreground)" }}>
                      by {series.author.name}
                    </p>
                    {series.description && (
                      <p className="text-xs line-clamp-2 mb-2" style={{ color: "var(--muted-foreground)" }}>
                        {series.description}
                      </p>
                    )}
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(6,182,212,0.12)", color: "rgb(6,182,212)" }}
                    >
                      <BookOpen size={8} />
                      {series._count.stories} {series._count.stories === 1 ? "part" : "parts"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <AdSlot identifier="premium_stories_banner" />

      {/* Premium Stories */}
      <section>
        <h2
          className="text-xl font-bold mb-4 flex items-center gap-2"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          <Coins size={18} style={{ color: "#eab308" }} />
          Premium Stories
          <span className="text-sm font-normal" style={{ color: "var(--muted-foreground)" }}>
            — {total} {total === 1 ? "story" : "stories"}
          </span>
        </h2>

        {stories.length === 0 ? (
          <div
            className="text-center py-20 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Lock size={36} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-lg font-medium" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
              No premium stories yet
            </p>
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
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
