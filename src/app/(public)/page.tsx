import Link from "next/link";
import { getLatestStories, getLatestSeries, getSpotlightAuthors, getFeaturedPromotions, getPremiumStories, getTrendingStories } from "@/lib/queries";
import { getCachedPublicStats, getCachedCategoriesWithStories } from "@/lib/cached-queries";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { PremiumCarousel } from "@/components/home/PremiumCarousel";
import { LatestCarousel } from "@/components/home/LatestCarousel";
import { HomeTrendingSection } from "@/components/home/HomeTrendingSection";
import { HomeCollectionsSection } from "@/components/home/HomeCollectionsSection";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { AdSlot } from "@/components/ads/AdSlot";
import { HeroJoinButton, HomeBottomCTA } from "@/components/home/HomeCTAButtons";
import { formatStatCount } from "@/lib/utils";
import {
  BookOpen,
  PenSquare,
  Users,
  Eye,
  Star,
  Sparkles,
  Flame,
} from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 1800;

const siteUrl = process.env.NEXTAUTH_URL ?? "https://lustpages.com";

export const metadata: Metadata = {
  title: { absolute: "LustPages — Premium Adult Fiction & Erotica Stories" },
  description:
    "LustPages (also known as Lust Pages) — Discover thousands of premium adult fiction stories across romance, fantasy, thriller, and contemporary genres. Written by passionate authors. Free to read.",
  keywords: [
    "LustPages",
    "Lust Pages",
    "adult fiction",
    "erotica stories",
    "romance stories",
    "fantasy erotica",
    "free adult stories",
    "online fiction",
  ],
  openGraph: {
    title: "LustPages — Premium Adult Fiction",
    description:
      "Discover thousands of premium adult fiction stories across romance, fantasy, and more. Free to read.",
    type: "website",
    siteName: "LustPages",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "LustPages — Premium Adult Fiction",
    description:
      "Discover thousands of premium adult fiction stories. Free to read.",
  },
  alternates: { canonical: siteUrl },
};

