import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import {
  AUTO_COLLECTION_SLUGS,
  makeCategoryCollectionSlug,
  makeTagCollectionSlug,
} from "@/lib/collections";
import { allAlternativeSlugs } from "@/data/alternatives";

export const revalidate = 3600; // regenerate at most once per hour

const BASE = "https://lustpages.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stories, categories, authors, series, tags, collections] = await Promise.all([
    prisma.story.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      where: { stories: { some: { published: true } } },
      select: { slug: true },
    }),
    prisma.author.findMany({ select: { slug: true } }),
    prisma.series.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.tag.findMany({
      where: { isApproved: true, isKeyword: false, stories: { some: { published: true } } },
      select: { slug: true },
      take: 100, // top display tags only — keeps sitemap focused
      orderBy: { stories: { _count: "desc" } },
    }),
    prisma.collection.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/stories`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/collections`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE}/series`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/trending`, lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },
    { url: `${BASE}/authors`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/tags`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/search`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/premium/stories`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE}/store`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/terms`, lastModified: new Date("2026-05-26"), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: new Date("2026-05-26"), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/content-warning`, lastModified: new Date("2026-05-26"), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/dmca`, lastModified: new Date("2026-08-21"), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/about`, lastModified: new Date("2026-08-21"), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/contact`, lastModified: new Date("2026-08-21"), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/faq`, lastModified: new Date("2026-08-21"), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/alternatives`, lastModified: new Date("2026-07-26"), changeFrequency: "monthly", priority: 0.7 },
    ...allAlternativeSlugs.map((slug) => ({
      url: `${BASE}/alternatives/${slug}`,
      lastModified: new Date("2026-07-26"),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];

  const storyPages: MetadataRoute.Sitemap = stories.map((s) => ({
    url: `${BASE}/stories/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE}/categories/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const authorPages: MetadataRoute.Sitemap = authors.map((a) => ({
    url: `${BASE}/authors/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const seriesPages: MetadataRoute.Sitemap = series.map((s) => ({
    url: `${BASE}/series/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const tagPages: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${BASE}/tags/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Auto-collections: computed live, refresh daily
  const autoCollectionPages: MetadataRoute.Sitemap = AUTO_COLLECTION_SLUGS.map((slug) => ({
    url: `${BASE}/collections/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Category collections: best-of-[category-slug], refresh weekly (rating changes slowly)
  const categoryCollectionPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE}/collections/${makeCategoryCollectionSlug(c.slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.78,
  }));

  // Tag collections: best-tag-[tag-slug], refresh weekly
  const tagCollectionPages: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${BASE}/collections/${makeTagCollectionSlug(t.slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }));

  // Editorial collections: hand-curated, refresh weekly
  const editorialCollectionPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${BASE}/collections/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  return [
    ...staticPages,
    ...storyPages,
    ...categoryPages,
    ...authorPages,
    ...seriesPages,
    ...tagPages,
    ...autoCollectionPages,
    ...categoryCollectionPages,
    ...tagCollectionPages,
    ...editorialCollectionPages,
  ];
}
