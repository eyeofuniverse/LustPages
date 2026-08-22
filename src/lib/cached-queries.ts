import { unstable_cache } from "next/cache";
import {
  getStoryBySlug,
  getStoryRecommendations,
  getMoreFromAuthor,
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

// Story content is immutable after publish. Cache 30 days, bust via revalidateTag("stories")
// on any admin approve/update/delete mutation.
export const getCachedStoryBySlug = unstable_cache(
  async (slug: string) => getStoryBySlug(slug),
  ["story-by-slug"],
  { revalidate: 2592000, tags: ["stories"] }
);

// Recs are based on tag/category co-occurrence + collaborative filtering. Cache 24 hours.
export const getCachedStoryRecommendations = unstable_cache(
  async (storyId: string, tagNames: string[], categoryIds: string[], authorId: string) =>
    getStoryRecommendations(storyId, tagNames, categoryIds, authorId, 6),
  ["story-recs"],
  { revalidate: 86400, tags: ["stories"] }
);

// More from this author — ordered by views. Cache 24 hours, bust via "stories".
export const getCachedMoreFromAuthor = unstable_cache(
  async (authorId: string, excludeStoryId: string) => getMoreFromAuthor(authorId, excludeStoryId, 5),
  ["more-from-author"],
  { revalidate: 86400, tags: ["stories"] }
);

// Author profile — changes only when admin edits it. Cache 7 days, bust via revalidateTag("authors").
export const getCachedAuthorBySlug = unstable_cache(
  async (slug: string) => getAuthorBySlug(slug),
  ["author-by-slug"],
  { revalidate: 604800, tags: ["authors"] }
);

// Author's published story list — changes when author publishes. Cache 24 hours, bust via "stories".
export const getCachedAuthorStories = unstable_cache(
  async (authorSlug: string) => getPublishedStories({ authorSlug, take: 24 }),
  ["author-stories"],
  { revalidate: 86400, tags: ["stories"] }
);

// Similar authors — changes only when author profiles change. Cache 7 days.
export const getCachedSimilarAuthors = unstable_cache(
  async (authorId: string) => getSimilarAuthors(authorId, 4),
  ["similar-authors"],
  { revalidate: 604800, tags: ["authors"] }
);

// Series metadata changes only when admin edits it. Cache 30 days, bust via revalidateTag("series").
export const getCachedSeriesBySlug = unstable_cache(
  async (slug: string) => getSeriesBySlug(slug),
  ["series-by-slug"],
  { revalidate: 2592000, tags: ["series"] }
);

// Ad slots — updated by admin occasionally. Cache 30 minutes.
export const getCachedAdForSlot = unstable_cache(
  async (slot: string) => getActiveAdForSlot(slot),
  ["ad-slot"],
  { revalidate: 1800 }
);

// Categories list — almost never changes. Cache 2 hours.
export const getCachedCategories = unstable_cache(
  async () => getCategories(),
  ["categories"],
  { revalidate: 7200 }
);

// Popular tags — slow-moving signal. Cache 2 hours.
export const getCachedPopularTags = unstable_cache(
  async (take: number) => getPopularTags(take),
  ["popular-tags"],
  { revalidate: 7200 }
);

// Public stats — cache 2 hours.
export const getCachedPublicStats = unstable_cache(
  async () => getPublicStats(),
  ["public-stats"],
  { revalidate: 7200 }
);

// Homepage category grid — bust when new stories publish. Cache 24 hours, tag "stories".
export const getCachedCategoriesWithStories = unstable_cache(
  async () => getCategoriesWithStories(),
  ["categories-with-stories"],
  { revalidate: 86400, tags: ["stories"] }
);
