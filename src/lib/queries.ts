import { prisma } from "./prisma";

// Resolves effective cover image: series cover takes priority over story's own cover.
function resolveStoryCover<T extends { coverImage: string | null; seriesInfo?: { coverImage: string | null } | null }>(s: T): T {
  if (s.seriesInfo?.coverImage) return { ...s, coverImage: s.seriesInfo.coverImage } as T;
  return s;
}

async function publishScheduledStories() {
  await prisma.story.updateMany({
    where: { status: "approved", published: false, scheduledAt: { lte: new Date() } },
    data: { published: true, scheduledAt: null },
  });
}

export async function getPublishedStories({
  take = 12,
  skip = 0,
  categorySlug,
  authorSlug,
  search,
  featured,
  tag,
  sort,
}: {
  take?: number;
  skip?: number;
  categorySlug?: string;
  authorSlug?: string;
  search?: string;
  featured?: boolean;
  tag?: string;
  sort?: "latest" | "top-rated";
} = {}) {
  await publishScheduledStories();
  const stories = await prisma.story.findMany({
    where: {
      published: true,
      ...(featured !== undefined && { featured }),
      ...(categorySlug && { categories: { some: { slug: categorySlug } } }),
      ...(authorSlug && { author: { slug: authorSlug } }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { excerpt: { contains: search } },
          { tags: { contains: search } },
        ],
      }),
      ...(tag && {
        OR: [
          { storyTags: { some: { slug: tag } } },
          { tags: { contains: `"${tag}"` } },
        ],
      }),
    },
    include: {
      categories: true,
      author: true,
      storyTags: { select: { name: true } },
      _count: { select: { likes: true, comments: true, bookmarks: true } },
      seriesInfo: { select: { coverImage: true } },
    },
    orderBy: sort === "top-rated" ? [{ ratingAvg: "desc" }, { ratingCount: "desc" }] : { createdAt: "desc" },
    take,
    skip,
  });
  return stories.map(resolveStoryCover);
}

