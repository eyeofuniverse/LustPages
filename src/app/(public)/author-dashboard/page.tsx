import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PAYMENTS_ENABLED } from "@/lib/feature-flags";
import Link from "next/link";
import {
  getOrCreateAuthorByUserId,
  getAuthorStories,
  getAuthorSeriesList,
  getAuthorActivePromotions,
  getUserCoinBalance,
} from "@/lib/queries";
import { PromoteButton } from "@/components/dashboard/PromoteButton";
import { PayoutModal } from "@/components/author/PayoutModal";
import { formatDateShort } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import {
  PenSquare, BookOpen, Eye, Heart, Clock,
  CheckCircle, XCircle, AlertCircle, FileText,
  ArrowRight, Plus, Layers, Coins, MessageCircle, BarChart2, Star, Settings, Lock, Award,
} from "lucide-react";
import { UserBadges } from "@/components/badges/UserBadges";
import { computeSeriesRating } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Author Dashboard — LustPages" };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "#eab308", bg: "rgba(234,179,8,0.1)", icon: FileText },
  pending: { label: "Pending Review", color: "#6366f1", bg: "rgba(99,102,241,0.1)", icon: AlertCircle },
  approved: { label: "Published", color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: CheckCircle },
  rejected: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: XCircle },
};

export default async function AuthorDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const author = await getOrCreateAuthorByUserId(session.user.id, session.user.name ?? "Author");

  const [stories, seriesList, activePromotions, coinBalance, tipEarnings, unlockEarnings, seriesUnlockEarnings, authorBadges] = await Promise.all([
    getAuthorStories(author.id),
    getAuthorSeriesList(author.id),
    getAuthorActivePromotions(author.id),
    getUserCoinBalance(session.user.id),
    prisma.tip.aggregate({
      where: { toAuthorId: author.id },
      _sum: { authorShare: true },
      _count: true,
    }),
    prisma.storyUnlock.aggregate({
      where: { story: { authorId: author.id } },
      _sum: { coinsSpent: true },
      _count: true,
    }),
    prisma.seriesUnlock.aggregate({
      where: { series: { authorId: author.id } },
      _sum: { coinsSpent: true },
      _count: true,
    }),
    prisma.userBadge.findMany({
      where: { userId: session.user.id },
      select: { badgeId: true, awardedAt: true },
      orderBy: { awardedAt: "desc" },
    }),
  ]);

  const storyPromoMap = new Map(
    activePromotions
      .filter((p) => p.type === "story" && p.storyId)
      .map((p) => [p.storyId!, p])
  );
  const seriesPromoMap = new Map(
    activePromotions
      .filter((p) => p.type === "series" && p.seriesId)
      .map((p) => [p.seriesId!, p])
  );

  const counts = {
    draft: stories.filter((s) => s.status === "draft").length,
    pending: stories.filter((s) => s.status === "pending").length,
    approved: stories.filter((s) => s.status === "approved").length,
    rejected: stories.filter((s) => s.status === "rejected").length,
  };

  const publishedStories = stories.filter((s) => s.status === "approved" && s.published);
  const totalViews = publishedStories.reduce((sum, s) => sum + (s.views ?? 0), 0);
  const totalLikes = publishedStories.reduce((sum, s) => sum + (s._count.likes ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm mb-1" style={{ color: "var(--muted-foreground)" }}>
            Welcome back
          </p>
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            {author.name}
          </h1>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {PAYMENTS_ENABLED && (
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(196,66,106,0.08)", border: "1px solid rgba(196,66,106,0.2)", color: "#c4426a" }}
            >
              <Coins size={14} />
              <span className="hidden sm:inline">{coinBalance} coins</span>
              <span className="sm:hidden">{coinBalance}</span>
            </div>
          )}
          <Link
            href="/author-dashboard/series"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
          >
            <Layers size={14} />
            <span className="hidden sm:inline">Series</span>
          </Link>
          <Link
            href="/author-dashboard/analytics"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
          >
            <BarChart2 size={14} />
            <span className="hidden sm:inline">Analytics</span>
          </Link>
          <Link
            href="/author-dashboard/comments"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
          >
            <MessageCircle size={14} />
            <span className="hidden sm:inline">Comments</span>
          </Link>
          <Link
            href="/author-dashboard/profile"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Profile</span>
          </Link>
          <Link
            href="/author-dashboard/stories/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#c4426a" }}
          >
            <Plus size={15} />
            New Story
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {(["approved", "pending", "draft", "rejected"] as const).map((status) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <div
              key={status}
              className="p-4 rounded-2xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {cfg.label}
                </span>
                <Icon size={14} style={{ color: cfg.color }} />
              </div>
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-playfair), serif", color: cfg.color }}
              >
                {counts[status]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Engagement stats — only shown once there are published stories */}
      {counts.approved > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-8 -mt-4">
          <div className="p-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-1 flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
              <Eye size={11} /> Total Views
            </p>
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: "#6366f1" }}>
              {totalViews.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-1 flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
              <Heart size={11} /> Total Likes
            </p>
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: "#ef4444" }}>
              {totalLikes.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Author Badges */}
      <div
        className="mb-8 p-5 rounded-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-bold text-base flex items-center gap-2"
            style={{ color: "var(--foreground)" }}
          >
            <Award size={16} style={{ color: "#c4426a" }} />
            Your Achievements
          </h2>
          {authorBadges.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}>
              {authorBadges.length} earned
            </span>
          )}
        </div>
        <UserBadges earned={authorBadges} category="author" showLocked />
      </div>

      {/* Earnings */}
      {PAYMENTS_ENABLED && (() => {
        const tipCoins = tipEarnings._sum.authorShare ?? 0;
        const unlockCoins = Math.floor((unlockEarnings._sum.coinsSpent ?? 0) * 0.8);
        const seriesUnlockCoins = Math.floor((seriesUnlockEarnings._sum.coinsSpent ?? 0) * 0.8);
        const allUnlockCoins = unlockCoins + seriesUnlockCoins;
        const allUnlockCount = unlockEarnings._count + seriesUnlockEarnings._count;
        const totalEarned = tipCoins + allUnlockCoins;
        const usd = (n: number) => `$${(n / 100).toFixed(2)}`;
        return (
          <div className="mb-10 rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <Coins size={18} style={{ color: "#22c55e" }} />
                  Earnings
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  80% of every unlock · 80% of every tip
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Available to withdraw</p>
                  <p className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: "#22c55e" }}>
                    {author.coinEarnings.toLocaleString()} coins
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{usd(author.coinEarnings)}</p>
                </div>
                <PayoutModal coinEarnings={author.coinEarnings} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Total Earned (all time)</p>
                <p className="text-lg font-bold" style={{ color: "#22c55e" }}>{totalEarned.toLocaleString()}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{usd(totalEarned)}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "rgba(196,66,106,0.07)", border: "1px solid rgba(196,66,106,0.15)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>From Unlocks</p>
                <p className="text-lg font-bold" style={{ color: "#c4426a" }}>{allUnlockCoins.toLocaleString()}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{allUnlockCount} {allUnlockCount === 1 ? "reader" : "readers"} · {usd(allUnlockCoins)}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.15)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>From Tips</p>
                <p className="text-lg font-bold" style={{ color: "#eab308" }}>{tipCoins.toLocaleString()}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{tipEarnings._count} {tipEarnings._count === 1 ? "tip" : "tips"} · {usd(tipCoins)}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Pending Withdrawal</p>
                <p className="text-lg font-bold" style={{ color: "#6366f1" }}>{author.coinEarnings.toLocaleString()}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{usd(author.coinEarnings)} · min 100c</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stories list */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <BookOpen size={18} style={{ color: "#c4426a" }} />
            Your Stories
          </h2>
          <Link
            href={`/authors/${author.slug}`}
            className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
            style={{ color: "#c4426a" }}
          >
            Public profile <ArrowRight size={13} />
          </Link>
        </div>

        {stories.length === 0 ? (
          <div
            className="text-center py-20 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <PenSquare size={40} className="mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
            <p className="font-medium mb-1" style={{ color: "var(--foreground)" }}>No stories yet</p>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              Start writing your first story and submit it for review.
            </p>
            <Link
              href="/author-dashboard/stories/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#c4426a" }}
            >
              <Plus size={15} /> Write a Story
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stories.map((story) => {
              const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.draft;
              const StatusIcon = cfg.icon;
              const canEdit = story.status === "draft" || story.status === "rejected" || story.status === "approved";
              const isPublished = story.status === "approved" && story.published;
              const isDraft = story.status === "draft";
              const promo = storyPromoMap.get(story.id);

              return (
                <div
                  key={story.id}
                  className="rounded-2xl p-4 sm:p-5"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          <StatusIcon size={10} />
                          {cfg.label}
                        </span>
                        {story.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: cat.color + "20", color: cat.color, border: `1px solid ${cat.color}40` }}
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>

                      <h3
                        className="font-bold text-base mb-1 line-clamp-1"
                        style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}
                      >
                        {story.title}
                      </h3>

                      <p className="text-xs line-clamp-1 sm:line-clamp-2 mb-2 hidden sm:block" style={{ color: "var(--muted-foreground)" }}>
                        {story.excerpt}
                      </p>

                      {story.status === "rejected" && story.rejectionReason && (
                        <div
                          className="flex items-start gap-2 p-2.5 rounded-xl mb-2"
                          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                        >
                          <XCircle size={13} className="shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                          <p className="text-xs" style={{ color: "var(--foreground)" }}>
                            <span className="font-semibold" style={{ color: "#ef4444" }}>Reason: </span>
                            {story.rejectionReason}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {story.readingTime}m read
                        </span>
                        {isPublished && (
                          <>
                            <span className="flex items-center gap-1">
                              <Eye size={11} /> {story.views} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart size={11} /> {story._count.likes} likes
                            </span>
                            {(story.ratingCount ?? 0) >= 1 && (
                              <span className="flex items-center gap-1 font-semibold" style={{ color: "#c4426a" }}>
                                <Star size={11} fill="#c4426a" />
                                {(story.ratingAvg ?? 0).toFixed(1)} ({story.ratingCount})
                              </span>
                            )}
                          </>
                        )}
                        <span>Updated {formatDateShort(story.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {isPublished && (
                        <PromoteButton
                          type="story"
                          id={story.id}
                          coinBalance={coinBalance}
                          promotionStatus={promo?.status as "active" | "queued" | null ?? null}
                          expiresAt={promo?.expiresAt ?? null}
                        />
                      )}
                      {canEdit && (
                        <Link
                          href={`/author-dashboard/stories/${story.id}/edit`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.25)" }}
                        >
                          <PenSquare size={12} />
                          {story.status === "rejected" ? "Revise" : "Edit"}
                        </Link>
                      )}
                      {isDraft && (
                        <Link
                          href={`/author-dashboard/stories/${story.id}/preview`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                        >
                          <Eye size={12} />
                          Preview
                        </Link>
                      )}
                      {isPublished && (
                        <Link
                          href={`/stories/${story.slug}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                        >
                          <Eye size={12} />
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Series list */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Layers size={18} style={{ color: "#c4426a" }} />
            Your Series
          </h2>
          <Link href="/author-dashboard/series" className="text-sm transition-opacity hover:opacity-75" style={{ color: "#c4426a" }}>
            View all →
          </Link>
        </div>

        {seriesList.length === 0 ? (
          <div
            className="text-center py-12 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Layers size={32} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
            <p className="font-medium mb-1" style={{ color: "var(--foreground)" }}>No series yet</p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Create a series when adding a new story to group chapters together.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {seriesList.map((series) => {
              const promo = seriesPromoMap.get(series.id);
              const seriesRating = computeSeriesRating(series.stories);
              return (
                <div
                  key={series.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl p-4 sm:p-5"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(196,66,106,0.1)" }}
                  >
                    <BookOpen size={16} style={{ color: "#c4426a" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-bold text-sm mb-0.5 truncate"
                      style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}
                    >
                      {series.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span>
                        {series._count.stories} {series._count.stories === 1 ? "published part" : "published parts"}
                        {" · "}Created {formatDateShort(series.createdAt)}
                      </span>
                      {seriesRating.count >= 1 && (
                        <span className="flex items-center gap-1 font-semibold" style={{ color: "#c4426a" }}>
                          <Star size={11} fill="#c4426a" />
                          {seriesRating.avg.toFixed(1)} ({seriesRating.count} ratings)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    {series.isPremium && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
                      >
                        <Lock size={9} /> {series.coinPrice}c
                      </span>
                    )}
                    {series._count.stories > 0 && (
                      <PromoteButton
                        type="series"
                        id={series.id}
                        coinBalance={coinBalance}
                        promotionStatus={promo?.status as "active" | "queued" | null ?? null}
                        expiresAt={promo?.expiresAt ?? null}
                      />
                    )}
                    <Link
                      href={`/author-dashboard/series/${series.id}/edit`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                    >
                      <Settings size={12} />
                      Settings
                    </Link>
                    <Link
                      href={`/series/${series.slug}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                    >
                      <Eye size={12} />
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