export default async function HomePage() {
  // Batch 1: above-the-fold content
  const [featuredStoryPromos, featuredSeriesPromos, latestStories, latestSeries] = await Promise.all([
    getFeaturedPromotions("story").catch(() => [] as Awaited<ReturnType<typeof getFeaturedPromotions>>),
    getFeaturedPromotions("series").catch(() => [] as Awaited<ReturnType<typeof getFeaturedPromotions>>),
    getLatestStories(10).catch(() => []),
    getLatestSeries(10).catch(() => []),
  ]);

  // Batch 2: below-the-fold content
  const [premiumStories, categoriesWithStories, authors, trendingStories, publicStats] = await Promise.all([
    getPremiumStories(20).catch(() => []),
    getCachedCategoriesWithStories().catch(() => []),
    getSpotlightAuthors(4).catch(() => []),
    getTrendingStories(10).catch(() => []),
    getCachedPublicStats().catch(() => ({ publishedStories: 0, totalUsers: 0 })),
  ]);

  const spotlightAuthors = authors;

  const jsonLdWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LustPages",
    alternateName: "Lust Pages",
    url: siteUrl,
    description: "Premium adult fiction and erotica stories across multiple genres.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/stories?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LustPages",
    alternateName: "Lust Pages",
    url: siteUrl,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden flex items-center"
        style={{ minHeight: "90vh" }}
        aria-labelledby="hero-heading"
      >
        {/* Primary crown glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 110% 65% at 50% -8%, rgba(196,66,106,0.32) 0%, transparent 60%)",
          }}
          aria-hidden="true"
        />
        {/* Secondary ambient glow — bottom-left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at -5% 85%, rgba(196,66,106,0.10) 0%, transparent 60%)",
          }}
          aria-hidden="true"
        />
        {/* Tertiary accent — bottom-right */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 45% 40% at 105% 90%, rgba(168,49,90,0.08) 0%, transparent 60%)",
          }}
          aria-hidden="true"
        />
        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent, var(--background))",
          }}
          aria-hidden="true"
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-28 sm:py-36 relative w-full text-center">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{
                background: "rgba(196,66,106,0.12)",
                color: "#c4426a",
                border: "1px solid rgba(196,66,106,0.28)",
                boxShadow: "0 0 20px rgba(196,66,106,0.12)",
              }}
            >
              <Sparkles size={11} />
              Premium Adult Fiction
            </div>
          </div>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="font-bold leading-[1.06] mb-6 mx-auto"
            style={{
              fontFamily: "var(--font-playfair), serif",
              color: "var(--foreground)",
              fontSize: "clamp(2.6rem, 6.5vw, 5.25rem)",
              letterSpacing: "-0.025em",
              maxWidth: "860px",
            }}
          >
            Stories That{" "}
            <em
              className="not-italic"
              style={{
                background:
                  "linear-gradient(135deg, #e8547a 0%, #c4426a 45%, #a8315a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Ignite
            </em>{" "}
            Your Imagination
          </h1>

          {/* Ornamental divider */}
          <div
            className="flex items-center justify-center gap-3 mb-7"
            aria-hidden="true"
          >
            <div
              style={{
                width: "64px",
                height: "1px",
                background:
                  "linear-gradient(to right, transparent, rgba(196,66,106,0.45))",
              }}
            />
            <div
              style={{
                width: "5px",
                height: "5px",
                background: "#c4426a",
                transform: "rotate(45deg)",
                opacity: 0.7,
              }}
            />
            <div
              style={{
                width: "64px",
                height: "1px",
                background:
                  "linear-gradient(to left, transparent, rgba(196,66,106,0.45))",
              }}
            />
          </div>

          <p
            className="text-base sm:text-lg mb-10 max-w-lg mx-auto leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            Thousands of premium adult fiction stories — romance, fantasy,
            contemporary, and more. Written by talented authors. Completely free
            to read.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <Link
              href="/stories"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] text-sm sm:text-base"
              style={{
                background: "linear-gradient(135deg, #d44d77 0%, #a8315a 100%)",
                boxShadow:
                  "0 0 32px rgba(196,66,106,0.40), 0 4px 16px rgba(196,66,106,0.28)",
              }}
            >
              <BookOpen size={17} />
              Start Reading Free
            </Link>
            <HeroJoinButton />
          </div>

          {/* Trust strip */}
          <div
            className="flex items-center justify-center flex-wrap gap-x-5 gap-y-1.5 text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            {["100% Free Forever", "New Stories Daily", "No Credit Card"].map(
              (item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span style={{ color: "#c4426a", fontWeight: 700 }}>✓</span>
                  {item}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURED STORIES carousel ──────────────────────────── */}
      {featuredStoryPromos.length > 0 && (
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <FeaturedCarousel promotions={featuredStoryPromos} variant="story" />
        </div>
      )}

      {/* ── FEATURED SERIES carousel ───────────────────────────── */}
      {featuredSeriesPromos.length > 0 && (
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <FeaturedCarousel promotions={featuredSeriesPromos} variant="series" />
        </div>
      )}

      {/* ── PREMIUM CONTENT carousel ───────────────────────────── */}
      {premiumStories.length > 0 && (
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <PremiumCarousel stories={premiumStories} />
        </div>
      )}

      {/* ── STATS BAR ──────────────────────────────────────────── */}
      <div
        role="complementary"
        aria-label="Site statistics"
        style={{
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { value: publicStats.publishedStories >= 500 ? formatStatCount(publicStats.publishedStories) : "500+", label: "Stories Published", icon: <BookOpen size={14} /> },
              { value: publicStats.totalUsers >= 1000 ? formatStatCount(publicStats.totalUsers) : "1K+", label: "Members", icon: <Users size={14} /> },
              { value: String(categoriesWithStories.length), label: "Genres", icon: <Flame size={14} /> },
              { value: "100%", label: "Free to Read", icon: <Eye size={14} /> },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col items-center gap-1 px-4${i === 0 ? "" : i % 2 === 0 ? " sm:border-l" : " border-l"}`}
              >
                <div
                  className="text-2xl sm:text-3xl font-bold"
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    color: "#c4426a",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {stat.icon}
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AD: Top Banner ─────────────────────────────────────── */}
      <AdSlot identifier="homepage_top_banner" className="max-w-7xl mx-auto px-4 sm:px-6" />

      {/* ── LATEST STORIES carousel ────────────────────────────── */}
      {latestStories.length > 0 && (
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <LatestCarousel variant="story" items={latestStories} />
        </div>
      )}

      {/* ── LATEST SERIES carousel ─────────────────────────────── */}
      {latestSeries.length > 0 && (
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <LatestCarousel variant="series" items={latestSeries} />
        </div>
      )}

      {/* ── TRENDING THIS WEEK ─────────────────────────────────── */}
      {trendingStories.length > 0 && (
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <HomeTrendingSection stories={trendingStories} />
        </div>
      )}

      {/* ── CURATED COLLECTIONS ──────────────────────────────── */}
      <HomeCollectionsSection />

      {/* ── AD: Mid Banner ─────────────────────────────────────── */}
      <AdSlot identifier="homepage_mid_banner" className="max-w-7xl mx-auto px-4 sm:px-6" />

      {/* ── CATEGORY SECTIONS ──────────────────────────────────── */}
      {categoriesWithStories.map((category) => (
        <div key={category.id} style={{ borderBottom: "1px solid var(--border)" }}>
          <CategoryCarousel category={category} />
        </div>
      ))}

      {/* ── AUTHOR SPOTLIGHT ───────────────────────────────────── */}
      {spotlightAuthors.length > 0 && (
        <div style={{ borderBottom: "1px solid var(--border)" }}>
        <section
          className="py-10 sm:py-14"
          aria-labelledby="authors-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div
                  className="p-2 rounded-xl shrink-0"
                  style={{ background: "rgba(196,66,106,0.12)" }}
                >
                  <PenSquare size={18} style={{ color: "#c4426a" }} />
                </div>
                <div>
                  <h2
                    id="authors-heading"
                    className="text-xl sm:text-2xl font-bold leading-tight"
                    style={{
                      fontFamily: "var(--font-playfair), serif",
                      color: "var(--foreground)",
                    }}
                  >
                    Meet the Authors
                  </h2>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Passionate writers crafting your fantasies
                  </p>
                </div>
              </div>
              <Link
                href="/authors"
                className="text-xs font-semibold mr-1 transition-opacity hover:opacity-70 hidden sm:block"
                style={{ color: "#c4426a" }}
                aria-label="View all authors"
              >
                All Authors
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {spotlightAuthors.map((author) => (
                <Link
                  key={author.id}
                  href={`/authors/${author.slug}`}
                  className="group flex flex-col items-center text-center p-5 sm:p-7 rounded-2xl transition-all duration-200 hover:translate-y-[-3px]"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold mb-4 shrink-0 group-hover:scale-105 transition-transform duration-300"
                    style={{
                      background: "rgba(196,66,106,0.15)",
                      color: "#c4426a",
                      fontFamily: "var(--font-playfair), serif",
                      border: "2px solid rgba(196,66,106,0.25)",
                    }}
                  >
                    {author.name[0].toUpperCase()}
                  </div>
                  <h3
                    className="font-bold text-sm sm:text-base mb-1 line-clamp-1 group-hover:opacity-80 transition-opacity"
                    style={{
                      color: "var(--foreground)",
                      fontFamily: "var(--font-playfair), serif",
                    }}
                  >
                    {author.name}
                  </h3>
                  <p
                    className="text-xs flex items-center gap-1"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    <Star size={10} style={{ color: "#c4426a" }} />
                    {author._count.stories}{" "}
                    {author._count.stories === 1 ? "story" : "stories"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
        </div>
      )}

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        aria-labelledby="cta-heading"
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(196,66,106,0.11) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center relative">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 uppercase tracking-widest"
            style={{
              background: "rgba(196,66,106,0.15)",
              color: "#c4426a",
              border: "1px solid rgba(196,66,106,0.3)",
            }}
          >
            <Users size={11} />
            Free Forever
          </div>

          <HomeBottomCTA />
        </div>
      </section>
    </>
  );
}
