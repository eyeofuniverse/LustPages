import { notFound } from "next/navigation";
import Link from "next/link";
import { getStoryBySlug, getStoryRecommendations, incrementViews, getStoryUnlock, getSeriesUnlock, getUserCoinBalance } from "@/lib/queries";
import { auth } from "@/auth";
import { formatDate, getTags, getTextPreview } from "@/lib/utils";
import { StoryCard } from "@/components/story/StoryCard";
import { StoryActions } from "@/components/story/StoryActions";
import { StoryRating } from "@/components/story/StoryRating";
import { ReportButton } from "@/components/story/ReportButton";
import { CommentSection } from "@/components/story/CommentSection";
import { AdSlot } from "@/components/ads/AdSlot";
import { UnlockGate } from "@/components/coins/UnlockGate";
import { SeriesUnlockGate } from "@/components/coins/SeriesUnlockGate";
import { TipModal } from "@/components/coins/TipModal";
import { SeriesNav } from "@/components/story/SeriesNav";
import { ReadingProgressTracker } from "@/components/story/ReadingProgressTracker";
import { SafeImage } from "@/components/ui/SafeImage";
import { ShareButtons } from "@/components/story/ShareButtons";
import { Clock, Calendar, ArrowLeft, Tag, PenLine } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return { title: "Story Not Found" };

  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lustpages.com";

  return {
    title: story.title,
    description: story.excerpt,
    keywords: [
      ...getTags(story.tags),
      ...story.categories.map((c) => c.name),
      "erotica",
      "adult fiction",
    ],
    alternates: { canonical: `${siteUrl}/stories/${slug}` },
    openGraph: {
      title: story.title,
      description: story.excerpt,
      type: "article",
      siteName: "LustPages",
      publishedTime: story.createdAt.toISOString(),
      modifiedTime: story.updatedAt.toISOString(),
      authors: [story.author.name],
      tags: getTags(story.tags),
      url: `${siteUrl}/stories/${slug}`,
      ...(story.coverImage && {
        images: [{ url: story.coverImage, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description: story.excerpt,
    },
  };
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const [story, session] = await Promise.all([
    getStoryBySlug(slug),
    auth(),
  ]);

  if (!story) notFound();

  const userId = session?.user?.id;
  const tags = getTags(story.tags);
  const tagNames = story.storyTags.map((t) => t.name);
  const categoryIds = story.categories.map((c) => c.id);

  // Series-aware access logic
  const seriesInfo = story.seriesInfo;
  const inSeries = !!seriesInfo;
  const seriesPremium = inSeries && !!seriesInfo.isPremium && !!seriesInfo.coinPrice;
  const freeChapters = seriesInfo?.freeChapters ?? 1;
  const chapterNum = story.chapterNumber ?? 1;
  const isFreeChapter = seriesPremium && chapterNum <= freeChapters;

  // A story is premium if:
  // - In a premium series AND beyond the free chapter threshold, OR
  // - Standalone with a coin price set
  const isPremium = inSeries ? (seriesPremium && !isFreeChapter) : !!story.coinPrice;

  const [recommendations, unlock, userBalance] = await Promise.all([
    getStoryRecommendations(story.id, tagNames, categoryIds, 6),
    isPremium && userId
      ? (seriesPremium
          ? getSeriesUnlock(userId, seriesInfo!.id)
          : getStoryUnlock(userId, story.id))
      : Promise.resolve(null),
    userId ? getUserCoinBalance(userId) : Promise.resolve(0),
    incrementViews(story.id),
  ]);

  const isUnlocked = !isPremium || !!unlock;
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lustpages.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/stories/${story.slug}`,
    },
    headline: story.title,
    description: story.excerpt,
    image: story.coverImage
      ? [story.coverImage]
      : [`${siteUrl}/og-default.jpg`],
    author: {
      "@type": "Person",
      name: story.author.name,
      url: `${siteUrl}/authors/${story.author.slug}`,
    },
    publisher: {
      "@type": "Organization",
      name: "LustPages",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icon.png`,
      },
    },
    datePublished: story.createdAt.toISOString(),
    dateModified: story.updatedAt.toISOString(),
    url: `${siteUrl}/stories/${story.slug}`,
    inLanguage: "en",
    articleSection: story.categories[0]?.name,
    genre: story.categories.map((c) => c.name),
    keywords: tags.join(", "),
    timeRequired: `PT${story.readingTime}M`,
    wordCount: story.readingTime * 200,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ReadAction",
        userInteractionCount: story.views,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: story._count.likes,
      },
    ],
  };

  return (
    <>
      <ReadingProgressTracker slug={slug} storyId={story.id} userId={userId} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <Link
          href="/stories"
          className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-75"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={15} /> Back to Stories
        </Link>

        {/* Cover Image */}
        {story.coverImage && (
          <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden mb-8 relative" style={{ background: "var(--muted)" }}>
            <SafeImage
              src={story.coverImage}
              alt={story.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {story.categories.map((cat) => (
              <Link
                key={cat.id ?? cat.slug}
                href={`/categories/${cat.slug}`}
                className="px-3 py-1 rounded-full text-sm font-semibold transition-opacity hover:opacity-75"
                style={{
                  background: cat.color + "22",
                  color: cat.color,
                  border: `1px solid ${cat.color}44`,
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{
              fontFamily: "var(--font-playfair), serif",
              color: "var(--foreground)",
            }}
          >
            {story.title}
          </h1>

          <p className="text-lg leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
            {story.excerpt}
          </p>

          <div
            className="flex flex-wrap items-center gap-5 py-4 text-sm"
            style={{
              borderTop: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            <Link
              href={`/authors/${story.author.slug}`}
              className="font-semibold transition-opacity hover:opacity-75"
              style={{ color: "var(--foreground)" }}
            >
              By {story.author.name}
            </Link>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> {formatDate(story.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> {story.readingTime} min read
            </span>
          </div>

          <div className="pt-4">
            <ShareButtons
              url={`${siteUrl}/stories/${story.slug}`}
              title={story.title}
              variant="header"
            />
          </div>
        </header>

        {/* Story Actions (like, bookmark) + Star Rating */}
        <div className="flex flex-wrap items-start gap-4">
          <StoryActions
            storyId={story.id}
            likeCount={story._count.likes}
            bookmarkCount={story._count.bookmarks}
            userId={session?.user?.id}
          />
          <StoryRating
            storyId={story.id}
            avgRating={story.ratingAvg}
            ratingCount={story.ratingCount}
            userId={session?.user?.id}
          />
        </div>

        {/* Series navigation */}
        {story.seriesInfo && story.seriesInfo.stories.length > 0 && (
          <SeriesNav
            series={story.seriesInfo}
            currentStoryId={story.id}
            currentChapter={story.chapterNumber}
          />
        )}

        {/* Ad: before content */}
        <AdSlot identifier="story_detail_before_content" />

        {/* Content — gated if premium and not unlocked */}
        {isUnlocked ? (
          <div className="my-10 prose-story mx-auto">
            <div dangerouslySetInnerHTML={{ __html: story.content }} />
          </div>
        ) : (
          <div className="my-10">
            {/* Server-truncated preview — full HTML never sent to client */}
            <div
              className="prose-story mx-auto text-sm leading-relaxed"
              style={{
                maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                maxHeight: "12rem",
                overflow: "hidden",
                color: "var(--muted-foreground)",
              }}
            >
              <p>{getTextPreview(story.content, 120)}</p>
            </div>
            {seriesPremium ? (
              <SeriesUnlockGate
                seriesId={seriesInfo!.id}
                seriesSlug={seriesInfo!.slug}
                seriesName={seriesInfo!.name}
                coinPrice={seriesInfo!.coinPrice!}
                freeChapters={freeChapters}
                chapterNumber={chapterNum}
                userBalance={userBalance}
                isLoggedIn={!!userId}
              />
            ) : (
              <UnlockGate
                storyId={story.id}
                coinPrice={story.coinPrice!}
                userBalance={userBalance}
                isLoggedIn={!!userId}
              />
            )}
          </div>
        )}

        {/* Story Actions (bottom) */}
        {isUnlocked && (
          <div className="mt-8 mb-4">
            <div className="flex flex-wrap items-start gap-4">
              <StoryActions
                storyId={story.id}
                likeCount={story._count.likes}
                bookmarkCount={story._count.bookmarks}
                userId={session?.user?.id}
              />
              <StoryRating
                storyId={story.id}
                avgRating={story.ratingAvg}
                ratingCount={story.ratingCount}
                userId={session?.user?.id}
              />
            </div>
            <div className="flex justify-end">
              <ReportButton storyId={story.id} isLoggedIn={!!userId} />
            </div>
          </div>
        )}

        {/* Bottom share bar — always visible so even locked-content readers can share */}
        <div
          className="mt-6 mb-2 py-4 flex flex-wrap items-center gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-sm font-semibold mr-1" style={{ color: "var(--foreground)" }}>
            Enjoyed this story?
          </p>
          <ShareButtons
            url={`${siteUrl}/stories/${story.slug}`}
            title={story.title}
            variant="footer"
          />
        </div>

        {/* Author note */}
        {story.authorNote && (
          <div
            className="mt-6 p-5 rounded-2xl"
            style={{
              background: "rgba(196,66,106,0.04)",
              border: "1px solid rgba(196,66,106,0.18)",
              borderLeft: "3px solid #c4426a",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <PenLine size={14} style={{ color: "#c4426a" }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4426a" }}>
                From the Author
              </span>
            </div>
            <p className="text-sm leading-relaxed italic" style={{ color: "var(--muted-foreground)" }}>
              {story.authorNote}
            </p>
          </div>
        )}

        {/* Ad: after content */}
        <AdSlot identifier="story_detail_after_content" />

        {/* Recommendations */}
        {(recommendations.collaborative || recommendations.tagBased.length > 0) && (
          <div className="mt-12 pt-10" style={{ borderTop: "1px solid var(--border)" }}>
            {recommendations.collaborative && (
              <div className="mb-10">
                <h2
                  className="text-xl font-bold mb-5"
                  style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                >
                  Readers also liked
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.collaborative.map((s) => (
                    <StoryCard key={s.id} story={s} />
                  ))}
                </div>
              </div>
            )}
            {recommendations.tagBased.length > 0 && (
              <div>
                <h2
                  className="text-xl font-bold mb-5"
                  style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                >
                  More like this
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.tagBased.map((s) => (
                    <StoryCard key={s.id} story={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
            <Tag size={14} style={{ color: "var(--muted-foreground)" }} className="mt-0.5" />
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="px-3 py-1 rounded-full text-sm transition-all hover:opacity-75"
                style={{
                  background: "var(--muted)",
                  color: "var(--muted-foreground)",
                }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Author bio */}
        <div
          className="mt-10 p-6 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              style={{
                background: "rgba(196,66,106,0.15)",
                color: "#c4426a",
                fontFamily: "var(--font-playfair), serif",
              }}
            >
              {story.author.name[0]}
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                Written by
              </p>
              <Link
                href={`/authors/${story.author.slug}`}
                className="font-bold text-lg transition-opacity hover:opacity-75"
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  color: "var(--foreground)",
                }}
              >
                {story.author.name}
              </Link>
              {story.author.bio && (
                <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {story.author.bio}
                </p>
              )}
              <div className="mt-3">
                <TipModal
                  authorId={story.author.id}
                  authorName={story.author.name}
                  storyId={story.id}
                  userBalance={userBalance}
                  isLoggedIn={!!userId}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <CommentSection
          storyId={story.id}
          comments={story.comments}
          userId={session?.user?.id}
          storyAuthorUserId={story.author.userId}
          isAdmin={(session?.user as { role?: string })?.role === "admin"}
        />
      </article>

    </>
  );
}
