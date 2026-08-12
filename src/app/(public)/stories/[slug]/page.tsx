import { notFound } from "next/navigation";
import Link from "next/link";
import { getStoryUnlock, getSeriesUnlock, getUserCoinBalance, getStoryComments } from "@/lib/queries";
import { getCachedStoryBySlug, getCachedStoryRecommendations } from "@/lib/cached-queries";
import { auth } from "@/auth";
import { formatDate, getTextPreview, countWords, splitHtmlAtParagraph } from "@/lib/utils";
import { sanitizeStoryContent } from "@/lib/sanitize";
import { RecsCarousel } from "@/components/story/RecsCarousel";
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
import { ViewTracker } from "@/components/story/ViewTracker";
import { SafeImage } from "@/components/ui/SafeImage";
import { ShareButtons } from "@/components/story/ShareButtons";
import { StoryEndRatingNudge } from "@/components/story/StoryEndRatingNudge";
import { StickyAdSidebar } from "@/components/ads/StickyAdSidebar";
import { Clock, Calendar, ArrowLeft, Tag, PenLine } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getCachedStoryBySlug(slug);
  if (!story) return { title: "Story Not Found" };

  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lustpages.com";

  const ogCover = story.seriesInfo?.coverImage ?? story.coverImage;
  const metaTitle = story.metaTitle || story.title;
  const metaDesc = story.metaDescription || story.excerpt;

  return {
    title: metaTitle,
    description: metaDesc,
    keywords: [
      ...story.storyTags.map((t) => t.name),
      ...story.categories.map((c) => c.name),
      "erotica",
      "adult fiction",
    ],
    alternates: { canonical: story.canonicalUrl || `${siteUrl}/stories/${slug}` },
    ...(story.noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      type: "article",
      siteName: "LustPages",
      publishedTime: new Date(story.createdAt).toISOString(),
      modifiedTime: new Date(story.updatedAt).toISOString(),
      authors: [story.author.name],
      tags: story.storyTags.map((t) => t.name),
      url: `${siteUrl}/stories/${slug}`,
      ...(ogCover && {
        images: [{ url: ogCover, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDesc,
      ...(ogCover && { images: [ogCover] }),
    },
  };
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const [storyData, session] = await Promise.all([
    getCachedStoryBySlug(slug),
    auth(),
  ]);

  if (!storyData) notFound();

  const userId = session?.user?.id;
  const tags = storyData.storyTags;
  const tagNames = tags.map((t) => t.name);
  const categoryIds = storyData.categories.map((c) => c.id);

  // Series-aware access logic
  const seriesInfo = storyData.seriesInfo;
  const inSeries = !!seriesInfo;
  const seriesPremium = inSeries && !!seriesInfo.isPremium && !!seriesInfo.coinPrice;
  const freeChapters = seriesInfo?.freeChapters ?? 1;
  const chapterNum = storyData.chapterNumber ?? 1;
  const isFreeChapter = seriesPremium && chapterNum <= freeChapters;

  // A story is premium if:
  // - In a premium series AND beyond the free chapter threshold, OR
  // - Standalone with a coin price set
  const isPremium = inSeries ? (seriesPremium && !isFreeChapter) : !!storyData.coinPrice;

  // Fresh comments fetched on every request; everything else served from cache.
  const [freshComments, recommendations, unlock, userBalance] = await Promise.all([
    getStoryComments(storyData.id),
    getCachedStoryRecommendations(storyData.id, tagNames, categoryIds),
    isPremium && userId
      ? (seriesPremium
          ? getSeriesUnlock(userId, seriesInfo!.id)
          : getStoryUnlock(userId, storyData.id))
      : Promise.resolve(null),
    userId ? getUserCoinBalance(userId) : Promise.resolve(0),
  ]);

  // Merge cached story data with live comments
  const story = { ...storyData, comments: freshComments };

  const isUnlocked = !isPremium || !!unlock;
  // Effective cover: series cover takes priority when story is in a series
  const coverImage = storyData.seriesInfo?.coverImage ?? storyData.coverImage;
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
    image: coverImage
      ? [coverImage]
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
    datePublished: new Date(story.createdAt).toISOString(),
    dateModified: new Date(story.updatedAt).toISOString(),
    url: `${siteUrl}/stories/${story.slug}`,
    inLanguage: "en",
    articleSection: story.categories[0]?.name,
    genre: story.categories.map((c) => c.name),
    keywords: tagNames.join(", "),
    timeRequired: `PT${story.readingTime}M`,
    wordCount: countWords(story.content),
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
      <ViewTracker storyId={story.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="xl:flex xl:gap-8">
          <article className="min-w-0 flex-1 max-w-4xl mx-auto xl:mx-0">
        {/* Back */}
        <Link
          href="/stories"
          className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-75"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={15} /> Back to Stories
        </Link>

        {/* Hero — unified cover + meta card */}
        <div
          className="relative mb-10 rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {/* Blurred atmospheric backdrop */}
          {coverImage && (
            <>
              <div
                className="absolute inset-0"
                aria-hidden
                style={{ filter: "blur(32px)", transform: "scale(1.15)", opacity: 0.2 }}
              >
                <SafeImage src={coverImage} alt="" fill className="object-cover" />
              </div>
              <div
                className="absolute inset-0"
                aria-hidden
                style={{ background: "linear-gradient(135deg, var(--card) 0%, transparent 60%, var(--card) 100%)" }}
              />
            </>
          )}

          <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8 p-6 sm:p-8">
            {/* Portrait cover — shown at natural proportions, no crop */}
            {coverImage && (
              <div className="shrink-0 mx-auto sm:mx-0 sm:self-start">
                <div
                  className="rounded-xl overflow-hidden relative"
                  style={{
                    width: 120,
                    height: 180,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)",
                  }}
                >
                  <SafeImage
                    src={coverImage}
                    alt={story.title}
                    fill
                    priority
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="flex-1 min-w-0">
              {/* Category pills */}
              {story.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {story.categories.map((cat) => (
                    <Link
                      key={cat.id ?? cat.slug}
                      href={`/categories/${cat.slug}`}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-75"
                      style={{ background: cat.color + "22", color: cat.color, border: `1px solid ${cat.color}44` }}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
              >
                {story.title}
              </h1>

              {/* Excerpt */}
              <p className="text-base leading-relaxed mb-4" style={{ color: "var(--muted-foreground)", maxWidth: "52ch" }}>
                {story.excerpt}
              </p>

              {/* Meta row */}
              <div
                className="flex flex-wrap items-center gap-3 sm:gap-5 py-3 text-sm"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "var(--muted-foreground)" }}
              >
                <Link
                  href={`/authors/${story.author.slug}`}
                  className="font-semibold transition-opacity hover:opacity-75"
                  style={{ color: "var(--foreground)" }}
                >
                  By {story.author.name}
                </Link>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> {formatDate(story.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> {story.readingTime} min read
                </span>
              </div>

              {/* Share */}
              <div className="pt-3">
                <ShareButtons
                  url={`${siteUrl}/stories/${story.slug}`}
                  title={story.title}
                  variant="header"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Story Actions (like, bookmark) + Star Rating */}
        <div className="flex flex-wrap items-center gap-3 mb-2">
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

        {/* Ad: above story content */}
        <AdSlot identifier="story_detail_before_content" />

        {/* Content — gated if premium and not unlocked */}
        {isUnlocked ? (() => {
          const sanitized = sanitizeStoryContent(story.content);
          const [first, second] = splitHtmlAtParagraph(sanitized, 0.65, 400);
          return (
            <div
              className="my-8 rounded-2xl px-5 sm:px-8 py-8"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="prose-story mx-auto">
                <div dangerouslySetInnerHTML={{ __html: first }} />
              </div>
              {second && (
                <>
                  <AdSlot identifier="story_detail_mid_content" />
                  <div className="prose-story mx-auto">
                    <div dangerouslySetInnerHTML={{ __html: second }} />
                  </div>
                </>
              )}
            </div>
          );
        })() : (
          <div className="my-8">
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
            <AdSlot identifier="story_detail_gate_bottom" />
          </div>
        )}

        {/* Story-end rating nudge — sentinel fires when user scrolls past story content */}
        <StoryEndRatingNudge
          storyId={story.id}
          isLoggedIn={!!userId}
          isUnlocked={isUnlocked}
          avgRating={story.ratingAvg}
          ratingCount={story.ratingCount}
        />

        {/* Story Actions (bottom) */}
        {isUnlocked && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-3">
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
            <ReportButton storyId={story.id} isLoggedIn={!!userId} />
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
                <RecsCarousel title="Readers also liked" stories={recommendations.collaborative} />
              </div>
            )}
            {recommendations.tagBased.length > 0 && (
              <RecsCarousel title="More like this" stories={recommendations.tagBased} />
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
            <Tag size={14} style={{ color: "var(--muted-foreground)" }} className="mt-0.5" />
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/tags/${tag.slug}`}
                className="px-3 py-1 rounded-full text-sm transition-all hover:opacity-75"
                style={{
                  background: "var(--muted)",
                  color: "var(--muted-foreground)",
                }}
              >
                #{tag.name}
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
            {story.author.image ? (
              <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 relative" style={{ flexShrink: 0 }}>
                <SafeImage
                  src={story.author.image}
                  alt={story.author.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            ) : (
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
            )}
            <div className="flex-1 min-w-0">
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

        {/* Ad: before comment section */}
        <AdSlot identifier="story_detail_pre_comments" />

        {/* Comments */}
        <CommentSection
          storyId={story.id}
          comments={story.comments}
          userId={session?.user?.id}
          storyAuthorUserId={story.author.userId}
          isAdmin={(session?.user as { role?: string })?.role === "admin"}
        />
          </article>
          <aside className="hidden xl:block w-72 shrink-0">
            <StickyAdSidebar slot="story_sidebar_rectangle" />
          </aside>
        </div>
      </div>

    </>
  );
}
