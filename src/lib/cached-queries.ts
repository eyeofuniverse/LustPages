import { unstable_cache } from "next/cache";
import {
  getStoryBySlug,
  getStoryRecommendations,
  getAuthorBySlug,
  getPublishedStories,
  getSimilarAuthors,
  getSeriesBySlug,
  getActiveAdForSlot,
  getCategories,
  getPopularTags,
  getPublicStats,
  getCategoriesWithStories,
} from "./queries";

// Published story content rarely changes — cache 24 hours.
// Comments are fetched separately via getStoryComments() so they stay live.
export const getCachedStoryBySlug = unstable_cache(
  async (slug: string) => getStoryBySlug(slug),
  ["story-by-slug"],
  { revalidate: 86400, tags: ["stories"] }
);

// Recommendations are based on stable tag/category data — cache 2 hours.
export const getCachedStoryRecommendations = unstable_cache(
  async (storyId: string, tagNames: string[], categoryIds: string[]) =>
    getStoryRecommendations(storyId, tagNames, categoryIds, 6),
  ["story-recs"],
  { revalidate: 7200 }
);

// Author profile data — cache 2 hours.
export const getCachedAuthorBySlug = unstable_cache(
  async (slug: string) => getAuthorBySlug(slug),
  ["author-by-slug"],
  { revalidate: 7200, tags: ["authors"] }
);

// Author's published story list — cache 2 hours.
export const getCachedAuthorStories = unstable_cache(
  async (authorSlug: string) => getPublishedStories({ authorSlug, take: 24 }),
  ["author-stories"],
  { revalidate: 7200 }
);

// Similar authors — slow-changing signal, cache 4 hours.
export const getCachedSimilarAuthors = unstable_cache(
  async (authorId: string) => getSimilarAuthors(authorId, 4),
  ["similar-authors"],
  { revalidate: 14400 }
);

// Series content rarely changes after publication — cache 24 hours.
export const getCachedSeriesBySlug = unstable_cache(
  async (slug: string) => getSeriesBySlug(slug),
  ["series-by-slug"],
  { revalidate: 86400, tags: ["series"] }
);

// Ad slots change infrequently — cache 5 minutes so uncached renders are rare.
export const getCachedAdForSlot = unstable_cache(
  async (slot: string) => getActiveAdForSlot(slot),
  ["ad-slot"],
  { revalidate: 300 }
);

// Categories list — very stable, cache 10 minutes.
export const getCachedCategories = unstable_cache(
  async () => getCategories(),
  ["categories"],
  { revalidate: 600 }
);

// Popular tags — sort order shifts slowly, cache 10 minutes.
export const getCachedPopularTags = unstable_cache(
  async (take: number) => getPopularTags(take),
  ["popular-tags"],
  { revalidate: 600 }
);

// Public stats (story count, user count) — cache 1 hour.
export const getCachedPublicStats = unstable_cache(
  async () => getPublicStats(),
  ["public-stats"],
  { revalidate: 3600 }
);

// Homepage category grid — expensive join, cache 10 minutes.
export const getCachedCategoriesWithStories = unstable_cache(
  async () => getCategoriesWithStories(),
  ["categories-with-stories"],
  { revalidate: 600 }
);
