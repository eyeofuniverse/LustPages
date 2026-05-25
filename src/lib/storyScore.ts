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
  contentWarnings: string[];
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
    genderPairing, pov, contentWarnings, maturityRating,
    series, authorNote, status, visibility,
  } = input;

  const tags = parseTags(tagsRaw);
  const wc = wordCount(content);
  const titleKeywords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const tagString = tags.join(" ").toLowerCase();
  const kwMatches = titleKeywords.filter((w) => tagString.includes(w)).length;
  const paraCount = (content.match(/<\/p>/g) || []).length;

  // ── SEO (max ~86 points → normalized to 100) ─────────────────
  const seoItems: ScoreItem[] = [
    {
      label: "Title length",
      earned: title.length >= 25 && title.length <= 70 ? 10 : title.length >= 10 ? 5 : 0,
      max: 10,
      tip: "Aim for 25–70 characters — long enough to include keywords, short enough to display fully in search results",
      status: title.length >= 25 && title.length <= 70 ? "good" : title.length >= 10 ? "warn" : "bad",
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

  // ── Content (max ~90 points → normalized) ────────────────────
  const contentItems: ScoreItem[] = [
    {
      label: "Word count",
      earned: wc >= 3000 ? 28 : wc >= 1500 ? 22 : wc >= 800 ? 14 : wc >= 300 ? 6 : 0,
      max: 28,
      tip: `${wc.toLocaleString()} words — 1,500+ is a satisfying read; 3,000+ performs best`,
      status: wc >= 1500 ? "good" : wc >= 500 ? "warn" : "bad",
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
      earned: authorNote.trim().length >= 30 ? 12 : authorNote.trim().length > 0 ? 6 : 0,
      max: 12,
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
    {
      label: "Part of a series",
      earned: series.trim().length > 0 ? 6 : 0,
      max: 6,
      tip: "Series entries get repeat readers — link this story to a series if applicable",
      status: series.trim().length > 0 ? "good" : "warn",
    },
  ];

  // ── Discoverability (max ~90 points → normalized) ─────────────
  const discoveryItems: ScoreItem[] = [
    {
      label: "Category assigned",
      earned: categoryIds.length > 0 ? 22 : 0,
      max: 22,
      tip: "A category is required — readers browse and filter by category",
      status: categoryIds.length > 0 ? "good" : "bad",
    },
    {
      label: "Tags (5+)",
      earned: tags.length >= 7 ? 20 : tags.length >= 5 ? 16 : tags.length >= 3 ? 10 : tags.length >= 1 ? 4 : 0,
      max: 20,
      tip: "Use 5–10 specific tags — each tag is a discovery surface for readers",
      status: tags.length >= 5 ? "good" : tags.length >= 3 ? "warn" : "bad",
    },
    {
      label: "Gender pairing",
      earned: genderPairing ? 14 : 0,
      max: 14,
      tip: "Readers heavily filter by gender pairing — fill this in to appear in those results",
      status: genderPairing ? "good" : "warn",
    },
    {
      label: "POV",
      earned: pov ? 10 : 0,
      max: 10,
      tip: "Many readers prefer a specific POV — setting this helps them find your story",
      status: pov ? "good" : "warn",
    },
    {
      label: "Content warnings",
      earned: contentWarnings.length >= 2 ? 12 : contentWarnings.length >= 1 ? 8 : 0,
      max: 12,
      tip: "Content warnings build trust and help readers self-select appropriately",
      status: contentWarnings.length >= 2 ? "good" : contentWarnings.length >= 1 ? "warn" : "bad",
    },
    {
      label: "Maturity rating",
      earned: maturityRating ? 8 : 0,
      max: 8,
      tip: "Always set a maturity rating — it's a required filter on browse pages",
      status: maturityRating ? "good" : "bad",
    },
    {
      label: "Cover image",
      earned: coverImage ? 14 : 0,
      max: 14,
      tip: "Stories with covers get significantly more clicks from listing pages",
      status: coverImage ? "good" : "bad",
    },
  ];

  const seoScore = normalize(seoItems);
  const contentScore = normalize(contentItems);
  const discoveryScore = normalize(discoveryItems);

  // Weighted overall: SEO 40%, Content 40%, Discovery 20%
  const overall = Math.round(seoScore * 0.4 + contentScore * 0.4 + discoveryScore * 0.2);

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