export async function getStoryBySlug(slug: string) {
  await publishScheduledStories();
  return prisma.story.findUnique({
    where: { slug, published: true },
    include: {
      categories: true,
      author: true,
      storyTags: { select: { name: true } },
      _count: { select: { likes: true, comments: true, bookmarks: true } },
      comments: {
        where: { parentId: null },
        include: {
          user: { select: { id: true, name: true, image: true } },
          replies: {
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      seriesInfo: {
        select: {
          id: true,
          name: true,
          slug: true,
          coverImage: true,
          isPremium: true,
          coinPrice: true,
          freeChapters: true,
          stories: {
            where: { published: true },
            select: { id: true, title: true, slug: true, chapterNumber: true },
            orderBy: { chapterNumber: "asc" },
          },
        },
      },
    },
  });
}

export async function getCategories() {
  return prisma.category.findMany({
    include: {
      _count: { select: { stories: { where: { published: true } } } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function getAuthors() {
  const authors = await prisma.author.findMany({
    include: {
      _count: { select: { stories: { where: { published: true } } } },
      stories: {
        where: { published: true },
        select: { views: true, _count: { select: { likes: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return authors.map(({ stories: authorStories, ...a }) => ({
    ...a,
    totalViews: authorStories.reduce((sum, s) => sum + s.views, 0),
    totalLikes: authorStories.reduce((sum, s) => sum + s._count.likes, 0),
  }));
}

export async function getAuthorBySlug(slug: string) {
  const author = await prisma.author.findUnique({
    where: { slug },
    include: {
      _count: { select: { stories: { where: { published: true } }, likes: true } },
      stories: {
        where: { published: true },
        select: { views: true, _count: { select: { likes: true } } },
      },
      seriesList: {
        select: {
          id: true,
          name: true,
          slug: true,
          isPremium: true,
          coinPrice: true,
          freeChapters: true,
          _count: { select: { stories: { where: { published: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!author) return null;

  const { stories: authorStories, ...rest } = author;
  return {
    ...rest,
    totalViews: authorStories.reduce((sum, s) => sum + s.views, 0),
    totalLikes: authorStories.reduce((sum, s) => sum + s._count.likes, 0),
  };
}

export async function getSimilarAuthors(authorId: string, limit = 4) {
  // Collect the current author's category IDs across all published stories
  const ownStories = await prisma.story.findMany({
    where: { authorId, published: true },
    select: { categories: { select: { id: true } } },
  });

  const ownCategoryIds = [...new Set(ownStories.flatMap((s) => s.categories.map((c) => c.id)))];
  if (ownCategoryIds.length === 0) return [];

  // Fetch candidate authors who write in at least one of the same categories
  const candidates = await prisma.author.findMany({
    where: {
      id: { not: authorId },
      stories: {
        some: {
          published: true,
          categories: { some: { id: { in: ownCategoryIds } } },
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      image: true,
      _count: { select: { stories: { where: { published: true } } } },
      stories: {
        where: { published: true },
        select: {
          _count: { select: { likes: true } },
          categories: { select: { id: true } },
        },
      },
    },
    take: 20,
  });

  // Score: primary = number of shared categories, secondary = total likes
  const ownSet = new Set(ownCategoryIds);
  const scored = candidates.map(({ stories: s, ...author }) => {
    const totalLikes = s.reduce((sum, story) => sum + story._count.likes, 0);
    const sharedCategories = new Set(
      s.flatMap((story) => story.categories.map((c) => c.id)).filter((id) => ownSet.has(id)),
    ).size;
    return { ...author, totalLikes, sharedCategories };
  });

  scored.sort((a, b) => b.sharedCategories - a.sharedCategories || b.totalLikes - a.totalLikes);
  return scored.slice(0, limit);
}

export async function getStoryCount({
  published,
  categorySlug,
  search,
  tag,
}: { published?: boolean; categorySlug?: string; search?: string; tag?: string } = {}) {
  return prisma.story.count({
    where: {
      ...(published !== undefined && { published }),
      ...(categorySlug && { categories: { some: { slug: categorySlug } } }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { excerpt: { contains: search } },
          { tags: { contains: search } },
        ],
      }),
      ...(tag && {
        OR: [
          { storyTags: { some: { slug: tag } } },
          { tags: { contains: `"${tag}"` } },
        ],
      }),
    },
  });
}

export type TrendingStoryEntry = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  readingTime: number;
  coinPrice: number | null;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  author: { name: string; slug: string };
  categories: { id: string; name: string; slug: string; color: string }[];
  recentViews: number;
  recentLikes: number;
};

export async function getTrendingStories(take = 10): Promise<TrendingStoryEntry[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [viewGroups, likeGroups] = await Promise.all([
    prisma.storyView.groupBy({
      by: ["storyId"],
      where: { viewedAt: { gte: sevenDaysAgo } },
      _count: { storyId: true },
      orderBy: { _count: { storyId: "desc" } },
      take: take * 6,
    }),
    prisma.like.groupBy({
      by: ["storyId"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { storyId: true },
    }),
  ]);

  const viewIds = viewGroups.map((v) => v.storyId);
  const likeIds = likeGroups.map((l) => l.storyId);
  const candidateIds = [...new Set([...viewIds, ...likeIds])];

  const STORY_SELECT = {
    id: true, title: true, slug: true, coverImage: true,
    readingTime: true, coinPrice: true, views: true, createdAt: true,
    ratingAvg: true, ratingCount: true,
    author: { select: { name: true, slug: true } },
    categories: { select: { id: true, name: true, slug: true, color: true } },
    seriesInfo: { select: { coverImage: true } },
  } as const;

  if (candidateIds.length === 0) {
    const fallback = await prisma.story.findMany({
      where: { published: true },
      orderBy: { views: "desc" },
      take,
      select: STORY_SELECT,
    });
    return fallback.map((s) => ({ ...resolveStoryCover(s), recentViews: 0, recentLikes: 0 })) as TrendingStoryEntry[];
  }

  const stories = await prisma.story.findMany({
    where: { id: { in: candidateIds }, published: true },
    select: STORY_SELECT,
  });

  const viewMap = new Map(viewGroups.map((v) => [v.storyId, v._count.storyId]));
  const likeMap = new Map(likeGroups.map((l) => [l.storyId, l._count.storyId]));
  const now = Date.now();

  const scored = stories.map((s) => ({
    ...resolveStoryCover(s),
    recentViews: viewMap.get(s.id) ?? 0,
    recentLikes: likeMap.get(s.id) ?? 0,
  }));

  scored.sort((a, b) => {
    const ageA = (now - a.createdAt.getTime()) / (1000 * 60 * 60);
    const ageB = (now - b.createdAt.getTime()) / (1000 * 60 * 60);
    const scoreA = (a.recentViews + a.recentLikes * 3) / Math.log(ageA + 2);
    const scoreB = (b.recentViews + b.recentLikes * 3) / Math.log(ageB + 2);
    return scoreB - scoreA;
  });

  return scored.slice(0, take) as TrendingStoryEntry[];
}

export async function getAllTags() {
  const tags = await prisma.tag.findMany({
    where: { isApproved: true },
    include: { _count: { select: { stories: { where: { published: true } } } } },
    orderBy: { name: "asc" },
  });
  return tags.map((t) => ({ tag: t.slug, count: t._count.stories, name: t.name, tier: t.tier, id: t.id }));
}

export async function getPopularTags(take = 24) {
  const tags = await prisma.tag.findMany({
    where: { isApproved: true },
    include: { _count: { select: { stories: { where: { published: true } } } } },
    orderBy: { name: "asc" },
  });
  return tags
    .sort((a, b) => b._count.stories - a._count.stories)
    .slice(0, take)
    .map((t) => ({ tag: t.slug, count: t._count.stories, name: t.name, tier: t.tier, id: t.id }));
}

export async function getAllStructuredTags() {
  return prisma.tag.findMany({
    where: { isApproved: true },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, tier: true, description: true, aliases: { select: { alias: true } } },
  });
}

export async function getTagBySlug(slug: string) {
  return prisma.tag.findUnique({
    where: { slug },
    include: { _count: { select: { stories: { where: { published: true } } } } },
  });
}

export async function getTagCanonicalSlug(alias: string) {
  const record = await prisma.tagAlias.findUnique({
    where: { alias },
    select: { tag: { select: { slug: true } } },
  });
  return record?.tag.slug ?? null;
}

export async function getAdminTags() {
  return prisma.tag.findMany({
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { stories: true } },
      aliases: { select: { id: true, alias: true } },
    },
  });
}

export async function getAdminTagRequests({ status }: { status?: string } = {}) {
  return prisma.tagRequest.findMany({
    where: status && status !== "all" ? { status } : undefined,
    include: {
      requestedBy: { select: { id: true, name: true } },
      mergedIntoTag: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingTagRequestsCount() {
  const [requests, tags] = await Promise.all([
    prisma.tagRequest.count({ where: { status: "pending" } }),
    prisma.tag.count({ where: { isApproved: false } }),
  ]);
  return requests + tags;
}

export async function incrementViews(storyId: string) {
  return prisma.$transaction([
    prisma.story.update({
      where: { id: storyId },
      data: { views: { increment: 1 } },
    }),
    prisma.storyView.create({ data: { storyId } }),
  ]);
}

export async function getUserLikeAndBookmark(userId: string, storyId: string) {
  const [like, bookmark] = await Promise.all([
    prisma.like.findUnique({ where: { userId_storyId: { userId, storyId } } }),
    prisma.bookmark.findUnique({ where: { userId_storyId: { userId, storyId } } }),
  ]);
  return { liked: !!like, bookmarked: !!bookmark };
}

export async function getUserBookmarks(userId: string) {
  return prisma.bookmark.findMany({
    where: { userId },
    include: {
      story: {
        include: {
          categories: true,
          author: true,
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

const STORY_INCLUDE = {
  categories: true,
  author: true,
  _count: { select: { likes: true, comments: true } },
} as const;

export async function getReadingHistory(userId: string) {
  return prisma.readingHistory.findMany({
    where: { userId, completedAt: null },
    orderBy: { lastReadAt: "desc" },
    include: { story: { include: STORY_INCLUDE } },
  });
}

export async function getFinishedStories(userId: string) {
  return prisma.readingHistory.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    include: { story: { include: STORY_INCLUDE } },
  });
}

export async function getUserLikes(userId: string) {
  return prisma.like.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { story: { include: STORY_INCLUDE } },
  });
}

export async function getUserRatedStories(userId: string) {
  return prisma.rating.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      story: {
        include: {
          categories: true,
          author: true,
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
  });
}

const CF_MIN_LIKERS = 5;   // story needs this many likes before CF activates
const CF_MIN_SHARED = 2;   // candidate story needs this many shared likers
const CF_MIN_RESULTS = 4;  // suppress CF section if fewer results than this

async function getTagBasedRecs(
  storyId: string,
  tagNames: string[],
  categoryIds: string[],
  take: number,
) {
  if (tagNames.length === 0 && categoryIds.length === 0) return [];

  const candidates = await prisma.story.findMany({
    where: {
      published: true,
      id: { not: storyId },
      OR: [
        ...(tagNames.length > 0 ? [{ storyTags: { some: { name: { in: tagNames } } } }] : []),
        ...(categoryIds.length > 0 ? [{ categories: { some: { id: { in: categoryIds } } } }] : []),
      ],
    },
    include: {
      storyTags: { select: { name: true } },
      categories: { select: { id: true, name: true, slug: true, color: true } },
      author: { select: { name: true, slug: true } },
      _count: { select: { likes: true, comments: true } },
      seriesInfo: { select: { coverImage: true } },
    },
    take: 60,
  });

  const tagSet = new Set(tagNames);
  const catSet = new Set(categoryIds);

  const scored = candidates.map((s) => {
    const sharedTags = s.storyTags.filter((t) => tagSet.has(t.name)).length;
    const sameCategory = s.categories.some((c) => catSet.has(c.id)) ? 1 : 0;
    const engagement = Math.log1p(s._count.likes);
    return { story: s, score: sharedTags * 3 + sameCategory * 2 + engagement };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, take).map(({ story }) => resolveStoryCover(story));
}

async function getCollaborativeRecs(storyId: string, take: number) {
  const likerCount = await prisma.like.count({ where: { storyId } });
  if (likerCount < CF_MIN_LIKERS) return null;

  const likers = await prisma.like.findMany({
    where: { storyId },
    select: { userId: true },
    take: 500,
  });
  const likerIds = likers.map((l) => l.userId);

  const sharedLikes = await prisma.like.groupBy({
    by: ["storyId"],
    where: { userId: { in: likerIds }, storyId: { not: storyId } },
    _count: { userId: true },
    orderBy: { _count: { userId: "desc" } },
    take: take * 3,
  });

  const qualified = sharedLikes.filter((r) => r._count.userId >= CF_MIN_SHARED);
  if (qualified.length < CF_MIN_RESULTS) return null;

  const stories = await prisma.story.findMany({
    where: {
      id: { in: qualified.slice(0, take).map((r) => r.storyId) },
      published: true,
    },
    include: {
      categories: { select: { id: true, name: true, slug: true, color: true } },
      author: { select: { name: true, slug: true } },
      _count: { select: { likes: true, comments: true } },
      seriesInfo: { select: { coverImage: true } },
    },
  });

  if (stories.length < CF_MIN_RESULTS) return null;

  const rankMap = new Map(qualified.map((r, i) => [r.storyId, i]));
  return stories
    .sort((a, b) => (rankMap.get(a.id) ?? 99) - (rankMap.get(b.id) ?? 99))
    .map(resolveStoryCover);
}

export async function getStoryRecommendations(
  storyId: string,
  tagNames: string[],
  categoryIds: string[],
  take = 6,
) {
  const [tagBased, collaborative] = await Promise.all([
    getTagBasedRecs(storyId, tagNames, categoryIds, take),
    getCollaborativeRecs(storyId, take),
  ]);

  const collabIds = new Set((collaborative ?? []).map((s) => s.id));
  const filteredTagBased = tagBased.filter((s) => !collabIds.has(s.id)).slice(0, take);

  return { tagBased: filteredTagBased, collaborative };
}

export async function getAuthorByUserId(userId: string) {
  return prisma.author.findUnique({ where: { userId } });
}

export async function getAuthorStories(authorId: string) {
  return prisma.story.findMany({
    where: { authorId },
    include: {
      categories: true,
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAuthorStoryById(id: string, authorId: string) {
  return prisma.story.findFirst({
    where: { id, authorId },
    include: {
      categories: true,
      seriesInfo: { select: { id: true, name: true, slug: true } },
      storyTags: { select: { id: true, name: true, slug: true, tier: true, isApproved: true } },
      _count: { select: { unlocks: true } },
    },
  });
}

export async function getStoriesByStatus(status: string) {
  return prisma.story.findMany({
    where: status === "all" ? {} : { status },
    include: {
      categories: true,
      author: true,
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPendingStoriesCount() {
  return prisma.story.count({ where: { status: "pending" } });
}

type AdminStoriesOptions = {
  take?: number;
  skip?: number;
  search?: string;
  statusFilter?: "all" | "published" | "draft" | "scheduled" | "pending" | "rejected";
};

export async function getAdminStories({
  take = 20,
  skip = 0,
  search = "",
  statusFilter = "all",
}: AdminStoriesOptions = {}) {
  const searchWhere = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { author: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const statusWhere =
    statusFilter === "published"
      ? { published: true }
      : statusFilter === "draft"
      // Catch any unpublished story not in an explicit workflow state (pending/rejected/scheduled).
      // Using notIn rather than status === "draft" prevents a ghost zone where
      // published:false + status:"approved" stories disappear from all filter tabs.
      ? { published: false, status: { notIn: ["pending", "rejected"] }, scheduledAt: null }
      : statusFilter === "scheduled"
      ? { published: false, scheduledAt: { not: null } }
      : statusFilter === "pending"
      ? { status: "pending" }
      : statusFilter === "rejected"
      ? { status: "rejected" }
      : {};

  const where = { ...searchWhere, ...statusWhere };

  const [stories, total] = await Promise.all([
    prisma.story.findMany({
      where,
      include: {
        categories: true,
        author: true,
        _count: { select: { likes: true, comments: true, bookmarks: true } },
      },
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    }),
    prisma.story.count({ where }),
  ]);

  return { stories, total };
}

export async function getAdminStoryById(id: string) {
  return prisma.story.findUnique({
    where: { id },
    include: {
      categories: true,
      author: true,
      _count: { select: { likes: true, comments: true, bookmarks: true } },
      seriesInfo: { select: { id: true, name: true, slug: true } },
      storyTags: { select: { id: true, name: true, tier: true, isApproved: true } },
    },
  });
}

export async function getPublicStats() {
  const [publishedStories, totalUsers] = await Promise.all([
    prisma.story.count({ where: { published: true } }),
    prisma.user.count(),
  ]);
  return { publishedStories, totalUsers };
}

export async function getDashboardStats() {
  const [totalStories, publishedStories, totalUsers, totalLikes, totalViews] =
    await Promise.all([
      prisma.story.count(),
      prisma.story.count({ where: { published: true } }),
      prisma.user.count(),
      prisma.like.count(),
      prisma.story.aggregate({ _sum: { views: true } }),
    ]);
  return {
    totalStories,
    publishedStories,
    totalUsers,
    totalLikes,
    totalViews: totalViews._sum.views ?? 0,
  };
}

// ── Coin queries ─────────────────────────────────────────────────────────────

export async function getCoinPackages() {
  return prisma.coinPackage.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
}

export async function getUserCoinBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coinBalance: true },
  });
  return user?.coinBalance ?? 0;
}

export async function getUserCoinTransactions(userId: string, take = 20) {
  return prisma.coinTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getStoryUnlock(userId: string, storyId: string) {
  return prisma.storyUnlock.findUnique({
    where: { userId_storyId: { userId, storyId } },
  });
}

export async function getSeriesUnlock(userId: string, seriesId: string) {
  return prisma.seriesUnlock.findUnique({
    where: { userId_seriesId: { userId, seriesId } },
  });
}

export async function getAuthorCoinEarnings(authorId: string) {
  const author = await prisma.author.findUnique({
    where: { id: authorId },
    select: { coinEarnings: true },
  });
  return author?.coinEarnings ?? 0;
}

export async function getAuthorTips(authorId: string, take = 20) {
  return prisma.tip.findMany({
    where: { toAuthorId: authorId },
    include: { fromUser: { select: { name: true } }, story: { select: { title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

// ── Dashboard metrics ─────────────────────────────────────────────────────────

export async function getDashboardMetrics() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalStories,
    publishedStories,
    draftStories,
    pendingStories,
    totalUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    totalLikes,
    totalViewsAgg,
    totalComments,
    totalBookmarks,
    activeUsersToday,
    newLikesToday,
    newCommentsToday,
    pendingReports,
    pendingTagRequests,
    totalAuthors,
    avgReadingTimeAgg,
    topStoriesByViews,
    recentStories,
    categoriesWithStories,
    tagData,
    topAuthors,
    coinTransactionsMonth,
    tipsMonth,
  ] = await Promise.all([
    prisma.story.count(),
    prisma.story.count({ where: { published: true } }),
    prisma.story.count({ where: { status: "draft" } }),
    prisma.story.count({ where: { status: "pending" } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.like.count(),
    prisma.story.aggregate({ _sum: { views: true } }),
    prisma.comment.count(),
    prisma.bookmark.count(),
    prisma.user.count({
      where: {
        OR: [
          { likes: { some: { createdAt: { gte: todayStart } } } },
          { comments: { some: { createdAt: { gte: todayStart } } } },
          { bookmarks: { some: { createdAt: { gte: todayStart } } } },
        ],
      },
    }),
    prisma.like.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.comment.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.report.count({ where: { status: "pending" } }),
    prisma.tagRequest.count({ where: { status: "pending" } }),
    prisma.author.count(),
    prisma.story.aggregate({ where: { published: true }, _avg: { readingTime: true } }),
    prisma.story.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        views: true,
        author: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { views: "desc" },
      take: 5,
    }),
    prisma.story.findMany({
      take: 8,
      select: {
        id: true,
        title: true,
        published: true,
        status: true,
        views: true,
        updatedAt: true,
        categories: { select: { name: true, color: true } },
        author: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      select: {
        name: true,
        color: true,
        _count: { select: { stories: true } },
        stories: { where: { published: true }, select: { views: true } },
      },
    }),
    prisma.tag.findMany({
      where: { isApproved: true },
      select: {
        name: true,
        _count: { select: { stories: true } },
        stories: { where: { published: true }, select: { views: true } },
      },
    }),
    prisma.author.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        coinEarnings: true,
        _count: { select: { stories: true } },
      },
      orderBy: { coinEarnings: "desc" },
      take: 5,
    }),
    prisma.coinTransaction.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.tip.count({ where: { createdAt: { gte: monthStart } } }),
  ]);

  const totalViews = totalViewsAgg._sum.views ?? 0;
  const avgReadingTime = Math.round(avgReadingTimeAgg._avg.readingTime ?? 0);

  const topCategories = categoriesWithStories
    .map((cat) => ({
      name: cat.name,
      color: cat.color,
      views: cat.stories.reduce((sum, s) => sum + s.views, 0),
      count: cat._count.stories,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const topTags = tagData
    .map((t) => ({
      name: t.name,
      views: t.stories.reduce((sum, s) => sum + s.views, 0),
      count: t._count.stories,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  return {
    totalStories,
    publishedStories,
    draftStories,
    pendingStories,
    totalUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    totalLikes,
    totalViews,
    totalComments,
    totalBookmarks,
    activeUsersToday,
    newLikesToday,
    newCommentsToday,
    pendingReports,
    pendingTagRequests,
    totalAuthors,
    avgReadingTime,
    topStoriesByViews,
    recentStories,
    topCategories,
    topTags,
    topAuthors,
    coinTransactionsMonth,
    tipsMonth,
  };
}

export async function getSeriesBySlug(slug: string) {
  return prisma.series.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      coverImage: true,
      isPremium: true,
      coinPrice: true,
      freeChapters: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true, slug: true, bio: true, image: true } },
      _count: { select: { unlocks: true } },
      stories: {
        where: { published: true },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          chapterNumber: true,
          readingTime: true,
          views: true,
          createdAt: true,
          ratingAvg: true,
          ratingCount: true,
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { chapterNumber: "asc" },
      },
    },
  });
}

export { computeSeriesRating } from "@/lib/utils";

// Shared shape for homepage carousel + admin panel
export type FeaturedEntry = {
  id: string;
  type: "story" | "series";
  isAdminPick: boolean;
  expiresAt: Date | null;
  story: {
    title: string; slug: string; coverImage: string | null; readingTime: number;
    ratingAvg: number; ratingCount: number;
    author: { name: string; slug: string };
    categories: { id: string; name: string; slug: string; color: string }[];
  } | null;
  series: {
    name: string; slug: string; coverImage: string | null;
    author: { name: string; slug: string };
    _count: { stories: number };
    stories: { coverImage: string | null; ratingAvg: number; ratingCount: number }[];
  } | null;
};

export type AdminFeaturedEntry = {
  id: string; type: string; storyId?: string | null; seriesId?: string | null; order: number;
  story: { id: string; title: string; slug: string; coverImage: string | null; author: { name: string } } | null;
  series: { id: string; name: string; slug: string; coverImage: string | null; author: { name: string } } | null;
};

export type PaidFeaturedEntry = {
  id: string; type: string; status: string; storyId?: string | null; seriesId?: string | null;
  startedAt?: Date | null; expiresAt?: Date | null;
  story: { id: string; title: string; slug: string; author: { name: string } } | null;
  series: { id: string; name: string; slug: string; author: { name: string } } | null;
  author: { name: string };
};

export async function getFeaturedPromotions(type: "story" | "series"): Promise<FeaturedEntry[]> {
  const MAX = 10;
  const DURATION = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();

  await prisma.featuredPromotion.updateMany({
    where: { type, status: "active", expiresAt: { lt: now } },
    data: { status: "expired" },
  });

  const paidCount = await prisma.featuredPromotion.count({ where: { type, status: "active" } });
  if (paidCount < MAX) {
    const queued = await prisma.featuredPromotion.findMany({
      where: { type, status: "queued" },
      orderBy: { createdAt: "asc" },
      take: MAX - paidCount,
    });
    if (queued.length > 0) {
      await Promise.all(queued.map((p) =>
        prisma.featuredPromotion.update({
          where: { id: p.id },
          data: { status: "active", startedAt: now, expiresAt: new Date(now.getTime() + DURATION) },
        })
      ));
    }
  }

  // Always include both relations — Prisma returns null when the FK is null
  const paid = await prisma.featuredPromotion.findMany({
    where: { type, status: "active" },
    orderBy: { startedAt: "asc" },
    include: {
      story: {
        select: {
          title: true, slug: true, coverImage: true, readingTime: true,
          ratingAvg: true, ratingCount: true,
          author: { select: { name: true, slug: true } },
          categories: { select: { id: true, name: true, slug: true, color: true } },
          seriesInfo: { select: { coverImage: true } },
        },
      },
      series: {
        select: {
          name: true, slug: true, coverImage: true,
          author: { select: { name: true, slug: true } },
          _count: { select: { stories: true } },
          stories: { where: { published: true }, orderBy: { chapterNumber: "asc" }, select: { coverImage: true, ratingAvg: true, ratingCount: true } },
        },
      },
    },
  });

  const paidItemIds = (type === "story"
    ? paid.map((p) => p.storyId)
    : paid.map((p) => p.seriesId)
  ).filter(Boolean) as string[];

  const adminPicks = paid.length < MAX
    ? await prisma.adminFeaturedItem.findMany({
        where: {
          type,
          ...(type === "story"
            ? { storyId: paidItemIds.length ? { notIn: paidItemIds } : undefined }
            : { seriesId: paidItemIds.length ? { notIn: paidItemIds } : undefined }),
        },
        orderBy: { order: "asc" },
        take: MAX - paid.length,
        include: {
          story: {
            select: {
              title: true, slug: true, coverImage: true, readingTime: true,
              ratingAvg: true, ratingCount: true,
              author: { select: { name: true, slug: true } },
              categories: { select: { id: true, name: true, slug: true, color: true } },
              seriesInfo: { select: { coverImage: true } },
            },
          },
          series: {
            select: {
              name: true, slug: true, coverImage: true,
              author: { select: { name: true, slug: true } },
              _count: { select: { stories: true } },
              stories: { where: { published: true }, select: { coverImage: true, ratingAvg: true, ratingCount: true } },
            },
          },
        },
      })
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolveEntry = (p: { story: any; series: any }) => ({
    story: p.story ? resolveStoryCover(p.story) : null,
    series: p.series,
  });

  return [
    ...paid.map((p) => ({
      id: p.id, type: p.type as "story" | "series", isAdminPick: false,
      expiresAt: p.expiresAt, ...resolveEntry(p),
    })),
    ...adminPicks.map((p) => ({
      id: p.id, type: p.type as "story" | "series", isAdminPick: true,
      expiresAt: null, ...resolveEntry(p),
    })),
  ] as FeaturedEntry[];
}

// ── Admin management queries ────────────────────────────────────────────────

export async function getAdminFeaturedItems(type: "story" | "series"): Promise<AdminFeaturedEntry[]> {
  const items = await prisma.adminFeaturedItem.findMany({
    where: { type },
    orderBy: { order: "asc" },
    include: {
      story: { select: { id: true, title: true, slug: true, coverImage: true, author: { select: { name: true } } } },
      series: { select: { id: true, name: true, slug: true, coverImage: true, author: { select: { name: true } } } },
    },
  });
  return items as AdminFeaturedEntry[];
}

export async function getActiveFeaturedPromotions(type: "story" | "series"): Promise<PaidFeaturedEntry[]> {
  const items = await prisma.featuredPromotion.findMany({
    where: { type, status: { in: ["active", "queued"] } },
    orderBy: [{ status: "asc" }, { startedAt: "asc" }],
    include: {
      story: { select: { id: true, title: true, slug: true, author: { select: { name: true } } } },
      series: { select: { id: true, name: true, slug: true, author: { select: { name: true } } } },
      author: { select: { name: true } },
    },
  });
  return items as PaidFeaturedEntry[];
}

export async function getAuthorActivePromotions(authorId: string) {
  return prisma.featuredPromotion.findMany({
    where: { authorId, status: { in: ["active", "queued"] } },
    select: { id: true, type: true, storyId: true, seriesId: true, status: true, expiresAt: true },
  });
}

export async function getAuthorSeriesList(authorId: string) {
  return prisma.series.findMany({
    where: { authorId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      coverImage: true,
      isPremium: true,
      coinPrice: true,
      freeChapters: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { stories: { where: { published: true } }, unlocks: true } },
      stories: {
        where: { published: true },
        select: { ratingAvg: true, ratingCount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminSeriesList({
  take = 20,
  skip = 0,
  search = "",
}: { take?: number; skip?: number; search?: string } = {}) {
  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};
  const [series, total] = await Promise.all([
    prisma.series.findMany({
      where,
      take,
      skip,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isPremium: true,
        coinPrice: true,
        freeChapters: true,
        createdAt: true,
        author: { select: { name: true, slug: true } },
        _count: { select: { stories: { where: { published: true } }, unlocks: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.series.count({ where }),
  ]);
  return { series, total };
}

export async function getAdminSeriesById(id: string) {
  return prisma.series.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      coverImage: true,
      isPremium: true,
      coinPrice: true,
      freeChapters: true,
      author: { select: { id: true, name: true, slug: true } },
      _count: { select: { stories: { where: { published: true } }, unlocks: true } },
    },
  });
}

export async function getAuthorSeriesById(id: string, authorId: string) {
  return prisma.series.findFirst({
    where: { id, authorId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      coverImage: true,
      isPremium: true,
      coinPrice: true,
      freeChapters: true,
      _count: { select: { unlocks: true, stories: true } },
    },
  });
}

export type LatestStoryEntry = {
  id: string; title: string; slug: string; coverImage: string | null;
  readingTime: number; coinPrice: number | null;
  ratingAvg: number; ratingCount: number;
  author: { name: string; slug: string };
  categories: { id: string; name: string; slug: string; color: string }[];
};

export type LatestSeriesEntry = {
  id: string; name: string; slug: string;
  coverImage: string | null;
  author: { name: string; slug: string };
  _count: { stories: number };
  stories: { coverImage: string | null; ratingAvg: number; ratingCount: number }[];
};

export async function getLatestStories(take = 10): Promise<LatestStoryEntry[]> {
  const stories = await prisma.story.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true, title: true, slug: true, coverImage: true, readingTime: true, coinPrice: true,
      ratingAvg: true, ratingCount: true,
      author: { select: { name: true, slug: true } },
      categories: { select: { id: true, name: true, slug: true, color: true } },
      seriesInfo: { select: { coverImage: true } },
    },
  });
  return stories.map(resolveStoryCover) as LatestStoryEntry[];
}

export async function getLatestSeries(take = 10): Promise<LatestSeriesEntry[]> {
  // Order by most recently published story within each series
  const recentStories = await prisma.story.findMany({
    where: { published: true, seriesId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: take * 8,
    select: { seriesId: true },
  });

  const seen = new Set<string>();
  const seriesIds: string[] = [];
  for (const s of recentStories) {
    if (s.seriesId && !seen.has(s.seriesId)) {
      seen.add(s.seriesId);
      seriesIds.push(s.seriesId);
      if (seriesIds.length >= take) break;
    }
  }
  if (seriesIds.length === 0) return [];

  const rows = await prisma.series.findMany({
    where: { id: { in: seriesIds } },
    select: {
      id: true, name: true, slug: true,
      coverImage: true,
      author: { select: { name: true, slug: true } },
      _count: { select: { stories: { where: { published: true } } } },
      stories: {
        where: { published: true },
        orderBy: { chapterNumber: "asc" },
        select: { coverImage: true, ratingAvg: true, ratingCount: true },
      },
    },
  });

  return seriesIds
    .map((id) => rows.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => r != null);
}

export type PremiumEntry = {
  id: string; title: string; slug: string; coverImage: string | null;
  readingTime: number; coinPrice: number;
  ratingAvg: number; ratingCount: number;
  author: { name: string; slug: string };
  categories: { id: string; name: string; slug: string; color: string }[];
};

export async function getPremiumStories(take = 20): Promise<PremiumEntry[]> {
  const stories = await prisma.story.findMany({
    where: { published: true, coinPrice: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true, title: true, slug: true, coverImage: true, readingTime: true, coinPrice: true,
      ratingAvg: true, ratingCount: true,
      author: { select: { name: true, slug: true } },
      categories: { select: { id: true, name: true, slug: true, color: true } },
      seriesInfo: { select: { coverImage: true } },
    },
  });
  return stories.map((s) => ({ ...resolveStoryCover(s), coinPrice: s.coinPrice! })) as PremiumEntry[];
}

export type CategoryWithStories = {
  id: string; name: string; slug: string; color: string;
  totalStories: number;
  stories: LatestStoryEntry[];
};

export async function getCategoriesWithStories(): Promise<CategoryWithStories[]> {
  const categories = await prisma.category.findMany({
    where: { stories: { some: { published: true } } },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { stories: { where: { published: true } } } },
      stories: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, title: true, slug: true, coverImage: true, readingTime: true, coinPrice: true,
          ratingAvg: true, ratingCount: true,
          author: { select: { name: true, slug: true } },
          categories: { select: { id: true, name: true, slug: true, color: true } },
          seriesInfo: { select: { coverImage: true } },
        },
      },
    },
  });
  return categories.map((c) => ({
    id: c.id, name: c.name, slug: c.slug, color: c.color,
    totalStories: c._count.stories,
    stories: c.stories.map(resolveStoryCover) as LatestStoryEntry[],
  }));
}

export async function searchSeries(query: string, take = 10) {
  return prisma.series.findMany({
    where: {
      stories: { some: { published: true } },
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
      ],
    },
    take,
    select: {
      id: true, name: true, slug: true, description: true,
      author: { select: { name: true, slug: true } },
      _count: { select: { stories: { where: { published: true } } } },
      stories: {
        where: { published: true },
        orderBy: { chapterNumber: "asc" },
        take: 1,
        select: {
          coverImage: true,
          categories: { select: { id: true, name: true, slug: true, color: true } },
        },
      },
    },
  });
}

export async function getSeriesList({
  take = 20, skip = 0, search,
}: { take?: number; skip?: number; search?: string } = {}) {
  return prisma.series.findMany({
    where: {
      stories: { some: { published: true } },
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    },
    orderBy: { updatedAt: "desc" },
    take,
    skip,
    select: {
      id: true, name: true, slug: true, description: true,
      author: { select: { name: true, slug: true } },
      _count: { select: { stories: { where: { published: true } } } },
      stories: {
        where: { published: true },
        orderBy: { chapterNumber: "asc" },
        select: {
          coverImage: true,
          ratingAvg: true,
          ratingCount: true,
          categories: { select: { id: true, name: true, slug: true, color: true } },
        },
      },
    },
  });
}

export async function getSeriesCount(search?: string) {
  return prisma.series.count({
    where: {
      stories: { some: { published: true } },
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    },
  });
}

export async function getPremiumStoriesPaginated({ take = 15, skip = 0 }: { take?: number; skip?: number } = {}) {
  return prisma.story.findMany({
    where: { published: true, coinPrice: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take,
    skip,
    include: {
      categories: true,
      author: true,
      storyTags: { select: { name: true } },
      _count: { select: { likes: true, comments: true, bookmarks: true } },
    },
  });
}

export async function getPremiumStoriesCount() {
  return prisma.story.count({ where: { published: true, coinPrice: { gt: 0 } } });
}

export async function getPremiumSeriesList(take = 20) {
  return prisma.series.findMany({
    where: { isPremium: true, stories: { some: { published: true } } },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true, name: true, slug: true, description: true, coinPrice: true, freeChapters: true,
      author: { select: { name: true, slug: true } },
      _count: { select: { stories: { where: { published: true } } } },
      stories: {
        where: { published: true },
        orderBy: { chapterNumber: "asc" },
        take: 1,
        select: {
          coverImage: true,
          categories: { select: { id: true, name: true, slug: true, color: true } },
        },
      },
    },
  });
}

export async function getActiveAdForSlot(slot: string) {
  const ads = await prisma.ad.findMany({
    where: { slot, isActive: true },
    orderBy: { priority: "desc" },
  });
  if (ads.length === 0) return null;
  const topPriority = ads[0].priority;
  const topAds = ads.filter((a) => a.priority === topPriority);
  return topAds[Math.floor(Math.random() * topAds.length)];
}

export async function getAllAds() {
  return prisma.ad.findMany({
    orderBy: [{ slot: "asc" }, { priority: "desc" }],
  });
}

// ── Comment queries ───────────────────────────────────────────────────────────

const commentUserSelect = { select: { id: true, name: true, image: true } } as const;

export async function getAuthorComments(authorId: string) {
  return prisma.comment.findMany({
    where: { story: { authorId }, parentId: null },
    include: {
      user: commentUserSelect,
      story: { select: { id: true, title: true, slug: true } },
      replies: {
        include: { user: commentUserSelect },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getAdminComments({ take = 100, skip = 0 }: { take?: number; skip?: number } = {}) {
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { parentId: null },
      include: {
        user: commentUserSelect,
        story: { select: { id: true, title: true, slug: true } },
        replies: {
          include: { user: commentUserSelect },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.comment.count({ where: { parentId: null } }),
  ]);
  return { comments, total };
}

export async function getAdminReports({ status }: { status?: string } = {}) {
  return prisma.report.findMany({
    where: status && status !== "all" ? { status } : undefined,
    include: {
      user: { select: { id: true, name: true } },
      story: { select: { id: true, title: true, slug: true } },
      comment: { select: { id: true, content: true, user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAuthorLikeStatus(userId: string, authorId: string) {
  const like = await prisma.authorLike.findUnique({
    where: { userId_authorId: { userId, authorId } },
  });
  return !!like;
}

export async function getPendingReportsCount() {
  return prisma.report.count({ where: { status: "pending" } });
}

export async function getAuthorAnalytics(authorId: string) {
  const now = new Date();
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  const eightWeeksAgo = new Date(now.getTime() - 8 * MS_PER_WEEK);

  // Step 1: All published stories — counts only, no raw readingHistory/unlocks rows
  const stories = await prisma.story.findMany({
    where: { authorId, published: true },
    include: {
      _count: { select: { likes: true, comments: true, bookmarks: true, readingHistory: true, unlocks: true } },
      storyTags: { select: { name: true, slug: true } },
      categories: { select: { id: true, name: true, color: true } },
    },
    orderBy: { views: "desc" },
  });

  const storyIds = stories.map((s) => s.id);

  // Step 2: Parallel — weekly views, tips, author record + DB-level reading/unlock aggregates
  const [weeklyViewRows, tips, tipTotals, authorRecord, completedByStory, avgProgressByStory, unlockCoinsByStory, retentionRows] = await Promise.all([
    storyIds.length > 0
      ? prisma.storyView.findMany({
          where: { storyId: { in: storyIds }, viewedAt: { gte: eightWeeksAgo } },
          select: { viewedAt: true },
        })
      : ([] as { viewedAt: Date }[]),
    prisma.tip.findMany({
      where: { toAuthorId: authorId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        fromUser: { select: { name: true } },
        story: { select: { title: true, slug: true } },
      },
    }),
    prisma.tip.aggregate({
      where: { toAuthorId: authorId },
      _sum: { authorShare: true },
      _count: { id: true },
    }),
    prisma.author.findUnique({ where: { id: authorId }, select: { coinEarnings: true } }),
    // Completed reader count per story
    storyIds.length > 0
      ? prisma.readingHistory.groupBy({
          by: ["storyId"],
          where: { storyId: { in: storyIds }, completedAt: { not: null } },
          _count: { storyId: true },
        })
      : ([] as { storyId: string; _count: { storyId: number } }[]),
    // Avg in-progress progress per story
    storyIds.length > 0
      ? prisma.readingHistory.groupBy({
          by: ["storyId"],
          where: { storyId: { in: storyIds }, completedAt: null },
          _avg: { progress: true },
        })
      : ([] as { storyId: string; _avg: { progress: number | null } }[]),
    // Unlock coins sum per story
    storyIds.length > 0
      ? prisma.storyUnlock.groupBy({
          by: ["storyId"],
          where: { storyId: { in: storyIds } },
          _sum: { coinsSpent: true },
        })
      : ([] as { storyId: string; _sum: { coinsSpent: number | null } }[]),
    // Raw reading progress for retention curve only (minimal fields)
    storyIds.length > 0
      ? prisma.readingHistory.findMany({
          where: { storyId: { in: storyIds } },
          select: { progress: true, completedAt: true },
        })
      : ([] as { progress: number; completedAt: Date | null }[]),
  ]);

  // Step 3: Per-story stats — build lookup maps from aggregates
  const completedMap: Record<string, number> = {};
  completedByStory.forEach((r) => { completedMap[r.storyId] = r._count.storyId; });
  const avgProgressMap: Record<string, number> = {};
  avgProgressByStory.forEach((r) => { avgProgressMap[r.storyId] = Math.round(r._avg.progress ?? 0); });
  const unlockCoinsMap: Record<string, number> = {};
  unlockCoinsByStory.forEach((r) => { unlockCoinsMap[r.storyId] = r._sum.coinsSpent ?? 0; });

  const storyStats = stories.map((story) => {
    const totalReaders = story._count.readingHistory;
    const completed = completedMap[story.id] ?? 0;
    const completionRate = totalReaders > 0 ? Math.round((completed / totalReaders) * 100) : 0;
    const avgProgress = avgProgressMap[story.id] ?? 0;
    const unlockCount = story._count.unlocks;
    const unlockCoins = unlockCoinsMap[story.id] ?? 0;
    return {
      id: story.id,
      title: story.title,
      slug: story.slug,
      views: story.views,
      likes: story._count.likes,
      comments: story._count.comments,
      bookmarks: story._count.bookmarks,
      totalReaders,
      completed,
      completionRate,
      avgProgress,
      unlockCount,
      unlockCoins,
      isPremium: !!story.coinPrice,
      tags: story.storyTags,
      categories: story.categories,
      createdAt: story.createdAt,
    };
  });

  // Step 4: Weekly views — 8 buckets oldest→newest
  const weeklyViews = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(eightWeeksAgo.getTime() + i * MS_PER_WEEK);
    const weekEnd = new Date(weekStart.getTime() + MS_PER_WEEK);
    const views = weeklyViewRows.filter(
      (v) => v.viewedAt >= weekStart && v.viewedAt < weekEnd
    ).length;
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { label, views };
  });

  // Step 5: Tag traffic
  const tagMap: Record<string, { views: number; stories: number }> = {};
  for (const story of stories) {
    for (const tag of story.storyTags) {
      if (!tagMap[tag.name]) tagMap[tag.name] = { views: 0, stories: 0 };
      tagMap[tag.name].views += story.views;
      tagMap[tag.name].stories += 1;
    }
  }
  const topTags = Object.entries(tagMap)
    .sort((a, b) => b[1].views - a[1].views)
    .slice(0, 10)
    .map(([name, data]) => ({ name, color: undefined as string | undefined, ...data }));

  // Step 6: Category traffic
  const catMap: Record<string, { name: string; color: string; views: number; stories: number }> = {};
  for (const story of stories) {
    for (const cat of story.categories) {
      if (!catMap[cat.id]) catMap[cat.id] = { name: cat.name, color: cat.color, views: 0, stories: 0 };
      catMap[cat.id].views += story.views;
      catMap[cat.id].stories += 1;
    }
  }
  const topCategories = Object.values(catMap).sort((a, b) => b.views - a.views);

  // Step 7: Retention curve — what % of readers reached each 10% milestone
  const totalReaders = retentionRows.length;
  const retentionCurve =
    totalReaders === 0
      ? ([] as { milestone: number; pct: number }[])
      : [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((milestone) => ({
          milestone,
          pct: Math.round(
            (retentionRows.filter((h) => h.progress >= milestone).length / totalReaders) * 100
          ),
        }));

  // Step 8: Totals
  const totalViews = stories.reduce((sum, s) => sum + s.views, 0);
  const totalLikes = stories.reduce((sum, s) => sum + s._count.likes, 0);
  const totalComments = stories.reduce((sum, s) => sum + s._count.comments, 0);
  const totalBookmarks = stories.reduce((sum, s) => sum + s._count.bookmarks, 0);
  const allCompleted = retentionRows.filter((h) => h.completedAt !== null).length;
  const overallCompletionRate =
    totalReaders > 0 ? Math.round((allCompleted / totalReaders) * 100) : 0;
  const totalTipCoins = tipTotals._sum.authorShare ?? 0;
  const totalTipCount = tipTotals._count.id;
  const totalEarnings = authorRecord?.coinEarnings ?? 0;
  const totalUnlockCoins = storyStats.reduce((sum, s) => sum + s.unlockCoins, 0);

  return {
    storyStats,
    weeklyViews,
    topTags,
    topCategories,
    retentionCurve,
    totalViews,
    totalLikes,
    totalComments,
    totalBookmarks,
    allReaders: totalReaders,
    overallCompletionRate,
    tips,
    totalTipCoins,
    totalTipCount,
    totalEarnings,
    totalUnlockCoins,
  };
}

// ─── Collections ──────────────────────────────────────────────────────────────

const COLLECTION_STORY_SELECT = {
  id: true,
  position: true,
  editorialNote: true,
  story: {
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      readingTime: true,
      views: true,
      tags: true,
      createdAt: true,
      ratingAvg: true,
      ratingCount: true,
      categories: { select: { id: true, name: true, slug: true, color: true } },
      author: { select: { name: true, slug: true } },
      _count: { select: { likes: true, comments: true } },
      seriesInfo: { select: { coverImage: true } },
    },
  },
} as const;

export async function getPublishedCollections() {
  return prisma.collection.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImage: true,
      type: true,
      featured: true,
      updatedAt: true,
      _count: { select: { stories: true } },
    },
  });
}

export async function getCollectionBySlug(slug: string) {
  const result = await prisma.collection.findUnique({
    where: { slug, published: true },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      metaDescription: true,
      coverImage: true,
      type: true,
      updatedAt: true,
      stories: {
        orderBy: { position: "asc" },
        select: COLLECTION_STORY_SELECT,
      },
    },
  });
  if (!result) return null;
  return {
    ...result,
    stories: result.stories.map((cs) => ({
      ...cs,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      story: cs.story ? resolveStoryCover(cs.story as any) : null,
    })),
  };
}

export async function getAdminCollections() {
  return prisma.collection.findMany({
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      featured: true,
      published: true,
      updatedAt: true,
      _count: { select: { stories: true } },
    },
  });
}

export async function getAdminCollectionById(id: string) {
  return prisma.collection.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      metaDescription: true,
      coverImage: true,
      type: true,
      featured: true,
      published: true,
      sortOrder: true,
      stories: {
        orderBy: { position: "asc" },
        select: COLLECTION_STORY_SELECT,
      },
    },
  });
}

// ── Collection story select shape ────────────────────────────────────
const STORY_AUTO_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  readingTime: true,
  views: true,
  tags: true,
  createdAt: true,
  ratingAvg: true,
  ratingCount: true,
  categories: { select: { id: true, name: true, slug: true, color: true } },
  author: { select: { name: true, slug: true } },
  _count: { select: { likes: true, comments: true } },
  seriesInfo: { select: { coverImage: true } },
} as const;

// Wilson score lower bound — statistically robust quality ranking.
// Prevents a story with 1 five-star rating from beating one with 500 four-star ratings.
// Uses 95% confidence interval, rating scale normalized from 1–5 → 0–1.
function wilsonScore(ratingAvg: number, ratingCount: number): number {
  if (ratingCount === 0) return 0;
  const z = 1.96;
  const n = ratingCount;
  const p = Math.max(0, Math.min(1, (ratingAvg - 1) / 4));
  const num = p + z * z / (2 * n) - z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n);
  return num / (1 + z * z / n);
}

// Rising star score — engagement normalized by age, so new stories can compete.
function risingStarScore(createdAt: Date, views: number, likeCount: number, commentCount: number): number {
  const ageHours = Math.max(1, (Date.now() - createdAt.getTime()) / 3_600_000);
  const engagement = likeCount * 5 + views * 0.1 + commentCount * 3;
  return engagement / Math.pow(ageHours, 1.2);
}

// Auto-collections: computed from live data, not stored in DB
export async function getAutoCollectionStories(type: string, limit = 20) {
  const raw = await _getAutoCollectionStoriesRaw(type, limit);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return raw.map((s: any) => resolveStoryCover(s));
}

async function _getAutoCollectionStoriesRaw(type: string, limit = 20) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const s = STORY_AUTO_SELECT;

  switch (type) {
    // ── Popular ──────────────────────────────────────────────────────
    case "most-liked-this-week":
      return prisma.story.findMany({
        where: { published: true, likes: { some: { createdAt: { gte: sevenDaysAgo } } } },
        orderBy: { likes: { _count: "desc" } },
        take: limit,
        select: s,
      });

    case "most-liked-this-month":
      return prisma.story.findMany({
        where: { published: true, likes: { some: { createdAt: { gte: thirtyDaysAgo } } } },
        orderBy: { likes: { _count: "desc" } },
        take: limit,
        select: s,
      });

    case "most-read-this-week":
      return prisma.story.findMany({
        where: { published: true, storyViews: { some: { viewedAt: { gte: sevenDaysAgo } } } },
        orderBy: { views: "desc" },
        take: limit,
        select: s,
      });

    case "most-read-this-month":
      return prisma.story.findMany({
        where: { published: true, storyViews: { some: { viewedAt: { gte: thirtyDaysAgo } } } },
        orderBy: { views: "desc" },
        take: limit,
        select: s,
      });

    case "most-commented":
      return prisma.story.findMany({
        where: { published: true, comments: { some: { createdAt: { gte: thirtyDaysAgo } } } },
        orderBy: { comments: { _count: "desc" } },
        take: limit,
        select: s,
      });

    // ── Quality Rankings ─────────────────────────────────────────────
    case "top-rated-all-time": {
      const candidates = await prisma.story.findMany({
        where: { published: true, ratingCount: { gte: 3 } },
        orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
        take: limit * 5,
        select: s,
      });
      return candidates
        .sort((a, b) => wilsonScore(b.ratingAvg, b.ratingCount) - wilsonScore(a.ratingAvg, a.ratingCount))
        .slice(0, limit);
    }

    case "top-rated-this-month": {
      const candidates = await prisma.story.findMany({
        where: {
          published: true,
          ratingCount: { gte: 3 },
          ratings: { some: { createdAt: { gte: thirtyDaysAgo } } },
        },
        orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
        take: limit * 5,
        select: s,
      });
      return candidates
        .sort((a, b) => wilsonScore(b.ratingAvg, b.ratingCount) - wilsonScore(a.ratingAvg, a.ratingCount))
        .slice(0, limit);
    }

    case "hidden-gems": {
      const candidates = await prisma.story.findMany({
        where: { published: true, ratingCount: { gte: 5 }, ratingAvg: { gte: 4.0 }, views: { lt: 1500 } },
        orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
        take: limit * 5,
        select: s,
      });
      return candidates
        .sort((a, b) => {
          const wDiff = wilsonScore(b.ratingAvg, b.ratingCount) - wilsonScore(a.ratingAvg, a.ratingCount);
          return wDiff !== 0 ? wDiff : a.views - b.views; // among equal quality, fewer views = more hidden
        })
        .slice(0, limit);
    }

    // ── Discovery ────────────────────────────────────────────────────
    case "rising-stars": {
      const candidates = await prisma.story.findMany({
        where: { published: true, createdAt: { gte: fourteenDaysAgo }, views: { gte: 10 } },
        orderBy: { createdAt: "desc" },
        take: limit * 5,
        select: s,
      });
      return candidates
        .sort(
          (a, b) =>
            risingStarScore(b.createdAt, b.views, b._count.likes, b._count.comments) -
            risingStarScore(a.createdAt, a.views, a._count.likes, a._count.comments)
        )
        .slice(0, limit);
    }

    case "new-this-week":
      return prisma.story.findMany({
        where: { published: true, createdAt: { gte: sevenDaysAgo } },
        orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
        take: limit,
        select: s,
      });

    case "new-this-month":
      return prisma.story.findMany({
        where: { published: true, createdAt: { gte: thirtyDaysAgo } },
        orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
        take: limit,
        select: s,
      });

    default:
      return [];
  }
}

// ── Category collections ─────────────────────────────────────────────

export async function getCategoryCollectionMeta(categorySlug: string) {
  return prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true, name: true, slug: true, description: true, color: true },
  });
}

export async function getCategoryCollectionStories(categorySlug: string, limit = 25) {
  const candidates = await prisma.story.findMany({
    where: { published: true, categories: { some: { slug: categorySlug } }, ratingCount: { gte: 2 } },
    orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
    take: limit * 4,
    select: STORY_AUTO_SELECT,
  });
  // Fallback: not enough rated stories — use engagement ranking instead
  if (candidates.length < 5) {
    const fallback = await prisma.story.findMany({
      where: { published: true, categories: { some: { slug: categorySlug } } },
      orderBy: [{ views: "desc" }, { likes: { _count: "desc" } }],
      take: limit,
      select: STORY_AUTO_SELECT,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return fallback.map((s: any) => resolveStoryCover(s));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return candidates
    .sort((a, b) => wilsonScore(b.ratingAvg, b.ratingCount) - wilsonScore(a.ratingAvg, a.ratingCount))
    .slice(0, limit)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => resolveStoryCover(s));
}

// ── Tag collections ──────────────────────────────────────────────────

export async function getTagCollectionMeta(tagSlug: string) {
  return prisma.tag.findUnique({
    where: { slug: tagSlug, isApproved: true },
    select: { id: true, name: true, slug: true, description: true },
  });
}

export async function getTagCollectionStories(tagSlug: string, limit = 25) {
  const candidates = await prisma.story.findMany({
    where: { published: true, storyTags: { some: { slug: tagSlug } }, ratingCount: { gte: 2 } },
    orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
    take: limit * 4,
    select: STORY_AUTO_SELECT,
  });
  if (candidates.length < 5) {
    return prisma.story.findMany({
      where: { published: true, storyTags: { some: { slug: tagSlug } } },
      orderBy: [{ views: "desc" }, { likes: { _count: "desc" } }],
      take: limit,
      select: STORY_AUTO_SELECT,
    });
  }
  return candidates
    .sort((a, b) => wilsonScore(b.ratingAvg, b.ratingCount) - wilsonScore(a.ratingAvg, a.ratingCount))
    .slice(0, limit);
}

// ── For collections index page ───────────────────────────────────────

export async function getTopCategoriesForCollections() {
  return prisma.category.findMany({
    where: { stories: { some: { published: true } } },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      color: true,
      _count: { select: { stories: true } },
    },
    orderBy: { stories: { _count: "desc" } },
  });
}

export async function getTopTagsForCollections(limit = 24) {
  return prisma.tag.findMany({
    where: { isApproved: true, stories: { some: { published: true } } },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { stories: true } },
    },
    orderBy: { stories: { _count: "desc" } },
    take: limit,
  });
}
