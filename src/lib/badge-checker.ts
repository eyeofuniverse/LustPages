import { prisma } from "@/lib/prisma";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BadgeTrigger =
  | { type: "STORY_COMPLETE";   userId: string }
  | { type: "COMMENT";          userId: string }
  | { type: "RATE";             userId: string }
  | { type: "LIKE";             userId: string }
  | { type: "BOOKMARK";         userId: string }
  | { type: "UNLOCK";           userId: string }
  | { type: "TIP_SENT";         userId: string }
  | { type: "COIN_PURCHASE";    userId: string }
  | { type: "SUBSCRIPTION";     userId: string }
  | { type: "STORY_PUBLISH";    authorId: string }
  | { type: "AUTHOR_LIKED";     authorId: string }
  | { type: "TIP_RECEIVED";     authorId: string }
  | { type: "STORY_LIKED";      authorId: string }
  | { type: "STORY_COMMENTED";  authorId: string }
  | { type: "STORY_RATED";      authorId: string };

// Award badges that haven't been awarded yet. Returns newly awarded badge IDs.
async function award(userId: string, candidateIds: string[]): Promise<string[]> {
  if (candidateIds.length === 0) return [];

  // Find which are already awarded
  const existing = await prisma.userBadge.findMany({
    where: { userId, badgeId: { in: candidateIds } },
    select: { badgeId: true },
  });
  const alreadyHave = new Set(existing.map((b) => b.badgeId));
  const toAward = candidateIds.filter((id) => !alreadyHave.has(id));

  if (toAward.length === 0) return [];

  await prisma.userBadge.createMany({
    data: toAward.map((badgeId) => ({ userId, badgeId })),
    skipDuplicates: true,
  });

  return toAward;
}

// ── Reader badge checks ───────────────────────────────────────────────────────

async function checkReaderReadingBadges(userId: string) {
  const count = await prisma.readingHistory.count({
    where: { userId, completedAt: { not: null } },
  });
  const earned: string[] = [];
  if (count >= 1)   earned.push("first-chapter");
  if (count >= 10)  earned.push("bookworm");
  if (count >= 25)  earned.push("page-turner");
  if (count >= 50)  earned.push("literary-devotee");
  if (count >= 100) earned.push("endless-reader");
  if (count >= 250) earned.push("legend");
  if (count >= 500) earned.push("bibliophile");
  return award(userId, earned);
}

async function checkReaderCommentBadges(userId: string) {
  const count = await prisma.comment.count({ where: { userId } });
  const earned: string[] = [];
  if (count >= 1)   earned.push("first-voice");
  if (count >= 10)  earned.push("conversationalist");
  if (count >= 50)  earned.push("community-pillar");
  if (count >= 100) earned.push("forum-legend");
  if (count >= 500) earned.push("voice-of-the-people");
  return award(userId, earned);
}

async function checkReaderRatingBadges(userId: string) {
  const count = await prisma.rating.count({ where: { userId } });
  const earned: string[] = [];
  if (count >= 1)   earned.push("first-critic");
  if (count >= 25)  earned.push("taste-maker");
  if (count >= 100) earned.push("connoisseur");
  if (count >= 500) earned.push("oracle");
  return award(userId, earned);
}

async function checkReaderLikeBadges(userId: string) {
  const count = await prisma.like.count({ where: { userId } });
  const earned: string[] = [];
  if (count >= 1)    earned.push("appreciator");
  if (count >= 25)   earned.push("fan");
  if (count >= 100)  earned.push("devotee");
  if (count >= 500)  earned.push("love-machine");
  if (count >= 1000) earned.push("heart-collector");
  return award(userId, earned);
}

async function checkReaderBookmarkBadges(userId: string) {
  const count = await prisma.bookmark.count({ where: { userId } });
  const earned: string[] = [];
  if (count >= 1)   earned.push("first-bookmark");
  if (count >= 25)  earned.push("librarian");
  if (count >= 100) earned.push("archivist");
  return award(userId, earned);
}

async function checkReaderUnlockBadges(userId: string) {
  const [storyCount, seriesCount] = await Promise.all([
    prisma.storyUnlock.count({ where: { userId } }),
    prisma.seriesUnlock.count({ where: { userId } }),
  ]);
  const total = storyCount + seriesCount;
  const earned: string[] = [];
  if (total >= 1)   earned.push("first-unlock");
  if (total >= 10)  earned.push("treasure-hunter");
  if (total >= 25)  earned.push("vault-keeper");
  if (total >= 50)  earned.push("premium-collector");
  if (total >= 100) earned.push("grand-collector");
  return award(userId, earned);
}

