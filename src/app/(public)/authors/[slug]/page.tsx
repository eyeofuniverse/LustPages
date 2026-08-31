// Author pages are permanently cached; revalidatePath("/authors/[slug]") busts on profile update.
export const revalidate = false;

import { notFound } from "next/navigation";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { getCachedAuthorBySlug, getCachedAuthorStories, getCachedSimilarAuthors } from "@/lib/cached-queries";
import { prisma } from "@/lib/prisma";
import { StoryCard } from "@/components/story/StoryCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { AuthorLikeButton } from "@/components/story/AuthorLikeButton";
import { UserBadges, EarnedBadgeStrip } from "@/components/badges/UserBadges";
import { auth } from "@/auth";
import {
  BookOpen,
  Globe,
  Eye,
  Heart,
  ArrowLeft,
  BookMarked,
  Calendar,
  Users,
  Award,
} from "lucide-react";
import { AuthorBadge, isFeaturedAuthor } from "@/components/author/AuthorBadge";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await getCachedAuthorBySlug(slug);
  if (!author) return { title: "Author Not Found" };

  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lustpages.com";
  const featured = isFeaturedAuthor(author._count.stories, author.totalLikes);
  const desc =
    author.bio ??
    `Read ${author._count.stories} published stories by ${author.name} on LustPages — free adult fiction.`;
  return {
    title: featured
      ? `${author.name} ★ Featured Author — LustPages`
      : `${author.name} — Author on LustPages`,
    description: desc,
    keywords: [`${author.name}`, `${author.name} erotica`, `${author.name} stories`, "lustpages author", "adult fiction author"],
    alternates: { canonical: `${siteUrl}/authors/${slug}` },
    openGraph: {
      title: `${author.name} — Author on LustPages`,
      description: desc,
      type: "profile",
      url: `${siteUrl}/authors/${slug}`,
      images: author.image
        ? [{ url: author.image }]
        : [{ url: `${siteUrl}/og-default.jpg`, width: 1200, height: 630 }],
    },
    twitter: {
      card: author.image ? "summary" : "summary_large_image",
      title: `${author.name} — Author on LustPages`,
      description: desc,
      images: [author.image ?? `${siteUrl}/og-default.jpg`],
    },
  };
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const [author, stories, session] = await Promise.all([
    getCachedAuthorBySlug(slug),
    getCachedAuthorStories(slug),
    auth(),
  ]);

  if (!author) notFound();

  const [similarAuthors, authorBadges] = await Promise.all([
    getCachedSimilarAuthors(author.id),
    author.userId
      ? prisma.userBadge.findMany({
          where: { userId: author.userId },
          select: { badgeId: true, awardedAt: true },
          orderBy: { awardedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const hasSeries = author.seriesList && author.seriesList.length > 0;
  const featured = isFeaturedAuthor(author._count.stories, author.totalLikes);
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lustpages.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: `${siteUrl}/authors/${slug}`,
    ...(author.bio && { description: author.bio }),
    ...(author.image && { image: author.image }),
    ...(author.website && { sameAs: [author.website] }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Hero / profile header ────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: featured
            ? "linear-gradient(180deg, rgba(245,158,11,0.08) 0%, rgba(196,66,106,0.06) 50%, var(--background) 100%)"
            : "linear-gradient(180deg, rgba(196,66,106,0.10) 0%, var(--background) 100%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Glow orb */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(196,66,106,0.2) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 relative">
          {/* Back link */}
          <Link
            href="/authors"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-75"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={14} /> All Authors
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7">
            {/* Avatar */}
            <div className="relative shrink-0">
              {author.image ? (
                <div
                  className="w-28 h-28 rounded-2xl overflow-hidden relative"
                  style={{ border: "3px solid rgba(196,66,106,0.3)" }}
                >
                  <SafeImage
                    src={author.image}
                    alt={author.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div
                  className="w-28 h-28 rounded-2xl flex items-center justify-center text-5xl font-bold"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, rgba(196,66,106,0.4), rgba(196,66,106,0.12))",
                    color: "#c4426a",
                    fontFamily: "var(--font-playfair), serif",
                    border: "3px solid rgba(196,66,106,0.25)",
                  }}
                >
                  {(author.name?.[0] ?? "?").toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                <h1
                  className="text-3xl sm:text-4xl font-bold leading-tight"
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    color: "var(--foreground)",
                  }}
                >
                  {author.name}
                </h1>
                <AuthorBadge storyCount={author._count.stories} totalLikes={author.totalLikes} size="md" />
              </div>

              {author.bio && (
                <p
                  className="text-base leading-relaxed mb-5 max-w-2xl"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {author.bio}
                </p>
              )}

              {/* Meta links */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
                <span
                  className="flex items-center gap-1.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <Calendar size={13} />
                  Joined{" "}
                  {new Date(author.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {author.website && (
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 transition-opacity hover:opacity-75"
                    style={{ color: "#c4426a" }}
                  >
                    <Globe size={13} /> Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div
            className="grid grid-cols-3 mt-10 rounded-2xl overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {[
              { icon: BookOpen, value: String(author._count.stories), label: "Stories" },
              { icon: Heart, value: fmt(author.totalLikes), label: "Story Likes" },
              { icon: Users, value: fmt(author._count.likes), label: "Followers" },
            ].map(({ icon: Icon, value, label }, i) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center py-5"
                style={i > 0 ? { borderLeft: "1px solid var(--border)" } : undefined}
              >
                <Icon size={16} className="mb-1.5" style={{ color: "#c4426a" }} />
                <span
                  className="text-2xl font-bold mb-0.5"
                  style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                >
                  {value}
                </span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Badges + follow in one responsive row */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <EarnedBadgeStrip earned={authorBadges} max={8} />
            <AuthorLikeButton
              authorId={author.id}
              likeCount={author._count.likes}
              isLoggedIn={!!session?.user?.id}
            />
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <AdSlot identifier="author_profile_banner" />

        {/* Author Badges */}
        <div
          className="p-5 rounded-2xl mb-8"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-base font-bold flex items-center gap-2"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              <Award size={16} style={{ color: "#c4426a" }} />
              Achievements
            </h2>
            {authorBadges.length > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}>
                {authorBadges.length} earned
              </span>
            )}
          </div>
          <UserBadges earned={authorBadges} category="author" showLocked={false} />
        </div>

        {/* Series section */}
        {hasSeries && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <BookMarked size={18} style={{ color: "#c4426a" }} />
              <h2
                className="text-xl font-bold"
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  color: "var(--foreground)",
                }}
              >
                Series
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {author.seriesList.map((series) => (
                <Link
                  key={series.id}
                  href={`/series/${series.slug}`}
                  className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:translate-y-[-1px]"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(196,66,106,0.12)" }}
                  >
                    <BookOpen size={16} style={{ color: "#c4426a" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm truncate"
                      style={{ color: "var(--foreground)" }}
                    >
                      {series.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {series._count.stories}{" "}
                      {series._count.stories === 1 ? "part" : "parts"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stories */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-bold"
            style={{
              fontFamily: "var(--font-playfair), serif",
              color: "var(--foreground)",
            }}
          >
            Stories by {author.name}
          </h2>
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {stories.length} published
          </span>
        </div>

        {stories.length === 0 ? (
          <div
            className="text-center py-20 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <BookOpen
              size={36}
              className="mx-auto mb-3 opacity-30"
              style={{ color: "var(--muted-foreground)" }}
            />
            <p
              className="text-lg font-medium"
              style={{
                fontFamily: "var(--font-playfair), serif",
                color: "var(--foreground)",
              }}
            >
              No published stories yet
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              Check back soon
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}

        {/* ── Authors You Might Like ────────────────────────────────── */}
        {similarAuthors.length > 0 && (
          <div className="mt-16 pt-10" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 rounded-xl shrink-0" style={{ background: "rgba(196,66,106,0.12)" }}>
                <Users size={18} style={{ color: "#c4426a" }} />
              </div>
              <div>
                <h2
                  className="text-xl font-bold leading-tight"
                  style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                >
                  Authors You Might Like
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  Writers in similar genres to {author.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarAuthors.map((similar) => (
                <Link
                  key={similar.id}
                  href={`/authors/${similar.slug}`}
                  className="group flex flex-col items-center text-center p-5 rounded-2xl transition-all duration-200 hover:translate-y-[-2px]"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  {similar.image ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden relative mb-3 shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <SafeImage
                        src={similar.image}
                        alt={similar.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 shrink-0 group-hover:scale-105 transition-transform duration-300"
                      style={{
                        background: "radial-gradient(circle at 30% 30%, rgba(196,66,106,0.35), rgba(196,66,106,0.12))",
                        color: "#c4426a",
                        fontFamily: "var(--font-playfair), serif",
                        border: "2px solid rgba(196,66,106,0.25)",
                      }}
                    >
                      {(similar.name?.[0] ?? "?").toUpperCase()}
                    </div>
                  )}
                  <h3
                    className="font-bold text-sm mb-1 group-hover:opacity-75 transition-opacity line-clamp-1"
                    style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                  >
                    {similar.name}
                  </h3>
                  {similar.bio && (
                    <p className="text-xs line-clamp-2 mb-2" style={{ color: "var(--muted-foreground)" }}>
                      {similar.bio}
                    </p>
                  )}
                  <p className="text-xs mt-auto" style={{ color: "var(--muted-foreground)" }}>
                    <span style={{ color: "#c4426a", fontWeight: 600 }}>{similar._count.stories}</span>{" "}
                    {similar._count.stories === 1 ? "story" : "stories"}
                  </p>
                  <AuthorBadge storyCount={similar._count.stories} totalLikes={similar.totalLikes} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
