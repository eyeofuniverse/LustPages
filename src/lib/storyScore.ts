export interface ScoreItem {
  label: string;
  earned: number;
  max: number;
  tip: string;
  status: "good" | "warn" | "bad";
}

export interface CategoryScore {
  label: string;
  score: number; // 0-100 normalized
  color: string;
  items: ScoreItem[];
}

export interface StoryScoreResult {
  categories: CategoryScore[];
  overall: number; // 0-100
}

export interface StoryScoreInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string; // comma-separated
  categoryIds: string[];
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noIndex: boolean;
  genderPairing: string;
  pov: string;
  maturityRating: string;
  series: string;
  authorNote: string;
  status: "draft" | "scheduled" | "published";
  visibility: string;
}

function wordCount(html: string): number {
  return html
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function parseTags(raw: string): string[] {
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

function normalize(items: ScoreItem[]): number {
  const earned = items.reduce((s, i) => s + i.earned, 0);
  const max = items.reduce((s, i) => s + i.max, 0);
  if (max === 0) return 0;
  return Math.round((earned / max) * 100);
}

export function computeStoryScore(input: StoryScoreInput): StoryScoreResult {
  const {
    title, slug, excerpt, content, coverImage, tags: tagsRaw,
    categoryIds, metaTitle, metaDescription, noIndex,
    genderPairing, pov, maturityRating,
    series, authorNote, status, visibility,
  } = input;

  const tags = parseTags(tagsRaw);
  const wc = wordCount(content);
  const titleWords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const tagString = tags.join(" ").toLowerCase();
  const kwMatches = titleWords.filter((w) => tagString.includes(w)).length;
  const paraCount = (content.match(/<\/p>/g) || []).length;

  // ── SEO (weight 30%) ──────────────────────────────────────────
  const seoItems: ScoreItem[] = [
    {
      label: "Title length",
      earned: title.length >= 10 && title.length <= 70 ? 10 : title.length >= 5 ? 5 : 0,
      max: 10,
      tip: "Aim for 10–70 characters — long enough for keywords, short enough to display fully in search results",
      status: title.length >= 10 && title.length <= 70 ? "good" : title.length >= 5 ? "warn" : "bad",
    },
    {
      label: "Custom meta title",
      earned: metaTitle.length >= 30 && metaTitle.length <= 60 ? 14 : metaTitle.length >= 20 ? 7 : 0,
      max: 14,
      tip: "Set a custom meta title between 30–60 characters for optimal Google display",
      status: metaTitle.length >= 30 && metaTitle.length <= 60 ? "good" : metaTitle.length >= 20 ? "warn" : "bad",
    },
    {
      label: "Meta description",
      earned: metaDescription.length >= 80 && metaDescription.length <= 160 ? 14 : metaDescription.length >= 40 ? 7 : 0,
      max: 14,
      tip: "Write a meta description of 80–160 characters — this is your search result snippet",
      status: metaDescription.length >= 80 && metaDescription.length <= 160 ? "good" : metaDescription.length >= 40 ? "warn" : "bad",
    },
    {
      label: "Excerpt quality",
      earned: excerpt.length >= 100 && excerpt.length <= 350 ? 10 : excerpt.length >= 50 ? 5 : 0,
      max: 10,
      tip: "Write an excerpt of 100–350 characters — it doubles as your default meta description and listing preview",
      status: excerpt.length >= 100 && excerpt.length <= 350 ? "good" : excerpt.length >= 50 ? "warn" : "bad",
    },
    {
      label: "Tags keyword coverage",
      earned: tags.length >= 5 ? 10 : tags.length >= 3 ? 6 : tags.length >= 1 ? 2 : 0,
      max: 10,
      tip: "Add at least 5 specific tags — these are your long-tail keyword signals",
      status: tags.length >= 5 ? "good" : tags.length >= 3 ? "warn" : "bad",
    },
    {
      label: "Title keywords in tags",
      earned: kwMatches >= 2 ? 8 : kwMatches >= 1 ? 4 : 0,
      max: 8,
      tip: "Mirror key words from your title in your tags to reinforce topic relevance",
      status: kwMatches >= 2 ? "good" : kwMatches >= 1 ? "warn" : "bad",
    },
    {
      label: "Cover image",
      earned: coverImage ? 10 : 0,
      max: 10,
      tip: "Add a cover image — it appears in social share previews and boosts click-through rate",
      status: coverImage ? "good" : "bad",
    },
    {
      label: "Clean URL slug",
      earned: slug.length > 0 && slug.length <= 60 ? 6 : slug.length > 0 ? 3 : 0,
      max: 6,
      tip: "Keep the slug under 60 characters with meaningful keywords",
      status: slug.length > 0 && slug.length <= 60 ? "good" : slug.length > 0 ? "warn" : "bad",
    },
    {
      label: "Publicly indexable",
      earned: !noIndex && visibility === "Public" ? 8 : !noIndex || visibility === "Public" ? 4 : 0,
      max: 8,
      tip: "Set Visibility to Public and noIndex to off so search engines can crawl this page",
      status: !noIndex && visibility === "Public" ? "good" : !noIndex || visibility === "Public" ? "warn" : "bad",
    },
  ];

  // ── Content (weight 45%) ──────────────────────────────────────
  const contentItems: ScoreItem[] = [
    {
      label: "Word count",
      earned: wc >= 3000 ? 28 : wc >= 1500 ? 20 : wc >= 800 ? 12 : wc >= 300 ? 4 : 0,
      max: 28,
      tip: `${wc.toLocaleString()} words — 1,500+ is a satisfying read; 3,000+ performs best in recommendations`,
      status: wc >= 1500 ? "good" : wc >= 800 ? "warn" : "bad",
    },
    {
      label: "Story structure",
      earned: paraCount >= 8 ? 18 : paraCount >= 4 ? 12 : paraCount >= 1 ? 5 : 0,
      max: 18,
      tip: "Break your story into paragraphs — walls of text drive readers away",
      status: paraCount >= 8 ? "good" : paraCount >= 4 ? "warn" : "bad",
    },
    {
      label: "Compelling excerpt",
      earned: excerpt.length >= 100 ? 16 : excerpt.length >= 50 ? 8 : excerpt.length > 0 ? 3 : 0,
      max: 16,
      tip: "Write a hook of at least 100 characters to entice readers from the listing page",
      status: excerpt.length >= 100 ? "good" : excerpt.length >= 50 ? "warn" : "bad",
    },
    {
      label: "Author's note",
      earned: authorNote.trim().length >= 30 ? 8 : authorNote.trim().length > 0 ? 4 : 0,
      max: 8,
      tip: "An author's note personalises the experience and builds reader loyalty",
      status: authorNote.trim().length >= 30 ? "good" : authorNote.trim().length > 0 ? "warn" : "bad",
    },
    {
      label: "Published / Scheduled",
      earned: status === "published" ? 10 : status === "scheduled" ? 6 : 0,
      max: 10,
      tip: "Draft stories are invisible to readers — publish or schedule to go live",
      status: status === "published" ? "good" : status === "scheduled" ? "warn" : "bad",
    },
  ];

  // ── Discoverability (weight 25%) ──────────────────────────────
  const discoveryItems: ScoreItem[] = [
    {
      label: "Category assigned",
      earned: categoryIds.length > 0 ? 25 : 0,
      max: 25,
      tip: "A category is required — readers browse and filter by category",
      status: categoryIds.length > 0 ? "good" : "bad",
    },
    {
      label: "Tags (5+)",
      earned: tags.length >= 7 ? 22 : tags.length >= 5 ? 18 : tags.length >= 3 ? 10 : tags.length >= 1 ? 4 : 0,
      max: 22,
      tip: "Use 5–10 specific tags — each tag is a discovery surface for readers",
      status: tags.length >= 5 ? "good" : tags.length >= 3 ? "warn" : "bad",
    },
    {
      label: "Gender pairing",
      earned: genderPairing ? 18 : 0,
      max: 18,
      tip: "Readers heavily filter by gender pairing — fill this in to appear in those results",
      status: genderPairing ? "good" : "bad",
    },
    {
      label: "POV",
      earned: pov ? 12 : 0,
      max: 12,
      tip: "Many readers prefer a specific POV — setting this helps them find your story",
      status: pov ? "good" : "bad",
    },
    {
      label: "Maturity rating",
      earned: maturityRating ? 10 : 0,
      max: 10,
      tip: "Always set a maturity rating — it's a required filter on browse pages",
      status: maturityRating ? "good" : "bad",
    },
    {
      label: "Cover image",
      earned: coverImage ? 13 : 0,
      max: 13,
      tip: "Stories with covers get significantly more clicks from listing pages",
      status: coverImage ? "good" : "bad",
    },
  ];

  const seoScore = normalize(seoItems);
  const contentScore = normalize(contentItems);
  const discoveryScore = normalize(discoveryItems);

  // Weighted overall: Content 45%, SEO 30%, Discovery 25%
  const overall = Math.round(contentScore * 0.45 + seoScore * 0.30 + discoveryScore * 0.25);

  return {
    categories: [
      { label: "SEO", score: seoScore, color: "#6366f1", items: seoItems },
      { label: "Content", score: contentScore, color: "#c4426a", items: contentItems },
      { label: "Discovery", score: discoveryScore, color: "#f59e0b", items: discoveryItems },
    ],
    overall,
  };
}

export function getTopTips(result: StoryScoreResult, limit = 4): ScoreItem[] {
  return result.categories
    .flatMap((c) => c.items)
    .filter((i) => i.status !== "good")
    .sort((a, b) => (b.max - b.earned) - (a.max - a.earned))
    .slice(0, limit);
}
