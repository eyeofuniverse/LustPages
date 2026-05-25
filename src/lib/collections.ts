export interface AutoCollection {
  slug: string;
  title: string;
  description: string;
  metaDescription: string;
  type: "auto";
  icon: string;
  refreshLabel: string;
  section: "popular" | "quality" | "discovery";
}

export const AUTO_COLLECTIONS: AutoCollection[] = [
  // ── Popular — by reader engagement ─────────────────────────────────
  {
    slug: "most-liked-this-week",
    title: "Most Liked This Week",
    description:
      "The stories readers have liked the most in the last 7 days. A real-time pulse of what the community is loving right now.",
    metaDescription:
      "This week's most-liked adult fiction stories on LustPages. Reader-approved erotica ranked by community votes.",
    icon: "heart",
    refreshLabel: "Updated daily",
    section: "popular",
    type: "auto",
  },
  {
    slug: "most-liked-this-month",
    title: "Most Liked This Month",
    description:
      "The stories readers couldn't stop liking over the past 30 days. Ranked purely by reader approval — no editorial bias, just what the community loves.",
    metaDescription:
      "The most-liked adult fiction stories on LustPages this month. Reader-approved erotica ranked by community votes.",
    icon: "trending-up",
    refreshLabel: "Updated daily",
    section: "popular",
    type: "auto",
  },
  {
    slug: "most-read-this-week",
    title: "Most Read This Week",
    description:
      "This week's hottest stories by total reads. The fastest-moving content on the platform — read what everyone else is reading right now.",
    metaDescription:
      "This week's most-read erotica and adult fiction stories on LustPages. See what's trending right now.",
    icon: "zap",
    refreshLabel: "Updated daily",
    section: "popular",
    type: "auto",
  },
  {
    slug: "most-read-this-month",
    title: "Most Read This Month",
    description:
      "The most-read stories across the platform this month. A crowd-sourced guide to what's worth your reading time.",
    metaDescription:
      "This month's most-read adult fiction stories on LustPages. See what thousands of readers have been enjoying.",
    icon: "eye",
    refreshLabel: "Updated daily",
    section: "popular",
    type: "auto",
  },
  {
    slug: "most-commented",
    title: "Most Discussed",
    description:
      "Stories generating the most conversation this month. Where readers have things to say — usually the sign of something truly special.",
    metaDescription:
      "The most-commented adult fiction stories on LustPages this month. See what's sparking conversation.",
    icon: "message-circle",
    refreshLabel: "Updated daily",
    section: "popular",
    type: "auto",
  },
  // ── Quality Rankings — statistically robust ratings ─────────────────
  {
    slug: "top-rated-all-time",
    title: "Top Rated All Time",
    description:
      "The highest-rated stories across the entire platform, ranked using a statistical confidence algorithm. Only stories with enough ratings to be meaningfully ranked appear here — no flukes.",
    metaDescription:
      "The best-rated adult fiction stories on LustPages of all time, ranked by thousands of reader ratings using a statistical confidence algorithm.",
    icon: "star",
    refreshLabel: "Updated weekly",
    section: "quality",
    type: "auto",
  },
  {
    slug: "top-rated-this-month",
    title: "Top Rated This Month",
    description:
      "Stories that earned the highest reader ratings this month. Fresh quality discoveries — the cream rising to the top in real time.",
    metaDescription:
      "The top-rated adult fiction stories on LustPages this month, ranked by statistical confidence from reader star ratings.",
    icon: "award",
    refreshLabel: "Updated daily",
    section: "quality",
    type: "auto",
  },
  {
    slug: "hidden-gems",
    title: "Hidden Gems",
    description:
      "Exceptional stories flying under the radar — outstanding reader ratings, relatively few views. The underrated masterpieces the algorithm hasn't discovered yet. Your job to change that.",
    metaDescription:
      "Underrated but highly-rated adult fiction stories on LustPages. Hidden gems with outstanding reader ratings waiting to be discovered.",
    icon: "gem",
    refreshLabel: "Updated weekly",
    section: "quality",
    type: "auto",
  },
  // ── Discovery — new voices and rising momentum ──────────────────────
  {
    slug: "rising-stars",
    title: "Rising Stars",
    description:
      "Recently published stories gaining momentum fast. Freshest voices building real traction with readers — catch them early before everyone else does.",
    metaDescription:
      "New adult fiction stories on LustPages gaining reader momentum fast. Rising star authors to discover before they blow up.",
    icon: "rocket",
    refreshLabel: "Updated daily",
    section: "discovery",
    type: "auto",
  },
  {
    slug: "new-this-week",
    title: "New This Week",
    description:
      "Fresh stories published in the last 7 days, sorted by early engagement. Discover new voices and stories before they blow up.",
    metaDescription:
      "New adult fiction and erotica stories published this week on LustPages. Fresh reads every day.",
    icon: "clock",
    refreshLabel: "Updated daily",
    section: "discovery",
    type: "auto",
  },
  {
    slug: "new-this-month",
    title: "New This Month",
    description:
      "All the new stories published in the last 30 days, sorted by reader response. A month's worth of fresh fiction in one place.",
    metaDescription:
      "New adult fiction stories published this month on LustPages, sorted by reader engagement and early popularity.",
    icon: "calendar",
    refreshLabel: "Updated daily",
    section: "discovery",
    type: "auto",
  },
];

export const AUTO_COLLECTION_SLUGS = AUTO_COLLECTIONS.map((c) => c.slug);

export const SECTION_META: Record<AutoCollection["section"], { label: string; description: string }> = {
  popular: {
    label: "Trending",
    description: "Ranked by raw reader engagement — likes, reads, and comments.",
  },
  quality: {
    label: "Quality Rankings",
    description: "Statistically ranked using Wilson score confidence intervals. No flukes.",
  },
  discovery: {
    label: "New & Rising",
    description: "Fresh stories and fast-growing voices worth discovering now.",
  },
};

export function getAutoCollection(slug: string): AutoCollection | undefined {
  return AUTO_COLLECTIONS.find((c) => c.slug === slug);
}

export function isAutoCollection(slug: string): boolean {
  return AUTO_COLLECTION_SLUGS.includes(slug);
}

// ── Category collections: /collections/best-of-[category-slug] ───────
export const CATEGORY_COLLECTION_PREFIX = "best-of-";

export function isCategoryCollection(slug: string): boolean {
  return slug.startsWith(CATEGORY_COLLECTION_PREFIX) && !isAutoCollection(slug);
}

export function getCategorySlugFromCollection(slug: string): string {
  return slug.slice(CATEGORY_COLLECTION_PREFIX.length);
}

export function makeCategoryCollectionSlug(categorySlug: string): string {
  return `${CATEGORY_COLLECTION_PREFIX}${categorySlug}`;
}

// ── Tag collections: /collections/best-tag-[tag-slug] ────────────────
export const TAG_COLLECTION_PREFIX = "best-tag-";

export function isTagCollection(slug: string): boolean {
  return slug.startsWith(TAG_COLLECTION_PREFIX);
}

export function getTagSlugFromCollection(slug: string): string {
  return slug.slice(TAG_COLLECTION_PREFIX.length);
}

export function makeTagCollectionSlug(tagSlug: string): string {
  return `${TAG_COLLECTION_PREFIX}${tagSlug}`;
}
