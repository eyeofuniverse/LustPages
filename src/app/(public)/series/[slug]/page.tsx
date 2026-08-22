// Series pages are permanently cached; revalidatePath("/series/[slug]") busts on mutation.
export const revalidate = false;

import { notFound } from "next/navigation";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { computeSeriesRating, getSeriesUnlock, getUserCoinBalance } from "@/lib/queries";
import { getCachedSeriesBySlug } from "@/lib/cached-queries";
import { formatDate } from "@/lib/utils";
import { auth } from "@/auth";
import { SeriesUnlockGate } from "@/components/coins/SeriesUnlockGate";
import { BookOpen, Clock, Heart, Lock, ArrowLeft, MessageCircle, Star, Coins } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE = process.env.NEXTAUTH_URL ?? "https://lustpages.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const series = await getCachedSeriesBySlug(slug);
  if (!series) return { title: "Series Not Found" };

  const desc =
    series.description ??
    `${series.name} is a ${series.stories.length}-part adult fiction series by ${series.author.name} on LustPages. Read all parts free and premium.`;

  return {
    title: `${series.name} — Series by ${series.author.name} | LustPages`,
    description: desc,
    alternates: { canonical: `${SITE}/series/${slug}` },
    openGraph: {
      title: `${series.name} — Series by ${series.author.name}`,
      description: desc,
      type: "book",
      url: `${SITE}/series/${slug}`,
      ...(series.coverImage && { images: [{ url: series.coverImage, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${series.name} — Series by ${series.author.name}`,
      description: desc,
      ...(series.coverImage && { images: [series.coverImage] }),
    },
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const [series, session] = await Promise.all([getCachedSeriesBySlug(slug), auth()]);
  if (!series) notFound();

  const userId = session?.user?.id;
  const isSeriesPremium = series.isPremium && !!series.coinPrice;

  const [seriesUnlock, userBalance] = await Promise.all([
    isSeriesPremium && userId ? getSeriesUnlock(userId, series.id) : Promise.resolve(null),
    userId ? getUserCoinBalance(userId) : Promise.resolve(0),
  ]);
  const hasSeriesUnlock = !!seriesUnlock;

  const totalLikes = series.stories.reduce((sum, s) => sum + s._count.likes, 0);
  const totalReadingTime = series.stories.reduce((sum, s) => sum + s.readingTime, 0);
  const totalWordCount = totalReadingTime * 225;
  const seriesRating = computeSeriesRating(
    series.stories.map((s) => ({ ratingAvg: s.ratingAvg, ratingCount: s.ratingCount }))
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    name: series.name,
    url: `${SITE}/series/${series.slug}`,
    ...(series.description && { description: series.description }),
    ...(series.coverImage && { image: series.coverImage }),
    author: {
      "@type": "Person",
      name: series.author.name,
      url: `${SITE}/authors/${series.author.slug}`,
    },
    numberOfEpisodes: series.stories.length,
    wordCount: totalWordCount,
    datePublished: new Date(series.createdAt).toISOString(),
    dateModified: new Date(series.updatedAt).toISOString(),
    ...(seriesRating.count >= 3 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: seriesRating.avg,
        ratingCount: seriesRating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    hasPart: series.stories.map((part, idx) => ({
      "@type": "CreativeWork",
      name: part.title,
      url: `${SITE}/stories/${part.slug}`,
      position: part.chapterNumber ?? idx + 1,
      ...(part.excerpt && { description: part.excerpt }),
      wordCount: part.readingTime * 225,
      datePublished: new Date(part.createdAt).toISOString(),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link
        href="/series"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-75"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft size={15} /> Back to Series
      </Link>

      {/* Series header */}
      <div
        className="rounded-2xl p-7 mb-8"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.3)" }}
          >
            <BookOpen size={12} /> Series · {series.stories.length} parts
          </div>
          {isSeriesPremium && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
            >
              <Lock size={10} /> Premium · {series.coinPrice} coins
            </div>
          )}
          {isSeriesPremium && series.freeChapters > 0 && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              First {series.freeChapters} {series.freeChapters === 1 ? "chapter" : "chapters"} free
            </div>
          )}
          {isSeriesPremium && hasSeriesUnlock && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              ✓ Unlocked
            </div>
          )}
        </div>

        <h1
          className="text-3xl sm:text-4xl font-bold mb-3 leading-tight"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          {series.name}
        </h1>

        {series.description && (
          <p className="text-base leading-relaxed mb-5" style={{ color: "var(--muted-foreground)" }}>
            {series.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-5 text-sm" style={{ color: "var(--muted-foreground)" }}>
          <Link
            href={`/authors/${series.author.slug}`}
            className="font-semibold transition-opacity hover:opacity-75"
            style={{ color: "var(--foreground)" }}
          >
            By {series.author.name}
          </Link>
          <span className="flex items-center gap-1.5">
            <Heart size={14} /> {totalLikes.toLocaleString()} total likes
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} /> ~{totalReadingTime} min total
          </span>
          {seriesRating.count >= 3 && (
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: "#c4426a" }}>
              <Star size={14} fill="#c4426a" />
              {seriesRating.avg.toFixed(1)} series rating ({seriesRating.count} ratings)
            </span>
          )}
        </div>

        {series.stories.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/stories/${series.stories[0].slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#c4426a" }}
            >
              <BookOpen size={15} /> Start Reading — Part 1
            </Link>
            {isSeriesPremium && !hasSeriesUnlock && (
              <Link
                href="#unlock"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
              >
                <Coins size={15} /> Unlock Full Series · {series.coinPrice} coins
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Series unlock gate */}
      {isSeriesPremium && !hasSeriesUnlock && (
        <div id="unlock">
          <SeriesUnlockGate
            seriesId={series.id}
            seriesSlug={series.slug}
            seriesName={series.name}
            coinPrice={series.coinPrice!}
            freeChapters={series.freeChapters}
            chapterNumber={series.freeChapters + 1}
            userBalance={userBalance}
            isLoggedIn={!!userId}
          />
        </div>
      )}

      {/* Parts list */}
      <h2
        className="text-xl font-bold mb-5"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        All Parts
      </h2>

      <div className="space-y-3">
        {series.stories.map((part, idx) => (
          <Link
            key={part.id}
            href={`/stories/${part.slug}`}
            className="flex gap-5 p-5 rounded-2xl transition-all hover:translate-y-[-1px] group"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* Part number badge */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
              style={{
                background: "rgba(196,66,106,0.12)",
                color: "#c4426a",
                fontFamily: "var(--font-playfair), serif",
              }}
            >
              {part.chapterNumber ?? idx + 1}
            </div>

            {/* Cover thumbnail */}
            {part.coverImage && (
              <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 relative">
                <SafeImage
                  src={part.coverImage}
                  alt={part.title}
                  fill
                  sizes="80px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}

            {/* Details */}
            <div className="flex-1 min-w-0">
              {(() => {
                const partNum = part.chapterNumber ?? idx + 1;
                const isFree = !isSeriesPremium || partNum <= series.freeChapters;
                const isLocked = isSeriesPremium && !isFree && !hasSeriesUnlock;
                return (
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3
                      className="font-bold text-base leading-snug group-hover:opacity-75 transition-opacity"
                      style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}
                    >
                      {part.title}
                    </h3>
                    {isSeriesPremium && isFree && (
                      <span
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
                      >
                        Free
                      </span>
                    )}
                    {isLocked && (
                      <span
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
                      >
                        <Lock size={10} /> Premium
                      </span>
                    )}
                  </div>
                );
              })()}

              {part.excerpt && (
                <p
                  className="text-sm line-clamp-2 mb-2"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {part.excerpt}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {part.readingTime} min
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={11} /> {part._count.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={11} /> {part._count.comments}
                </span>
                {part.ratingCount >= 3 && (
                  <span className="flex items-center gap-1 font-semibold" style={{ color: "#c4426a" }}>
                    <Star size={11} fill="#c4426a" />
                    {part.ratingAvg.toFixed(1)}
                  </span>
                )}
                <span className="ml-auto">{formatDate(part.createdAt)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {series.stories.length === 0 && (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
          <p style={{ color: "var(--muted-foreground)" }}>No published parts yet. Check back soon.</p>
        </div>
      )}

      <AdSlot identifier="series_detail_banner" />
    </div>
    </>
  );
}
