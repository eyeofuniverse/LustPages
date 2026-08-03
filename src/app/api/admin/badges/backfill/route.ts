import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/badges/backfill
 *
 * One-time (idempotent) endpoint that awards badges to all existing users
 * based on their historical activity. Uses bulk aggregation queries so the
 * entire backfill is just ~20 DB reads + 1 bulk write, safe to run even on
 * large user counts.
 *
 * Safe to re-run: createMany with skipDuplicates means already-awarded badges
 * are never duplicated.
 */
export async function POST(_req: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Fetch all aggregated data in one parallel round ──────────────────────

  const [
    readingGroups,
    commentGroups,
    ratingGroups,
    likeGroups,
    bookmarkGroups,
    storyUnlockGroups,
    seriesUnlockGroups,
    tipSentGroups,
    spendingGroups,
    purchaseGroups,
    subscriptions,
    allAuthors,
    publishedStoryGroups,
    seriesGroups,
    followerGroups,
    tipReceivedGroups,
    storyEngagements,
  ] = await Promise.all([
    prisma.readingHistory.groupBy({
      by: ["userId"],
      where: { completedAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.comment.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.rating.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.like.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.bookmark.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.storyUnlock.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.seriesUnlock.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.tip.groupBy({ by: ["fromUserId"], _count: { _all: true } }),
    prisma.coinTransaction.groupBy({
      by: ["userId"],
      where: { amount: { lt: 0 } },
      _sum: { amount: true },
    }),
    prisma.atlosPayment.groupBy({
      by: ["userId"],
      where: { status: "completed" },
      _count: { _all: true },
    }),
    prisma.subscription.findMany({ select: { userId: true } }),
    prisma.author.findMany({
      where: { userId: { not: null } },
      select: { id: true, userId: true, coinEarnings: true },
    }),
    prisma.story.groupBy({
      by: ["authorId"],
      where: { published: true },
      _count: { _all: true },
    }),
    prisma.series.groupBy({ by: ["authorId"], _count: { _all: true } }),
    prisma.authorLike.groupBy({ by: ["authorId"], _count: { _all: true } }),
    prisma.tip.groupBy({ by: ["toAuthorId"], _count: { _all: true } }),
    prisma.story.findMany({
      where: { published: true },
      select: {
        authorId: true,
        ratingAvg: true,
        ratingCount: true,
        _count: { select: { likes: true, comments: true } },
      },
    }),
  ]);

  // ── Build lookup maps ─────────────────────────────────────────────────────

  const readMap     = new Map(readingGroups.map((r) => [r.userId, r._count._all]));
  const commentMap  = new Map(commentGroups.map((r) => [r.userId, r._count._all]));
  const ratingMap   = new Map(ratingGroups.map((r) => [r.userId, r._count._all]));
  const likeMap     = new Map(likeGroups.map((r) => [r.userId, r._count._all]));
  const bookmarkMap = new Map(bookmarkGroups.map((r) => [r.userId, r._count._all]));

  const unlockMap = new Map<string, number>();
  for (const r of storyUnlockGroups) {
    unlockMap.set(r.userId, (unlockMap.get(r.userId) ?? 0) + r._count._all);
  }
  for (const r of seriesUnlockGroups) {
    unlockMap.set(r.userId, (unlockMap.get(r.userId) ?? 0) + r._count._all);
  }

  const tipSentMap  = new Map(tipSentGroups.map((r) => [r.fromUserId, r._count._all]));
  const spendingMap = new Map(spendingGroups.map((r) => [r.userId, Math.abs(r._sum.amount ?? 0)]));
  const purchaseSet = new Set<string>(purchaseGroups.flatMap((r) => (r.userId ? [r.userId] : [])));
  const subSet      = new Set<string>(subscriptions.flatMap((s) => (s.userId ? [s.userId] : [])));

  // Per-author story engagement aggregated in memory
  const authorLikesMap      = new Map<string, number>();
  const authorCommentsMap   = new Map<string, number>();
  const authorRatingCount   = new Map<string, number>();
  const authorRatingWeighted = new Map<string, number>();
  for (const story of storyEngagements) {
    const aid = story.authorId;
    authorLikesMap.set(aid,       (authorLikesMap.get(aid)       ?? 0) + story._count.likes);
    authorCommentsMap.set(aid,    (authorCommentsMap.get(aid)    ?? 0) + story._count.comments);
    authorRatingCount.set(aid,    (authorRatingCount.get(aid)    ?? 0) + story.ratingCount);
    authorRatingWeighted.set(aid, (authorRatingWeighted.get(aid) ?? 0) + story.ratingAvg * story.ratingCount);
  }

  // ── Compute all badges to award ───────────────────────────────────────────

  const toAward: { userId: string; badgeId: string }[] = [];
  const push = (userId: string, badgeId: string) => toAward.push({ userId, badgeId });

  // Collect user IDs with any activity (some FK fields can be nullable in schema — filter those out)
  const allUserIds = new Set<string>();
  const addNullableKeys = (keys: Iterable<string | null | undefined>) => {
    for (const k of keys) if (k != null) allUserIds.add(k);
  };
  addNullableKeys(readMap.keys());
  addNullableKeys(commentMap.keys());
  addNullableKeys(ratingMap.keys());
  addNullableKeys(likeMap.keys());
  addNullableKeys(bookmarkMap.keys());
  addNullableKeys(unlockMap.keys());
  addNullableKeys(tipSentMap.keys());
  addNullableKeys(spendingMap.keys());
  for (const k of purchaseSet) allUserIds.add(k);
  for (const k of subSet)      allUserIds.add(k);

  for (const userId of allUserIds) {
    const reads = readMap.get(userId) ?? 0;
    if (reads >= 1)   push(userId, "first-chapter");
    if (reads >= 10)  push(userId, "bookworm");
    if (reads >= 25)  push(userId, "page-turner");
    if (reads >= 50)  push(userId, "literary-devotee");
    if (reads >= 100) push(userId, "endless-reader");
    if (reads >= 250) push(userId, "legend");
    if (reads >= 500) push(userId, "bibliophile");

    const comments = commentMap.get(userId) ?? 0;
    if (comments >= 1)   push(userId, "first-voice");
    if (comments >= 10)  push(userId, "conversationalist");
    if (comments >= 50)  push(userId, "community-pillar");
    if (comments >= 100) push(userId, "forum-legend");
    if (comments >= 500) push(userId, "voice-of-the-people");

    const ratings = ratingMap.get(userId) ?? 0;
    if (ratings >= 1)   push(userId, "first-critic");
    if (ratings >= 25)  push(userId, "taste-maker");
    if (ratings >= 100) push(userId, "connoisseur");
    if (ratings >= 500) push(userId, "oracle");

    const likes = likeMap.get(userId) ?? 0;
    if (likes >= 1)    push(userId, "appreciator");
    if (likes >= 25)   push(userId, "fan");
    if (likes >= 100)  push(userId, "devotee");
    if (likes >= 500)  push(userId, "love-machine");
    if (likes >= 1000) push(userId, "heart-collector");

    const bookmarks = bookmarkMap.get(userId) ?? 0;
    if (bookmarks >= 1)   push(userId, "first-bookmark");
    if (bookmarks >= 25)  push(userId, "librarian");
    if (bookmarks >= 100) push(userId, "archivist");

    const unlocks = unlockMap.get(userId) ?? 0;
    if (unlocks >= 1)   push(userId, "first-unlock");
    if (unlocks >= 10)  push(userId, "treasure-hunter");
    if (unlocks >= 25)  push(userId, "vault-keeper");
    if (unlocks >= 50)  push(userId, "premium-collector");
    if (unlocks >= 100) push(userId, "grand-collector");

    const tipsS = tipSentMap.get(userId) ?? 0;
    if (tipsS >= 1)   push(userId, "generous");
    if (tipsS >= 10)  push(userId, "patron");
    if (tipsS >= 50)  push(userId, "benefactor");
    if (tipsS >= 100) push(userId, "maecenas");

    const spent = spendingMap.get(userId) ?? 0;
    if (spent >= 500)    push(userId, "coin-collector");
    if (spent >= 2000)   push(userId, "coin-hoarder");
    if (spent >= 10000)  push(userId, "high-roller");
    if (spent >= 50000)  push(userId, "whale");

    if (purchaseSet.has(userId)) push(userId, "first-splurge");
    if (subSet.has(userId))      push(userId, "subscriber");
  }

  // Author badges
  const storyCountMap    = new Map(publishedStoryGroups.map((r) => [r.authorId, r._count._all]));
  const seriesCountMap   = new Map(seriesGroups.map((r) => [r.authorId, r._count._all]));
  const followerCountMap = new Map(followerGroups.map((r) => [r.authorId, r._count._all]));
  const tipReceivedMap   = new Map(tipReceivedGroups.map((r) => [r.toAuthorId, r._count._all]));

  for (const author of allAuthors) {
    if (!author.userId) continue;
    const { userId, id: authorId, coinEarnings } = author;

    const storyCount = storyCountMap.get(authorId) ?? 0;
    if (storyCount >= 1)   push(userId, "debut-author");
    if (storyCount >= 5)   push(userId, "storyteller");
    if (storyCount >= 10)  push(userId, "prolific");
    if (storyCount >= 25)  push(userId, "wordsmith");
    if (storyCount >= 50)  push(userId, "author-legend");
    if (storyCount >= 100) push(userId, "century-author");

    const seriesCount = seriesCountMap.get(authorId) ?? 0;
    if (seriesCount >= 1)  push(userId, "saga-begins");
    if (seriesCount >= 3)  push(userId, "serial-author");
    if (seriesCount >= 10) push(userId, "series-master");

    const followers = followerCountMap.get(authorId) ?? 0;
    if (followers >= 1)    push(userId, "first-follower");
    if (followers >= 10)   push(userId, "following-popular");
    if (followers >= 50)   push(userId, "popular-author");
    if (followers >= 200)  push(userId, "influencer");
    if (followers >= 1000) push(userId, "superstar");

    const tipsR = tipReceivedMap.get(authorId) ?? 0;
    if (tipsR >= 1)   push(userId, "first-tip-received");
    if (tipsR >= 10)  push(userId, "supported");
    if (tipsR >= 50)  push(userId, "fan-favorite");
    if (tipsR >= 100) push(userId, "celebrated");

    if (coinEarnings >= 100)   push(userId, "earning-author");
    if (coinEarnings >= 1000)  push(userId, "monetized");
    if (coinEarnings >= 5000)  push(userId, "professional");
    if (coinEarnings >= 25000) push(userId, "wealthy-author");

    const totalLikes    = authorLikesMap.get(authorId)       ?? 0;
    const totalComments = authorCommentsMap.get(authorId)    ?? 0;
    const totalRatings  = authorRatingCount.get(authorId)    ?? 0;
    const ratingWgt     = authorRatingWeighted.get(authorId) ?? 0;
    const avgRating     = totalRatings > 0 ? ratingWgt / totalRatings : 0;

    if (totalLikes >= 10)    push(userId, "first-fan");
    if (totalLikes >= 100)   push(userId, "rising-star");
    if (totalLikes >= 500)   push(userId, "hot-author");
    if (totalLikes >= 2000)  push(userId, "love-magnet");
    if (totalLikes >= 10000) push(userId, "icon");

    if (totalComments >= 10)   push(userId, "discussion-starter");
    if (totalComments >= 100)  push(userId, "beloved");
    if (totalComments >= 500)  push(userId, "conversation-king");
    if (totalComments >= 2000) push(userId, "cultural-phenomenon");

    if (totalRatings >= 10)  push(userId, "rated-author");
    if (totalRatings >= 50)  push(userId, "critically-acclaimed");
    if (totalRatings >= 200) push(userId, "masterful");
    if (totalRatings >= 50 && avgRating >= 4.5) push(userId, "legendary-quality");
  }

  // ── Single bulk insert, skip already-awarded ──────────────────────────────
  const result = await prisma.userBadge.createMany({
    data: toAward,
    skipDuplicates: true,
  });

  return NextResponse.json({
    awarded: result.count,
    candidates: toAward.length,
    users: allUserIds.size,
    authors: allAuthors.length,
  });
}
