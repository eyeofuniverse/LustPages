import Link from "next/link";
import { getTrendingStories } from "@/lib/queries";
import { SafeImage } from "@/components/ui/SafeImage";
import { AdSlot } from "@/components/ads/AdSlot";
import { TrendingUp, Eye, Heart, Clock, Star } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 1800;

const BASE = "https://lustpages.com";

export const metadata: Metadata = {
  title: "Trending This Week — LustPages",
  description: "Discover the hottest adult fiction stories of the past 7 days, ranked by reader engagement.",
  keywords: ["trending erotica", "popular adult fiction", "hottest erotic stories", "top stories this week", "lustpages trending"],
  alternates: { canonical: `${BASE}/trending` },
  openGraph: {
    title: "Trending This Week — LustPages",
    description: "Discover the hottest adult fiction stories of the past 7 days, ranked by reader engagement.",
    type: "website",
    url: `${BASE}/trending`,
    images: [{ url: `${BASE}/og-default.jpg`, width: 1200, height: 630, alt: "Trending Stories on LustPages" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trending This Week — LustPages",
    description: "Discover the hottest adult fiction stories of the past 7 days.",
    images: [`${BASE}/og-default.jpg`],
  },
};

export default async function TrendingPage() {
  const stories = await getTrendingStories(20).catch(() => []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: "rgba(196,66,106,0.12)" }}
          >
            <TrendingUp size={22} style={{ color: "#c4426a" }} />
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Trending This Week
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Ranked by reader engagement over the past 7 days — views, likes, and recency combined.
        </p>
      </div>

      <AdSlot identifier="trending_page_banner" />

      {stories.length === 0 ? (
        <div className="text-center py-20">
          <TrendingUp size={40} className="mx-auto mb-4 opacity-30" style={{ color: "#c4426a" }} />
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            No trending data yet
          </p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Check back once stories have been read and liked.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {stories.map((story, i) => {
            const primaryCategory = story.categories[0];
            const rank = i + 1;
            const isTop3 = rank <= 3;

            return (
              <Link
                key={story.id}
                href={`/stories/${story.slug}`}
                className="group flex items-center gap-4 sm:gap-5 p-4 rounded-2xl transition-all duration-200 hover:translate-y-[-1px]"
                style={{
                  background: "var(--card)",
                  border: isTop3 ? "1px solid rgba(196,66,106,0.3)" : "1px solid var(--border)",
                  textDecoration: "none",
                }}
              >
                {/* Rank */}
                <div
                  className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl"
                  style={{
                    background: isTop3 ? "rgba(196,66,106,0.15)" : "var(--muted)",
                    color: isTop3 ? "#c4426a" : "var(--muted-foreground)",
                    fontFamily: "var(--font-playfair), serif",
                  }}
                >
                  {rank}
                </div>

                {/* Cover */}
                <div
                  className="shrink-0 rounded-lg overflow-hidden"
                  style={{ width: 52, height: 78, background: "var(--muted)" }}
                >
                  {story.coverImage ? (
                    <SafeImage
                      src={story.coverImage}
                      alt={story.title}
                      width={52}
                      height={78}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-lg font-bold"
                      style={{
                        background: primaryCategory
                          ? `linear-gradient(160deg, ${primaryCategory.color}55, ${primaryCategory.color}18)`
                          : "linear-gradient(160deg, rgba(196,66,106,0.4), rgba(196,66,106,0.1))",
                        color: primaryCategory?.color ?? "#c4426a",
                        fontFamily: "var(--font-playfair), serif",
                        opacity: 0.75,
                      }}
                    >
                      {story.title[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2
                    className="font-bold text-sm sm:text-base line-clamp-2 leading-snug mb-1 group-hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                  >
                    {story.title}
                  </h2>
                  <p className="text-xs mb-2 truncate" style={{ color: "var(--muted-foreground)" }}>
                    by {story.author.name}
                  </p>
                  {primaryCategory && (
                    <Link
                      href={`/categories/${primaryCategory.slug}`}
                      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded mb-2 transition-opacity hover:opacity-80"
                      style={{ background: primaryCategory.color + "20", color: primaryCategory.color }}
                    >
                      {primaryCategory.name}
                    </Link>
                  )}
                  {/* Stats */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {story.recentViews > 0 && (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        <Eye size={11} />
                        {story.recentViews.toLocaleString()} this week
                      </span>
                    )}
                    {story.recentLikes > 0 && (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        <Heart size={11} />
                        {story.recentLikes} likes
                      </span>
                    )}
                    {story.ratingCount >= 3 && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#c4426a" }}>
                        <Star size={11} fill="#c4426a" />
                        {story.ratingAvg.toFixed(1)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      <Clock size={11} />
                      {story.readingTime} min read
                    </span>
                  </div>
                </div>

                {/* Coin badge (desktop) */}
                {story.coinPrice != null && (
                  <div
                    className="hidden sm:flex items-center shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{ background: "rgba(234,179,8,0.15)", color: "#f59e0b" }}
                  >
                    {story.coinPrice}c
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/stories"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        >
          Browse All Stories
        </Link>
      </div>
    </div>
  );
}
