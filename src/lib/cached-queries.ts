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

// Recommendations are based on stable tag/category data — cache 4 hours.
export const getCachedStoryRecommendations = unstable_cache(
  async (storyId: string, tagNames: string[], categoryIds: string[]) =>
    getStoryRecommendations(storyId, tagNames, categoryIds, 6),
  ["story-recs"],
  { revalidate: 14400 }
);

// Author profile data — cache 4 hours.
export const getCachedAuthorBySlug = unstable_cache(
  async (slug: string) => getAuthorBySlug(slug),
  ["author-by-slug"],
  { revalidate: 14400, tags: ["authors"] }
);

// Author's published story list — cache 4 hours.
export const getCachedAuthorStories = unstable_cache(
  async (authorSlug: string) => getPublishedStories({ authorSlug, take: 24 }),
  ["author-stories"],
  { revalidate: 14400 }
);

// Similar authors — slow-changing signal, cache 6 hours.
export const getCachedSimilarAuthors = unstable_cache(
  async (authorId: string) => getSimilarAuthors(authorId, 4),
  ["similar-authors"],
  { revalidate: 21600 }
);

// Series content rarely changes after publication — cache 24 hours.
export const getCachedSeriesBySlug = unstable_cache(
  async (slug: string) => getSeriesBySlug(slug),
  ["series-by-slug"],
  { revalidate: 86400, tags: ["series"] }
);

// Ad slots — cache 30 minutes; ads don't flip faster than that in practice.
export const getCachedAdForSlot = unstable_cache(
  async (slot: string) => getActiveAdForSlot(slot),
  ["ad-slot"],
  { revalidate: 1800 }
);

// Categories list — very stable, cache 2 hours.
export const getCachedCategories = unstable_cache(
  async () => getCategories(),
  ["categories"],
  { revalidate: 7200 }
);

// Popular tags — sort order shifts slowly, cache 2 hours.
export const getCachedPopularTags = unstable_cache(
  async (take: number) => getPopularTags(take),
  ["popular-tags"],
  { revalidate: 7200 }
);

// Public stats (story count, user count) — cache 2 hours.
export const getCachedPublicStats = unstable_cache(
  async () => getPublicStats(),
  ["public-stats"],
  { revalidate: 7200 }
);

// Homepage category grid — expensive join, cache 2 hours.
export const getCachedCategoriesWithStories = unstable_cache(
  async () => getCategoriesWithStories(),
  ["categories-with-stories"],
  { revalidate: 7200 }
);
