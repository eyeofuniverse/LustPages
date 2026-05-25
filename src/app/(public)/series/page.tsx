import { getSeriesList, getSeriesCount, computeSeriesRating } from "@/lib/queries";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { ChevronLeft, ChevronRight, Layers, BookOpen, Search, Star } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

const PER_PAGE = 18;
const BASE = "https://lustpages.com";

interface Props {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  if (params.search) {
    return {
      title: `Series search: "${params.search}" — LustPages`,
      robots: { index: false, follow: true },
    };
  }
  return {
    title: "Browse Series — LustPages",
    description:
      "Explore all ongoing and completed adult fiction series on LustPages. Multi-part stories from talented authors — updated as new parts drop.",
    alternates: { canonical: `${BASE}/series` },
    openGraph: {
      title: "Browse Series — LustPages",
      description:
        "Explore all ongoing and completed adult fiction series on LustPages. Updated as new parts drop.",
      type: "website",
      url: `${BASE}/series`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Browse Series — LustPages",
      description:
        "Explore all ongoing and completed adult fiction series on LustPages.",
    },
  };
}

export default async function SeriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip = (page - 1) * PER_PAGE;

  const [seriesList, total] = await Promise.all([
    getSeriesList({ take: PER_PAGE, skip, search: params.search }),
    getSeriesCount(params.search),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  function buildUrl(p: number) {
    const qs = new URLSearchParams({
      ...(params.search && { search: params.search }),
      ...(p > 1 && { page: String(p) }),
    });
    const str = qs.toString();
    return str ? `/series?${str}` : "/series";
  }

  return (
    <>
      {!params.search && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Browse Series — LustPages",
              description:
                "Explore all ongoing and completed adult fiction series on LustPages.",
              url: `${BASE}/series`,
            }),
          }}
        />
      )}
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="p-2.5 rounded-xl mt-1 shrink-0" style={{ background: "rgba(196,66,106,0.12)" }}>
          <Layers size={20} style={{ color: "#c4426a" }} />
        </div>
        <div>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-1"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            {params.search ? `Search: "${params.search}"` : "All Series"}
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {total} {total === 1 ? "series" : "series"} available
          </p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" action="/series" className="mb-6">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="text"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search series by name…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </div>
      </form>

      {/* Grid */}
      {seriesList.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Layers size={36} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-lg font-medium mb-1" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
            No series found
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
            {params.search ? "Try a different search term" : "Series coming soon"}
          </p>
          {params.search && (
            <Link href="/series" className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#c4426a" }}>
              Browse all series
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map((series) => {
            const cover = series.stories[0]?.coverImage ?? null;
            const primaryCategory = series.stories[0]?.categories[0];
            const seriesRating = computeSeriesRating(
              series.stories.map((s) => ({ ratingAvg: s.ratingAvg, ratingCount: s.ratingCount }))
            );
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
                {/* Cover */}
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
                        style={{ fontFamily: "var(--font-playfair), serif", color: primaryCategory?.color ?? "rgb(6,182,212)", opacity: 0.75 }}
                      >
                        {series.name[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2
                      className="text-sm font-bold line-clamp-2 leading-snug"
                      style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                    >
                      {series.name}
                    </h2>
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
                    <p className="text-xs line-clamp-2 mb-2" style={{ color: "var(--muted-foreground)" }}>
                      {series.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(6,182,212,0.12)", color: "rgb(6,182,212)" }}
                    >
                      <BookOpen size={8} />
                      {series._count.stories} {series._count.stories === 1 ? "part" : "parts"}
                    </span>
                    {primaryCategory && (
                      <span
                        className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: primaryCategory.color + "20", color: primaryCategory.color }}
                      >
                        {primaryCategory.name}
                      </span>
                    )}
                    {seriesRating.count >= 3 && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
                      >
                        <Star size={8} fill="#c4426a" />
                        {seriesRating.avg.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

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