async function checkReaderTipSentBadges(userId: string) {
  const count = await prisma.tip.count({ where: { fromUserId: userId } });
  const earned: string[] = [];
  if (count >= 1)   earned.push("generous");
  if (count >= 10)  earned.push("patron");
  if (count >= 50)  earned.push("benefactor");
  if (count >= 100) earned.push("maecenas");
  return award(userId, earned);
}

async function checkReaderSpendingBadges(userId: string) {
  // Spending = total absolute value of negative coin transactions
  const agg = await prisma.coinTransaction.aggregate({
    where: { userId, amount: { lt: 0 } },
    _sum: { amount: true },
  });
  const spent = Math.abs(agg._sum.amount ?? 0);
  const earned: string[] = [];
  if (spent >= 500)    earned.push("coin-collector");
  if (spent >= 2000)   earned.push("coin-hoarder");
  if (spent >= 10000)  earned.push("high-roller");
  if (spent >= 50000)  earned.push("whale");
  return award(userId, earned);
}

async function checkReaderPurchaseBadge(userId: string) {
  const count = await prisma.atlosPayment.count({
    where: { userId, status: "completed" },
  });
  return count >= 1 ? award(userId, ["first-splurge"]) : [];
}

async function checkReaderSubscriptionBadge(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return sub ? award(userId, ["subscriber"]) : [];
}

// ── Author badge checks ───────────────────────────────────────────────────────

async function resolveAuthorUserId(authorId: string): Promise<string | null> {
  const author = await prisma.author.findUnique({
    where: { id: authorId },
    select: { userId: true },
  });
  return author?.userId ?? null;
}

async function checkAuthorPublishBadges(authorId: string) {
  const userId = await resolveAuthorUserId(authorId);
  if (!userId) return [];

  const [storyCount, seriesCount] = await Promise.all([
    prisma.story.count({ where: { authorId, published: true } }),
    prisma.series.count({ where: { authorId } }),
  ]);

  const earned: string[] = [];

  // Publishing milestones
  if (storyCount >= 1)   earned.push("debut-author");
  if (storyCount >= 5)   earned.push("storyteller");
  if (storyCount >= 10)  earned.push("prolific");
  if (storyCount >= 25)  earned.push("wordsmith");
  if (storyCount >= 50)  earned.push("author-legend");
  if (storyCount >= 100) earned.push("century-author");

  // Series milestones
  if (seriesCount >= 1)  earned.push("saga-begins");
  if (seriesCount >= 3)  earned.push("serial-author");
  if (seriesCount >= 10) earned.push("series-master");

  // Also check engagement badges since they accumulate over time
  const engagementBadges = await checkAuthorEngagementBadges(authorId, userId);
  return [...(await award(userId, earned)), ...engagementBadges];
}

async function checkAuthorFollowerBadges(authorId: string) {
  const userId = await resolveAuthorUserId(authorId);
  if (!userId) return [];

  const count = await prisma.authorLike.count({ where: { authorId } });
  const earned: string[] = [];
  if (count >= 1)    earned.push("first-follower");
  if (count >= 10)   earned.push("following-popular");
  if (count >= 50)   earned.push("popular-author");
  if (count >= 200)  earned.push("influencer");
  if (count >= 1000) earned.push("superstar");
  return award(userId, earned);
}

async function checkAuthorTipBadges(authorId: string) {
  const userId = await resolveAuthorUserId(authorId);
  if (!userId) return [];

  const [tipCount, author] = await Promise.all([
    prisma.tip.count({ where: { toAuthorId: authorId } }),
    prisma.author.findUnique({ where: { id: authorId }, select: { coinEarnings: true } }),
  ]);

  const earned: string[] = [];
  if (tipCount >= 1)   earned.push("first-tip-received");
  if (tipCount >= 10)  earned.push("supported");
  if (tipCount >= 50)  earned.push("fan-favorite");
  if (tipCount >= 100) earned.push("celebrated");

  // Earnings badges (earned from all sources including unlocks + tips)
  const earnings = author?.coinEarnings ?? 0;
  if (earnings >= 100)   earned.push("earning-author");
  if (earnings >= 1000)  earned.push("monetized");
  if (earnings >= 5000)  earned.push("professional");
  if (earnings >= 25000) earned.push("wealthy-author");

  return award(userId, earned);
}

async function checkAuthorEngagementBadges(authorId: string, userId: string) {
  // Aggregate likes, comments, ratings across all author's stories
  const stories = await prisma.story.findMany({
    where: { authorId, published: true },
    select: {
      id: true,
      ratingAvg: true,
      ratingCount: true,
      _count: { select: { likes: true, comments: true } },
    },
  });

  const totalLikes    = stories.reduce((s, st) => s + st._count.likes, 0);
  const totalComments = stories.reduce((s, st) => s + st._count.comments, 0);
  const totalRatings  = stories.reduce((s, st) => s + st.ratingCount, 0);

  // Weighted average rating across all stories
  const weightedSum = stories.reduce((s, st) => s + st.ratingAvg * st.ratingCount, 0);
  const avgRating = totalRatings > 0 ? weightedSum / totalRatings : 0;

  const earned: string[] = [];

  // Likes
  if (totalLikes >= 10)    earned.push("first-fan");
  if (totalLikes >= 100)   earned.push("rising-star");
  if (totalLikes >= 500)   earned.push("hot-author");
  if (totalLikes >= 2000)  earned.push("love-magnet");
  if (totalLikes >= 10000) earned.push("icon");

  // Comments
  if (totalComments >= 10)   earned.push("discussion-starter");
  if (totalComments >= 100)  earned.push("beloved");
  if (totalComments >= 500)  earned.push("conversation-king");
  if (totalComments >= 2000) earned.push("cultural-phenomenon");

  // Ratings count
  if (totalRatings >= 10)  earned.push("rated-author");
  if (totalRatings >= 50)  earned.push("critically-acclaimed");
  if (totalRatings >= 200) earned.push("masterful");

  // Quality badge: high avg with enough ratings
  if (totalRatings >= 50 && avgRating >= 4.5) earned.push("legendary-quality");

  return award(userId, earned);
}

// Triggered when a story by this author gets a like/comment/rating
async function checkAuthorEngagementFromStory(authorId: string) {
  const userId = await resolveAuthorUserId(authorId);
  if (!userId) return [];
  return checkAuthorEngagementBadges(authorId, userId);
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

export async function checkAndAwardBadges(trigger: BadgeTrigger): Promise<string[]> {
  switch (trigger.type) {
    case "STORY_COMPLETE":  return checkReaderReadingBadges(trigger.userId);
    case "COMMENT":         return checkReaderCommentBadges(trigger.userId);
    case "RATE":            return checkReaderRatingBadges(trigger.userId);
    case "LIKE":            return checkReaderLikeBadges(trigger.userId);
    case "BOOKMARK":        return checkReaderBookmarkBadges(trigger.userId);
    case "UNLOCK":          return checkReaderUnlockBadges(trigger.userId);
    case "TIP_SENT":        return Promise.all([
                              checkReaderTipSentBadges(trigger.userId),
                              checkReaderSpendingBadges(trigger.userId),
                            ]).then((r) => r.flat());
    case "COIN_PURCHASE":   return Promise.all([
                              checkReaderPurchaseBadge(trigger.userId),
                              checkReaderSpendingBadges(trigger.userId),
                            ]).then((r) => r.flat());
    case "SUBSCRIPTION":    return Promise.all([
                              checkReaderSubscriptionBadge(trigger.userId),
                              checkReaderPurchaseBadge(trigger.userId),
                            ]).then((r) => r.flat());
    case "STORY_PUBLISH":   return checkAuthorPublishBadges(trigger.authorId);
    case "AUTHOR_LIKED":    return checkAuthorFollowerBadges(trigger.authorId);
    case "TIP_RECEIVED":    return checkAuthorTipBadges(trigger.authorId);
    case "STORY_LIKED":     return checkAuthorEngagementFromStory(trigger.authorId);
    case "STORY_COMMENTED": return checkAuthorEngagementFromStory(trigger.authorId);
    case "STORY_RATED":     return checkAuthorEngagementFromStory(trigger.authorId);
    default:                return [];
  }
}

/** Fire-and-forget wrapper — call this from API routes so badge checks never block responses. */
export function awardBadgesAsync(trigger: BadgeTrigger): void {
  checkAndAwardBadges(trigger).catch((err) => {
    console.error("[badge-checker] error:", err);
  });
}
